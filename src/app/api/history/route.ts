import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface HistoryEntry {
  id: string;
  domain: string;
  date: string;
  overallScore: number;
  seoScore: number;
  linksScore: number;
  usabilityScore: number;
  performanceScore: number;
  socialScore: number;
  contentScore?: number;
  eeatScore?: number;
  auditId?: string;
}

// Fallback in-memory storage for when database is unavailable
const historyStorage = new Map<string, HistoryEntry[]>();

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");
    const limit = parseInt(searchParams.get("limit") || "30");

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    let history: HistoryEntry[] = [];

    // Try to get from database first
    try {
      const whereClause: any = { 
        domain: domain,
        status: "COMPLETED",
        overallScore: { not: null }
      };
      
      // Filter by userId if user is authenticated
      if (user) {
        whereClause.userId = user.id;
      }

      const audits = await prisma.audit.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          domain: true,
          createdAt: true,
          overallScore: true,
          seoScore: true,
          linksScore: true,
          usabilityScore: true,
          performanceScore: true,
          socialScore: true,
          contentScore: true,
          eeatScore: true,
        }
      });

      history = audits.map((audit: any) => ({
        id: `hist_${audit.id}`,
        domain: audit.domain,
        date: audit.createdAt.toISOString(),
        overallScore: audit.overallScore || 0,
        seoScore: audit.seoScore || 0,
        linksScore: audit.linksScore || 0,
        usabilityScore: audit.usabilityScore || 0,
        performanceScore: audit.performanceScore || 0,
        socialScore: audit.socialScore || 0,
        contentScore: audit.contentScore || undefined,
        eeatScore: audit.eeatScore || undefined,
        auditId: audit.id,
      }));
    } catch (dbError) {
      console.log("Database unavailable, using in-memory storage:", dbError);
      // Fallback to in-memory storage
      history = historyStorage.get(domain) || [];
    }
    
    // Sort by date descending and limit - deduplicate by auditId
    const seenAuditIds = new Set<string>();
    const deduplicatedHistory = history.filter(entry => {
      if (!entry.auditId) return true;
      if (seenAuditIds.has(entry.auditId)) return false;
      seenAuditIds.add(entry.auditId);
      return true;
    });

    const sortedHistory = deduplicatedHistory
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    // Calculate trends
    const trends = calculateTrends(sortedHistory);

    return NextResponse.json({
      domain,
      history: sortedHistory,
      trends,
      totalAudits: sortedHistory.length,
    });
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json(
      { error: "Failed to get history", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, auditData, auditId } = body;

    if (!domain || !auditData) {
      return NextResponse.json({ error: "Domain and audit data are required" }, { status: 400 });
    }

    const entryAuditId = auditId || auditData.id;
    
    // Check if this audit already exists in database (prevent duplicates)
    if (entryAuditId) {
      try {
        const existingAudit = await prisma.audit.findUnique({
          where: { id: entryAuditId },
          select: { id: true }
        });
        
        if (existingAudit) {
          // Audit already exists in database, no need to save separately
          return NextResponse.json({
            success: true,
            message: "Audit already tracked in database",
            duplicate: true,
          });
        }
      } catch (dbError) {
        console.log("Database check failed, using in-memory:", dbError);
      }
    }
    
    // Fallback: Check in-memory storage
    const existing = historyStorage.get(domain) || [];
    
    if (entryAuditId && existing.some(e => e.auditId === entryAuditId)) {
      return NextResponse.json({
        success: true,
        message: "Audit already in history",
        duplicate: true,
      });
    }

    const entry: HistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      domain,
      date: new Date().toISOString(),
      overallScore: auditData.overallScore,
      seoScore: auditData.seoScore,
      linksScore: auditData.linksScore,
      usabilityScore: auditData.usabilityScore,
      performanceScore: auditData.performanceScore,
      socialScore: auditData.socialScore,
      contentScore: auditData.contentScore,
      eeatScore: auditData.eeatScore,
      auditId: entryAuditId,
    };

    existing.push(entry);
    
    // Keep only last 100 entries per domain
    if (existing.length > 100) {
      existing.shift();
    }
    
    historyStorage.set(domain, existing);

    return NextResponse.json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error("History save error:", error);
    return NextResponse.json(
      { error: "Failed to save history", details: String(error) },
      { status: 500 }
    );
  }
}

function calculateTrends(history: HistoryEntry[]): Record<string, { change: number; trend: string }> {
  if (history.length < 2) {
    return {
      overall: { change: 0, trend: "stable" },
      seo: { change: 0, trend: "stable" },
      performance: { change: 0, trend: "stable" },
    };
  }

  const latest = history[0];
  const previous = history[1];

  const calculateChange = (current: number, prev: number) => {
    const change = current - prev;
    const trend = change > 0 ? "up" : change < 0 ? "down" : "stable";
    return { change, trend };
  };

  return {
    overall: calculateChange(latest.overallScore, previous.overallScore),
    seo: calculateChange(latest.seoScore, previous.seoScore),
    links: calculateChange(latest.linksScore, previous.linksScore),
    usability: calculateChange(latest.usabilityScore, previous.usabilityScore),
    performance: calculateChange(latest.performanceScore, previous.performanceScore),
    social: calculateChange(latest.socialScore, previous.socialScore),
    ...(latest.contentScore !== undefined && previous.contentScore !== undefined
      ? { content: calculateChange(latest.contentScore, previous.contentScore) }
      : {}),
    ...(latest.eeatScore !== undefined && previous.eeatScore !== undefined
      ? { eeat: calculateChange(latest.eeatScore, previous.eeatScore) }
      : {}),
  };
}

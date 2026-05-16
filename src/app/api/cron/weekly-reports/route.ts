import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, EMAIL_TEMPLATES } from "@/lib/email-engine";
import { logger } from "@/lib/logger";

const log = logger.child({ service: "weekly-reports" });

export const dynamic = "force-dynamic";

// Verify cron secret to prevent unauthorized access
function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  // Vercel cron sends this header
  if (request.headers.get("x-vercel-cron") === "true") return true;
  return false;
}

export async function GET(request: Request) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    log.info("Starting weekly report generation");

    // Get all users with PRO+ plans who have audits
    const users = await prisma.user.findMany({
      where: { plan: { in: ["PRO", "AGENCY", "WHITE_LABEL"] } },
      select: { id: true, email: true, name: true },
    });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Get latest audit per domain
        const recentAudits = await prisma.audit.findMany({
          where: { userId: user.id, status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          take: 5,
          distinct: ["domain"],
        });

        if (recentAudits.length === 0) continue;

        const now = new Date();
        const weekNumber = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
        const period = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;

        // Check if report already sent this week
        const existing = await prisma.weeklyReport.findFirst({
          where: { userId: user.id, period },
        });
        if (existing) continue;

        for (const audit of recentAudits) {
          const reportData = {
            domain: audit.domain,
            overallScore: audit.overallScore || 0,
            seoScore: audit.seoScore,
            performanceScore: audit.performanceScore,
            contentScore: audit.contentScore,
            auditDate: audit.createdAt.toISOString(),
          };

          // Save report record
          await prisma.weeklyReport.create({
            data: {
              userId: user.id,
              domain: audit.domain,
              reportData,
              period,
              emailSentTo: user.email,
              emailSentAt: new Date(),
            },
          });

          // Send email
          const template = EMAIL_TEMPLATES.weeklyReport({
            userName: user.name || "User",
            domain: audit.domain,
            score: audit.overallScore || 0,
            reportUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://seoaudit.app"}/reports`,
          });

          await sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.html,
          });

          sent++;
        }
      } catch (error) {
        log.error(`Failed to generate report for user ${user.id}`, error);
        failed++;
      }
    }

    log.info(`Weekly reports completed: ${sent} sent, ${failed} failed`);
    return NextResponse.json({ success: true, sent, failed });
  } catch (error) {
    log.error("Weekly report cron failed", error);
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";

// ============================================================================
// PDF REPORT V3.0 - 3 Styles, Agency Branding, Modern UI/UX
// ============================================================================

type ReportStyle = "modern" | "executive" | "minimal";

interface AgencyBranding {
  companyName?: string;
  website?: string;
  email?: string;
  phone?: string;
  tagline?: string;
  primaryColor?: string; // hex like "#4F46E5"
  accentColor?: string;  // hex like "#8B5CF6"
}

interface AuditData {
  domain?: string;
  overallScore?: number;
  overallGrade?: string;
  crawlType?: string;
  pagesScanned?: number;
  createdAt?: string;
  reportStyle?: ReportStyle;
  agencyBranding?: AgencyBranding;
  // Legacy category scores
  localSeoScore?: number;
  seoScore?: number;
  linksScore?: number;
  usabilityScore?: number;
  performanceScore?: number;
  socialScore?: number;
  contentScore?: number;
  eeatScore?: number;
  technologyScore?: number;
  technicalSeoScore?: number;
  // Big 5 merged categories
  mergedCategories?: {
    localSeo?: { score: number };
    onPageContent?: { score: number };
    technicalHealth?: { score: number };
    performanceSpeed?: { score: number };
    authorityTrust?: { score: number };
  };
  passedChecks?: number;
  warningChecks?: number;
  failedChecks?: number;
  internalLinks?: number;
  externalLinks?: number;
  brokenLinks?: number;
  recommendations?: Array<{
    title: string;
    category: string;
    priority: string;
    description?: string;
    impact?: string;
    howToFix?: string;
  }>;
  includeSections?: {
    technicalDetails?: boolean;
    competitorAnalysis?: boolean;
    linkAnalysis?: boolean;
    authorityTrust?: boolean;
  };
}

// ============================================================================
// HEX -> RGB helper
// ============================================================================
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

// ============================================================================
// DESIGN SYSTEM
// ============================================================================
const COLORS = {
  white: [255, 255, 255] as [number, number, number],
  background: [250, 251, 252] as [number, number, number],
  
  // Text hierarchy
  textPrimary: [15, 23, 42] as [number, number, number],      // slate-900
  textSecondary: [71, 85, 105] as [number, number, number],   // slate-600
  textMuted: [148, 163, 184] as [number, number, number],     // slate-400
  
  // Brand colors
  primary: [79, 70, 229] as [number, number, number],         // indigo-600
  primaryLight: [99, 102, 241] as [number, number, number],   // indigo-500
  primaryDark: [55, 48, 163] as [number, number, number],     // indigo-800
  
  // Semantic colors
  success: [22, 163, 74] as [number, number, number],         // green-600
  successLight: [220, 252, 231] as [number, number, number],  // green-100
  warning: [217, 119, 6] as [number, number, number],         // amber-600
  warningLight: [254, 243, 199] as [number, number, number],  // amber-100
  error: [220, 38, 38] as [number, number, number],           // red-600
  errorLight: [254, 226, 226] as [number, number, number],    // red-100
  info: [37, 99, 235] as [number, number, number],            // blue-600
  infoLight: [219, 234, 254] as [number, number, number],     // blue-100
  
  // UI colors
  border: [226, 232, 240] as [number, number, number],        // slate-200
  borderLight: [241, 245, 249] as [number, number, number],   // slate-100
  accent: [139, 92, 246] as [number, number, number],         // violet-500
};

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================
const MARGIN = 20; // 20mm margins on all sides
const CONTENT_WIDTH = 170; // A4 width (210) - margins (40)

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function getScoreColor(score: number): [number, number, number] {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.error;
}

function getScoreBgColor(score: number): [number, number, number] {
  if (score >= 80) return COLORS.successLight;
  if (score >= 60) return COLORS.warningLight;
  return COLORS.errorLight;
}

function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Improvement";
}

function getPriorityColor(priority: string): [number, number, number] {
  switch (priority.toLowerCase()) {
    case "critical":
    case "high": return COLORS.error;
    case "medium": return COLORS.warning;
    default: return COLORS.info;
  }
}

function getPriorityBgColor(priority: string): [number, number, number] {
  switch (priority.toLowerCase()) {
    case "critical":
    case "high": return COLORS.errorLight;
    case "medium": return COLORS.warningLight;
    default: return COLORS.infoLight;
  }
}

function getPriorityLabel(priority: string): string {
  switch (priority.toLowerCase()) {
    case "critical": return "CRITICAL";
    case "high": return "HIGH";
    case "medium": return "MEDIUM";
    default: return "LOW";
  }
}

// Strip emojis and unicode characters that jsPDF can't render
function stripEmojis(text: string): string {
  if (!text) return text;
  // Remove emojis, symbols, and other non-ASCII characters that jsPDF can't render
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols Extended-A
    .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch, Hourglass
    .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Various symbols
    .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // Various symbols
    .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
    .replace(/[\u{25B6}]/gu, '')            // Play button
    .replace(/[\u{25C0}]/gu, '')            // Reverse button
    .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // Squares
    .replace(/[\u{2614}-\u{2615}]/gu, '')   // Umbrella, Hot beverage
    .replace(/[\u{2648}-\u{2653}]/gu, '')   // Zodiac
    .replace(/[\u{267F}]/gu, '')            // Wheelchair
    .replace(/[\u{2693}]/gu, '')            // Anchor
    .replace(/[\u{26A1}]/gu, '')            // High voltage
    .replace(/[\u{26AA}-\u{26AB}]/gu, '')   // Circles
    .replace(/[\u{26BD}-\u{26BE}]/gu, '')   // Soccer, Baseball
    .replace(/[\u{26C4}-\u{26C5}]/gu, '')   // Snowman, Sun
    .replace(/[\u{26CE}]/gu, '')            // Ophiuchus
    .replace(/[\u{26D4}]/gu, '')            // No entry
    .replace(/[\u{26EA}]/gu, '')            // Church
    .replace(/[\u{26F2}-\u{26F3}]/gu, '')   // Fountain, Golf
    .replace(/[\u{26F5}]/gu, '')            // Sailboat
    .replace(/[\u{26FA}]/gu, '')            // Tent
    .replace(/[\u{26FD}]/gu, '')            // Fuel pump
    .replace(/[\u{2702}]/gu, '')            // Scissors
    .replace(/[\u{2705}]/gu, '')            // Check mark
    .replace(/[\u{2708}-\u{270D}]/gu, '')   // Airplane to Writing hand
    .replace(/[\u{270F}]/gu, '')            // Pencil
    .replace(/[\u{2712}]/gu, '')            // Black nib
    .replace(/[\u{2714}]/gu, '')            // Check mark
    .replace(/[\u{2716}]/gu, '')            // X mark
    .replace(/[\u{271D}]/gu, '')            // Latin cross
    .replace(/[\u{2721}]/gu, '')            // Star of David
    .replace(/[\u{2728}]/gu, '')            // Sparkles
    .replace(/[\u{2733}-\u{2734}]/gu, '')   // Eight spoked asterisk
    .replace(/[\u{2744}]/gu, '')            // Snowflake
    .replace(/[\u{2747}]/gu, '')            // Sparkle
    .replace(/[\u{274C}]/gu, '')            // Cross mark
    .replace(/[\u{274E}]/gu, '')            // Cross mark
    .replace(/[\u{2753}-\u{2755}]/gu, '')   // Question marks
    .replace(/[\u{2757}]/gu, '')            // Exclamation mark
    .replace(/[\u{2763}-\u{2764}]/gu, '')   // Heart exclamation, Heart
    .replace(/[\u{2795}-\u{2797}]/gu, '')   // Plus, Minus, Divide
    .replace(/[\u{27A1}]/gu, '')            // Right arrow
    .replace(/[\u{27B0}]/gu, '')            // Curly loop
    .replace(/[\u{27BF}]/gu, '')            // Double curly loop
    .replace(/[\u{2934}-\u{2935}]/gu, '')   // Arrows
    .replace(/[\u{2B05}-\u{2B07}]/gu, '')   // Arrows
    .replace(/[\u{2B1B}-\u{2B1C}]/gu, '')   // Squares
    .replace(/[\u{2B50}]/gu, '')            // Star
    .replace(/[\u{2B55}]/gu, '')            // Circle
    .replace(/[\u{3030}]/gu, '')            // Wavy dash
    .replace(/[\u{303D}]/gu, '')            // Part alternation mark
    .replace(/[\u{3297}]/gu, '')            // Circled Ideograph Congratulation
    .replace(/[\u{3299}]/gu, '')            // Circled Ideograph Secret
    .replace(/[\u{00A9}\u{00AE}]/gu, '')    // Copyright, Registered
    .replace(/[\u{2122}]/gu, '')            // Trademark
    .replace(/\s+/g, ' ')                   // Normalize whitespace
    .trim();
}

// ============================================================================
// PDF DRAWING HELPERS
// ============================================================================
class PDFReportV3 {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private yPos: number = MARGIN;
  private currentPage: number = 1;
  private totalPages: number = 0;
  private auditData: AuditData;
  private domain: string;
  private overallScore: number;
  private grade: string;
  private createdDate: Date;
  private style: ReportStyle;
  private branding: AgencyBranding;
  private brandPrimary: [number, number, number];
  private brandAccent: [number, number, number];

  constructor(auditData: AuditData) {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.auditData = auditData;
    this.domain = auditData.domain || "Website";
    this.overallScore = auditData.overallScore ?? 0;
    this.grade = auditData.overallGrade || getGrade(this.overallScore);
    this.createdDate = auditData.createdAt ? new Date(auditData.createdAt) : new Date();
    this.style = auditData.reportStyle || "modern";
    this.branding = auditData.agencyBranding || {};
    this.brandPrimary = this.branding.primaryColor ? hexToRgb(this.branding.primaryColor) : COLORS.primary;
    this.brandAccent = this.branding.accentColor ? hexToRgb(this.branding.accentColor) : COLORS.accent;
  }

  private get brandName(): string {
    return this.branding.companyName || "SEO Audit Tool";
  }

  // Draw page header with branding
  private drawPageHeader(showDomain: boolean = true) {
    // Client URL on left
    if (showDomain) {
      this.doc.setFontSize(9);
      this.doc.setTextColor(...COLORS.textSecondary);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(this.domain, MARGIN, 12);
    }

    // Agency/SaaS branding on right
    this.doc.setFontSize(8);
    this.doc.setTextColor(...this.brandPrimary);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(this.brandName, this.pageWidth - MARGIN, 12, { align: "right" });

    // Subtle horizontal separator line
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN, 16, this.pageWidth - MARGIN, 16);
  }

  // Draw page footer
  private drawPageFooter(pageNum: number, totalPages: number) {
    const footerY = this.pageHeight - 12;

    // Separator line - use brand color for modern style
    if (this.style === "modern") {
      this.doc.setDrawColor(...this.brandPrimary);
      this.doc.setLineWidth(0.5);
    } else {
      this.doc.setDrawColor(...COLORS.border);
      this.doc.setLineWidth(0.3);
    }
    this.doc.line(MARGIN, footerY - 5, this.pageWidth - MARGIN, footerY - 5);

    // Page number on right
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.textMuted);
    this.doc.text(`${pageNum} / ${totalPages}`, this.pageWidth - MARGIN, footerY, { align: "right" });

    // Agency branding on left
    this.doc.setFontSize(7);
    const footerText = this.branding.companyName 
      ? `Prepared by ${this.branding.companyName}${this.branding.website ? ' | ' + this.branding.website : ''}`
      : "Generated by SEO Audit Tool | Automated results should be verified by an expert.";
    this.doc.setTextColor(...COLORS.textMuted);
    this.doc.text(footerText, MARGIN, footerY, { align: "left" });

    // Contact info line for agency
    if (this.branding.email || this.branding.phone) {
      const contactParts: string[] = [];
      if (this.branding.email) contactParts.push(this.branding.email);
      if (this.branding.phone) contactParts.push(this.branding.phone);
      this.doc.text(contactParts.join(" | "), MARGIN, footerY + 4);
    }
  }

  // Check if we need a new page
  private checkPageBreak(neededHeight: number) {
    if (this.yPos + neededHeight > this.pageHeight - 25) {
      this.doc.addPage();
      this.currentPage++;
      this.yPos = 25;
      this.drawPageHeader();
    }
  }

  // Draw section title
  private drawSectionTitle(title: string, icon?: string) {
    this.checkPageBreak(20);
    
    // Section title with accent bar
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(MARGIN, this.yPos, 3, 12, "F");
    
    this.doc.setFontSize(14);
    this.doc.setTextColor(...COLORS.textPrimary);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, MARGIN + 8, this.yPos + 9);
    
    this.yPos += 18;
  }

  // Draw semi-circle gauge (speedometer style)
  private drawHealthGauge(x: number, y: number, radius: number, score: number) {
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    const scoreAngle = startAngle + (score / 100) * Math.PI;
    
    // Background arc (gray)
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(8);
    const segments = 50;
    for (let i = 0; i < segments; i++) {
      const angle1 = startAngle + (i / segments) * Math.PI;
      const angle2 = startAngle + ((i + 1) / segments) * Math.PI;
      const x1 = x + radius * Math.cos(angle1);
      const y1 = y + radius * Math.sin(angle1);
      const x2 = x + radius * Math.cos(angle2);
      const y2 = y + radius * Math.sin(angle2);
      
      if (angle1 < scoreAngle) {
        const [r, g, b] = getScoreColor(score);
        this.doc.setDrawColor(r, g, b);
      } else {
        this.doc.setDrawColor(...COLORS.borderLight);
      }
      this.doc.line(x1, y1, x2, y2);
    }
    
    // Score text in center
    this.doc.setFontSize(28);
    this.doc.setTextColor(...getScoreColor(score));
    this.doc.setFont("helvetica", "bold");
    this.doc.text(String(score), x, y + 5, { align: "center" });
    
    // Label
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.textSecondary);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("out of 100", x, y + 14, { align: "center" });
  }

  // Draw elegant grade stamp
  private drawGradeStamp(x: number, y: number, grade: string, score: number) {
    const [r, g, b] = getScoreColor(score);
    
    // Outer circle (thin elegant border)
    this.doc.setDrawColor(r, g, b);
    this.doc.setLineWidth(2);
    this.doc.circle(x, y, 25, "S");
    
    // Inner circle
    this.doc.setDrawColor(r, g, b);
    this.doc.setLineWidth(0.5);
    this.doc.circle(x, y, 21, "S");
    
    // Grade letter
    this.doc.setFontSize(24);
    this.doc.setTextColor(r, g, b);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(grade, x, y + 8, { align: "center" });
  }

  // Draw checkmark icon
  private drawCheckIcon(x: number, y: number, size: number, color: [number, number, number]) {
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(size * 0.15);
    // Draw checkmark path
    this.doc.line(x - size * 0.35, y, x - size * 0.1, y + size * 0.25);
    this.doc.line(x - size * 0.1, y + size * 0.25, x + size * 0.35, y - size * 0.3);
  }

  // Draw warning triangle icon
  private drawWarningIcon(x: number, y: number, size: number, color: [number, number, number]) {
    this.doc.setFillColor(...color);
    // Draw triangle
    const h = size * 0.9;
    const w = size;
    this.doc.triangle(x, y - h/2, x - w/2, y + h/3, x + w/2, y + h/3, "F");
    // Draw exclamation mark (white)
    this.doc.setFillColor(...COLORS.white);
    this.doc.rect(x - size * 0.06, y - h/4, size * 0.12, h * 0.35, "F");
    this.doc.circle(x, y + h * 0.15, size * 0.08, "F");
  }

  // Draw X/cross icon
  private drawCrossIcon(x: number, y: number, size: number, color: [number, number, number]) {
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(size * 0.15);
    // Draw X
    this.doc.line(x - size * 0.3, y - size * 0.3, x + size * 0.3, y + size * 0.3);
    this.doc.line(x + size * 0.3, y - size * 0.3, x - size * 0.3, y + size * 0.3);
  }

  // Draw traffic light indicator with graphic icons
  private drawTrafficLight(x: number, y: number, count: number, label: string, type: "passed" | "warning" | "error") {
    const colors = {
      passed: { bg: COLORS.successLight, text: COLORS.success },
      warning: { bg: COLORS.warningLight, text: COLORS.warning },
      error: { bg: COLORS.errorLight, text: COLORS.error },
    };
    const c = colors[type];
    
    // Background pill
    this.doc.setFillColor(...c.bg);
    this.doc.roundedRect(x, y, 50, 45, 4, 4, "F");
    
    // Icon circle background
    this.doc.setFillColor(...c.text);
    this.doc.circle(x + 25, y + 14, 8, "F");
    
    // Draw appropriate icon inside circle
    const iconX = x + 25;
    const iconY = y + 14;
    const iconSize = 6;
    
    if (type === "passed") {
      this.drawCheckIcon(iconX, iconY, iconSize, COLORS.white);
    } else if (type === "warning") {
      // For warning, draw exclamation in white
      this.doc.setFillColor(...COLORS.white);
      this.doc.rect(iconX - 1, iconY - 4, 2, 5, "F");
      this.doc.circle(iconX, iconY + 3, 1.2, "F");
    } else {
      this.drawCrossIcon(iconX, iconY, iconSize, COLORS.white);
    }
    
    // Count
    this.doc.setTextColor(...c.text);
    this.doc.setFontSize(18);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(String(count), x + 25, y + 35, { align: "center" });
    
    // Label
    this.doc.setFontSize(7);
    this.doc.setTextColor(...COLORS.textSecondary);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(label, x + 25, y + 42, { align: "center" });
  }

  // Draw donut chart
  private drawDonutChart(x: number, y: number, radius: number, data: { value: number; color: [number, number, number]; label: string }[]) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return;
    
    let currentAngle = -Math.PI / 2; // Start from top
    const innerRadius = radius * 0.6;
    
    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const endAngle = currentAngle + sliceAngle;
      
      // Draw arc segments
      this.doc.setFillColor(...item.color);
      const segments = Math.max(Math.ceil(sliceAngle * 20), 2);
      
      for (let i = 0; i < segments; i++) {
        const a1 = currentAngle + (i / segments) * sliceAngle;
        const a2 = currentAngle + ((i + 1) / segments) * sliceAngle;
        
        const x1 = x + radius * Math.cos(a1);
        const y1 = y + radius * Math.sin(a1);
        const x2 = x + radius * Math.cos(a2);
        const y2 = y + radius * Math.sin(a2);
        const x3 = x + innerRadius * Math.cos(a2);
        const y3 = y + innerRadius * Math.sin(a2);
        const x4 = x + innerRadius * Math.cos(a1);
        const y4 = y + innerRadius * Math.sin(a1);
        
        // Draw as filled polygon
        this.doc.setFillColor(...item.color);
        // Using lines to approximate the arc
        this.doc.line(x1, y1, x2, y2);
      }
      
      currentAngle = endAngle;
    });
    
    // Draw center circle (white)
    this.doc.setFillColor(...COLORS.white);
    this.doc.circle(x, y, innerRadius, "F");
  }

  // Draw category icon
  private drawCategoryIcon(x: number, y: number, category: string, color: [number, number, number]) {
    this.doc.setDrawColor(...color);
    this.doc.setFillColor(...color);
    this.doc.setLineWidth(0.5);
    
    const s = 4; // icon size
    
    switch(category.toLowerCase()) {
      case "local seo":
        // Map pin icon
        this.doc.circle(x, y - s * 0.3, s * 0.4, "F");
        this.doc.triangle(x, y + s * 0.7, x - s * 0.3, y, x + s * 0.3, y, "F");
        break;
      case "on-page & content":
      case "on-page seo":
        // Document/page icon
        this.doc.rect(x - s * 0.4, y - s * 0.5, s * 0.8, s, "S");
        this.doc.line(x - s * 0.25, y - s * 0.2, x + s * 0.25, y - s * 0.2);
        this.doc.line(x - s * 0.25, y + s * 0.1, x + s * 0.25, y + s * 0.1);
        break;
      case "technical health":
      case "technical seo":
        // Gear/cog icon (simplified)
        this.doc.circle(x, y, s * 0.3, "S");
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          this.doc.line(
            x + Math.cos(angle) * s * 0.3,
            y + Math.sin(angle) * s * 0.3,
            x + Math.cos(angle) * s * 0.5,
            y + Math.sin(angle) * s * 0.5
          );
        }
        break;
      case "performance":
        // Lightning bolt / speed icon
        this.doc.line(x + s * 0.2, y - s * 0.5, x - s * 0.1, y);
        this.doc.line(x - s * 0.1, y, x + s * 0.1, y);
        this.doc.line(x + s * 0.1, y, x - s * 0.2, y + s * 0.5);
        break;
      case "authority & trust":
      case "links":
        // Shield icon
        this.doc.setLineWidth(0.6);
        // Draw shield shape
        this.doc.line(x, y - s * 0.5, x - s * 0.4, y - s * 0.3);
        this.doc.line(x - s * 0.4, y - s * 0.3, x - s * 0.4, y + s * 0.1);
        this.doc.line(x - s * 0.4, y + s * 0.1, x, y + s * 0.5);
        this.doc.line(x, y + s * 0.5, x + s * 0.4, y + s * 0.1);
        this.doc.line(x + s * 0.4, y + s * 0.1, x + s * 0.4, y - s * 0.3);
        this.doc.line(x + s * 0.4, y - s * 0.3, x, y - s * 0.5);
        break;
      default:
        // Star icon
        this.doc.circle(x, y, s * 0.4, "S");
    }
  }

  // Draw category scorecard
  private drawScorecard(x: number, y: number, width: number, name: string, score: number, icon?: string) {
    // Cap score at 100
    const cappedScore = Math.min(100, Math.max(0, score));
    const [r, g, b] = getScoreColor(cappedScore);
    const [br, bg, bb] = getScoreBgColor(cappedScore);
    
    // Card background
    this.doc.setFillColor(...COLORS.white);
    this.doc.setDrawColor(...COLORS.border);
    this.doc.roundedRect(x, y, width, 55, 3, 3, "FD");
    
    // Category icon at top
    this.drawCategoryIcon(x + width / 2, y + 10, name, COLORS.primary);
    
    // Score circle
    this.doc.setFillColor(br, bg, bb);
    this.doc.circle(x + width / 2, y + 28, 12, "F");
    
    this.doc.setFontSize(12);
    this.doc.setTextColor(r, g, b);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(String(cappedScore), x + width / 2, y + 32, { align: "center" });
    
    // Category name
    this.doc.setFontSize(7);
    this.doc.setTextColor(...COLORS.textSecondary);
    this.doc.setFont("helvetica", "normal");
    const lines = this.doc.splitTextToSize(name, width - 6);
    this.doc.text(lines, x + width / 2, y + 48, { align: "center" });
  }

  // Draw priority icon (arrow or warning)
  private drawPriorityIcon(x: number, y: number, priority: string) {
    const [r, g, b] = getPriorityColor(priority);
    this.doc.setFillColor(r, g, b);
    this.doc.setDrawColor(r, g, b);
    this.doc.setLineWidth(0.8);
    
    const s = 3; // icon size
    const pLower = priority.toLowerCase();
    
    if (pLower === "critical" || pLower === "high") {
      // Upward arrow (urgent)
      this.doc.triangle(x, y - s, x - s * 0.6, y + s * 0.3, x + s * 0.6, y + s * 0.3, "F");
      this.doc.rect(x - s * 0.2, y + s * 0.3, s * 0.4, s * 0.5, "F");
    } else if (pLower === "medium") {
      // Right arrow (moderate)
      this.doc.triangle(x + s * 0.5, y, x - s * 0.2, y - s * 0.5, x - s * 0.2, y + s * 0.5, "F");
      this.doc.rect(x - s * 0.7, y - s * 0.15, s * 0.5, s * 0.3, "F");
    } else {
      // Down arrow (low priority)
      this.doc.triangle(x, y + s * 0.3, x - s * 0.5, y - s * 0.4, x + s * 0.5, y - s * 0.4, "F");
      this.doc.rect(x - s * 0.15, y - s * 0.7, s * 0.3, s * 0.4, "F");
    }
  }

  // Draw recommendation card
  private drawRecommendationCard(rec: NonNullable<AuditData["recommendations"]>[0], index: number) {
    const cardHeight = rec.description || rec.howToFix ? 65 : 45;
    this.checkPageBreak(cardHeight + 5);
    
    const [pr, pg, pb] = getPriorityColor(rec.priority);
    const [pbr, pbg, pbb] = getPriorityBgColor(rec.priority);
    
    // Card background
    this.doc.setFillColor(...COLORS.white);
    this.doc.setDrawColor(...COLORS.border);
    this.doc.roundedRect(MARGIN, this.yPos, CONTENT_WIDTH, cardHeight, 3, 3, "FD");
    
    // Priority indicator bar on left
    this.doc.setFillColor(pr, pg, pb);
    this.doc.rect(MARGIN, this.yPos, 3, cardHeight, "F");
    
    // Priority icon
    this.drawPriorityIcon(MARGIN + 14, this.yPos + 10, rec.priority);
    
    // Priority pill
    this.doc.setFillColor(pbr, pbg, pbb);
    this.doc.roundedRect(MARGIN + 22, this.yPos + 5, 30, 10, 2, 2, "F");
    this.doc.setFontSize(6);
    this.doc.setTextColor(pr, pg, pb);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(getPriorityLabel(rec.priority), MARGIN + 37, this.yPos + 11.5, { align: "center" });
    
    // Category badge
    this.doc.setFillColor(...COLORS.borderLight);
    this.doc.roundedRect(MARGIN + 55, this.yPos + 5, 35, 10, 2, 2, "F");
    this.doc.setFontSize(6);
    this.doc.setTextColor(...COLORS.textSecondary);
    this.doc.setFont("helvetica", "normal");
    const catText = rec.category.length > 10 ? rec.category.substring(0, 10) + "..." : rec.category;
    this.doc.text(catText.toUpperCase(), MARGIN + 72.5, this.yPos + 11.5, { align: "center" });
    
    // Title - strip emojis to prevent rendering issues
    this.doc.setFontSize(11);
    this.doc.setTextColor(...COLORS.textPrimary);
    this.doc.setFont("helvetica", "bold");
    const cleanTitle = stripEmojis(rec.title);
    const titleLines = this.doc.splitTextToSize(cleanTitle, CONTENT_WIDTH - 20);
    this.doc.text(titleLines[0], MARGIN + 8, this.yPos + 26);
    
    // Description (Why it matters) - strip emojis
    if (rec.description || rec.impact) {
      const desc = stripEmojis(rec.description || rec.impact || "");
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.textSecondary);
      this.doc.setFont("helvetica", "italic");
      const descLines = this.doc.splitTextToSize(`Why it matters: ${desc}`, CONTENT_WIDTH - 20);
      this.doc.text(descLines.slice(0, 2), MARGIN + 8, this.yPos + 35);
    }
    
    // How to fix - strip emojis
    if (rec.howToFix) {
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.textPrimary);
      this.doc.setFont("helvetica", "normal");
      const cleanFix = stripEmojis(rec.howToFix);
      const fixLines = this.doc.splitTextToSize(`Fix: ${cleanFix}`, CONTENT_WIDTH - 20);
      this.doc.text(fixLines.slice(0, 2), MARGIN + 8, this.yPos + 50);
    }
    
    this.yPos += cardHeight + 5;
  }

  // Draw zebra-striped table
  private drawTable(headers: string[], rows: string[][], colWidths: number[]) {
    const rowHeight = 10;
    const headerHeight = 12;
    
    this.checkPageBreak(headerHeight + rowHeight * Math.min(rows.length, 5));
    
    // Header row
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(MARGIN, this.yPos, CONTENT_WIDTH, headerHeight, "F");
    
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFont("helvetica", "bold");
    
    let xOffset = MARGIN + 5;
    headers.forEach((header, i) => {
      this.doc.text(header, xOffset, this.yPos + 8);
      xOffset += colWidths[i];
    });
    
    this.yPos += headerHeight;
    
    // Data rows with zebra striping
    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(rowHeight);
      
      // Zebra stripe
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(...COLORS.borderLight);
        this.doc.rect(MARGIN, this.yPos, CONTENT_WIDTH, rowHeight, "F");
      }
      
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.textPrimary);
      this.doc.setFont("helvetica", "normal");
      
      xOffset = MARGIN + 5;
      row.forEach((cell, i) => {
        // Right-align numbers
        const isNumber = !isNaN(Number(cell));
        if (isNumber) {
          this.doc.text(cell, xOffset + colWidths[i] - 10, this.yPos + 7, { align: "right" });
        } else {
          const truncated = cell.length > 30 ? cell.substring(0, 30) + "..." : cell;
          this.doc.text(truncated, xOffset, this.yPos + 7);
        }
        xOffset += colWidths[i];
      });
      
      this.yPos += rowHeight;
    });
  }

  // ============================================================================
  // COVER PAGE - Style-aware with agency branding
  // ============================================================================
  private drawCoverPage() {
    this.doc.setFillColor(...COLORS.white);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, "F");

    if (this.style === "modern") this.drawCoverModern();
    else if (this.style === "executive") this.drawCoverExecutive();
    else this.drawCoverMinimal();
  }

  // --- MODERN cover: bold gradient header band, large score ring ---
  private drawCoverModern() {
    // Top gradient band
    this.doc.setFillColor(...this.brandPrimary);
    this.doc.rect(0, 0, this.pageWidth, 80, "F");
    // Accent overlay strip
    this.doc.setFillColor(...this.brandAccent);
    this.doc.rect(0, 72, this.pageWidth, 8, "F");

    // Agency / brand name
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(this.brandName.toUpperCase(), MARGIN, 20);

    if (this.branding.tagline) {
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(this.branding.tagline, MARGIN, 28);
    }

    // Title
    this.doc.setFontSize(26);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("SEO Health Report", MARGIN, 52);

    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("Comprehensive Website Analysis", MARGIN, 64);

    // Domain pill
    let y = 100;
    this.doc.setFillColor(...COLORS.borderLight);
    this.doc.setDrawColor(...this.brandPrimary);
    this.doc.setLineWidth(0.8);
    this.doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 20, 5, 5, "FD");
    this.doc.setFontSize(12);
    this.doc.setTextColor(...this.brandPrimary);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(stripEmojis(this.domain), this.pageWidth / 2, y + 13, { align: "center" });

    y += 35;

    // Large score ring
    this.drawHealthGauge(this.pageWidth / 2, y + 30, 40, this.overallScore);
    y += 70;

    // Grade stamp
    this.drawGradeStamp(this.pageWidth / 2, y + 5, this.grade, this.overallScore);
    y += 40;

    // Score label
    this.doc.setFontSize(13);
    this.doc.setTextColor(...getScoreColor(this.overallScore));
    this.doc.setFont("helvetica", "bold");
    this.doc.text(getScoreLabel(this.overallScore), this.pageWidth / 2, y, { align: "center" });
    y += 20;

    // Metadata grid
    this.drawMetadataGrid(y);

    // Footer
    this.drawCoverFooter();
  }

  // --- EXECUTIVE cover: clean, serif-feel, professional ---
  private drawCoverExecutive() {
    // Thin top line
    this.doc.setFillColor(...this.brandPrimary);
    this.doc.rect(0, 0, this.pageWidth, 3, "F");

    // Left accent bar
    this.doc.setFillColor(...this.brandPrimary);
    this.doc.rect(MARGIN, 40, 4, 50, "F");

    let y = 50;
    this.doc.setFontSize(11);
    this.doc.setTextColor(...this.brandPrimary);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(this.brandName.toUpperCase(), MARGIN + 12, y);

    if (this.branding.tagline) {
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...COLORS.textSecondary);
      this.doc.text(this.branding.tagline, MARGIN + 12, y + 8);
    }

    y += 20;
    this.doc.setFontSize(28);
    this.doc.setTextColor(...COLORS.textPrimary);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("SEO Audit Report", MARGIN + 12, y);

    y += 12;
    this.doc.setFontSize(12);
    this.doc.setTextColor(...COLORS.textSecondary);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(stripEmojis(this.domain), MARGIN + 12, y);

    // Horizontal rule
    y += 12;
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.5);
    this.doc.line(MARGIN, y, this.pageWidth - MARGIN, y);

    // Score section - centered
    y += 25;
    this.drawGradeStamp(this.pageWidth / 2, y + 20, this.grade, this.overallScore);
    y += 55;
    this.drawHealthGauge(this.pageWidth / 2, y + 20, 35, this.overallScore);
    y += 55;

    this.doc.setFontSize(12);
    this.doc.setTextColor(...getScoreColor(this.overallScore));
    this.doc.setFont("helvetica", "bold");
    this.doc.text(getScoreLabel(this.overallScore), this.pageWidth / 2, y, { align: "center" });
    y += 20;

    this.drawMetadataGrid(y);
    this.drawCoverFooter();
  }

  // --- MINIMAL cover: lots of whitespace, typography-first ---
  private drawCoverMinimal() {
    let y = 60;

    // Brand
    this.doc.setFontSize(9);
    this.doc.setTextColor(...this.brandPrimary);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(this.brandName, MARGIN, y);

    y += 30;
    this.doc.setFontSize(32);
    this.doc.setTextColor(...COLORS.textPrimary);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("SEO Health", MARGIN, y);
    y += 14;
    this.doc.text("Report", MARGIN, y);

    y += 20;
    this.doc.setFontSize(14);
    this.doc.setTextColor(...COLORS.textSecondary);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(stripEmojis(this.domain), MARGIN, y);

    y += 10;
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.textMuted);
    this.doc.text(this.createdDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), MARGIN, y);

    // Score on the right side
    const scoreX = this.pageWidth - MARGIN - 30;
    this.drawGradeStamp(scoreX, 90, this.grade, this.overallScore);

    this.doc.setFontSize(36);
    this.doc.setTextColor(...getScoreColor(this.overallScore));
    this.doc.setFont("helvetica", "bold");
    this.doc.text(String(this.overallScore), scoreX, 140, { align: "center" });

    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.textMuted);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("/ 100", scoreX + 18, 140);

    // Divider
    y += 25;
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN, y, this.pageWidth - MARGIN, y);

    y += 20;

    // Stats in a single row
    const passedCount = this.auditData.passedChecks ?? Math.round(this.overallScore / 10);
    const warningCount = this.auditData.warningChecks ?? Math.round((100 - this.overallScore) / 25);
    const failedCount = this.auditData.failedChecks ?? Math.round((100 - this.overallScore) / 15);

    const stats = [
      { label: "Passed", value: String(passedCount), color: COLORS.success },
      { label: "Warnings", value: String(warningCount), color: COLORS.warning },
      { label: "Issues", value: String(failedCount), color: COLORS.error },
      { label: "Pages", value: this.auditData.pagesScanned ? String(this.auditData.pagesScanned) : "1" , color: COLORS.info },
    ];

    const colW = CONTENT_WIDTH / stats.length;
    stats.forEach((s, i) => {
      const cx = MARGIN + colW * i + colW / 2;
      this.doc.setFontSize(22);
      this.doc.setTextColor(...s.color);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(s.value, cx, y, { align: "center" });
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.textMuted);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(s.label, cx, y + 8, { align: "center" });
    });

    this.drawCoverFooter();
  }

  // Shared helpers
  private drawMetadataGrid(y: number) {
    const colWidth = (this.pageWidth - 80) / 3;
    const startX = 40;
    this.doc.setFillColor(...COLORS.borderLight);
    this.doc.roundedRect(startX, y, this.pageWidth - 80, 35, 4, 4, "F");

    const metaItems = [
      { label: "Date", value: this.createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
      { label: "Pages Analyzed", value: this.auditData.pagesScanned ? String(this.auditData.pagesScanned) : "1" },
      { label: "Crawl Type", value: this.auditData.crawlType || "Quick Audit" },
    ];

    metaItems.forEach((item, i) => {
      const x = startX + colWidth * i + colWidth / 2;
      if (i > 0) {
        this.doc.setDrawColor(...COLORS.border);
        this.doc.setLineWidth(0.3);
        this.doc.line(startX + colWidth * i, y + 5, startX + colWidth * i, y + 30);
      }
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.textMuted);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(item.label, x, y + 12, { align: "center" });
      this.doc.setFontSize(11);
      this.doc.setTextColor(...COLORS.textPrimary);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(item.value, x, y + 25, { align: "center" });
    });
  }

  private drawCoverFooter() {
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.textMuted);
    this.doc.setFont("helvetica", "normal");
    const footerLine = this.branding.companyName
      ? `Powered by ${this.branding.companyName}${this.branding.website ? ' | ' + this.branding.website : ''}`
      : "Powered by SEO Audit Tool";
    this.doc.text(footerLine, this.pageWidth / 2, this.pageHeight - 15, { align: "center" });
  }

  // ============================================================================
  // EXECUTIVE SUMMARY PAGE
  // ============================================================================
  private drawExecutiveSummary() {
    this.doc.addPage();
    this.currentPage++;
    this.yPos = 25;
    this.drawPageHeader();
    
    this.drawSectionTitle("Executive Summary");
    
    // Traffic Light System
    const passedCount = this.auditData.passedChecks ?? Math.round(this.overallScore / 10);
    const warningCount = this.auditData.warningChecks ?? Math.round((100 - this.overallScore) / 25);
    const failedCount = this.auditData.failedChecks ?? Math.round((100 - this.overallScore) / 15);
    
    const trafficStartX = MARGIN + (CONTENT_WIDTH - 170) / 2;
    this.drawTrafficLight(trafficStartX, this.yPos, passedCount, "Passed", "passed");
    this.drawTrafficLight(trafficStartX + 60, this.yPos, warningCount, "Warnings", "warning");
    this.drawTrafficLight(trafficStartX + 120, this.yPos, failedCount, "Critical Issues", "error");
    
    this.yPos += 55;
    
    // Quick Wins Section
    this.drawSectionTitle("Priority Actions (Quick Wins)");
    
    const highPriorityRecs = (this.auditData.recommendations || [])
      .filter(r => r.priority.toLowerCase() === "high" || r.priority.toLowerCase() === "critical")
      .slice(0, 3);
    
    if (highPriorityRecs.length > 0) {
      highPriorityRecs.forEach((rec, i) => {
        this.checkPageBreak(25);
        
        // Numbered box
        this.doc.setFillColor(...COLORS.errorLight);
        this.doc.roundedRect(MARGIN, this.yPos, CONTENT_WIDTH, 22, 3, 3, "F");
        
        // Number circle
        this.doc.setFillColor(...COLORS.error);
        this.doc.circle(MARGIN + 12, this.yPos + 11, 7, "F");
        this.doc.setFontSize(10);
        this.doc.setTextColor(...COLORS.white);
        this.doc.setFont("helvetica", "bold");
        this.doc.text(String(i + 1), MARGIN + 12, this.yPos + 14.5, { align: "center" });
        
        // Title - strip emojis
        this.doc.setFontSize(10);
        this.doc.setTextColor(...COLORS.textPrimary);
        this.doc.setFont("helvetica", "bold");
        const cleanTitle = stripEmojis(rec.title);
        const titleText = this.doc.splitTextToSize(cleanTitle, CONTENT_WIDTH - 35);
        this.doc.text(titleText[0], MARGIN + 25, this.yPos + 14);
        
        this.yPos += 26;
      });
    } else {
      this.doc.setFontSize(10);
      this.doc.setTextColor(...COLORS.success);
      this.doc.setFont("helvetica", "normal");
      // No emoji - jsPDF can't render them
      this.doc.text("No critical issues found! Your site is performing well.", MARGIN, this.yPos + 10);
      this.yPos += 20;
    }
    
    this.yPos += 10;
    
    // Key Insight Box
    this.doc.setFillColor(...COLORS.infoLight);
    this.doc.roundedRect(MARGIN, this.yPos, CONTENT_WIDTH, 30, 4, 4, "F");
    
    // Info icon with graphic "i"
    this.doc.setFillColor(...COLORS.info);
    this.doc.circle(MARGIN + 12, this.yPos + 15, 6, "F");
    // Draw "i" icon
    this.doc.setFillColor(...COLORS.white);
    this.doc.circle(MARGIN + 12, this.yPos + 12.5, 1, "F"); // dot
    this.doc.rect(MARGIN + 11, this.yPos + 14, 2, 5, "F"); // stem
    
    // Insight text
    const insightText = this.overallScore >= 80 
      ? "Excellent SEO health! Focus on maintaining current practices and addressing minor optimizations."
      : this.overallScore >= 60 
      ? "Good foundation with room for growth. Address high-priority issues first for best results."
      : "Significant improvements needed. Start with the critical issues listed above to boost visibility.";
    
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.info);
    this.doc.setFont("helvetica", "normal");
    const insightLines = this.doc.splitTextToSize(insightText, CONTENT_WIDTH - 30);
    this.doc.text(insightLines, MARGIN + 22, this.yPos + 12);
    
    this.yPos += 40;
  }

  // ============================================================================
  // CATEGORY PERFORMANCE PAGE
  // ============================================================================
  private drawCategoryPerformance() {
    this.checkPageBreak(120);
    
    this.drawSectionTitle("Performance by Category");
    
    // Build categories array - use Big 5 merged categories if available, otherwise legacy
    const categories: { name: string; score: number; icon: string }[] = [];
    const merged = this.auditData.mergedCategories;
    
    if (merged && (merged.localSeo || merged.onPageContent || merged.technicalHealth || merged.performanceSpeed || merged.authorityTrust)) {
      // Big 5 Categories
      if (merged.localSeo) {
        categories.push({ name: "Local SEO", score: merged.localSeo.score, icon: "LOC" });
      }
      if (merged.onPageContent) {
        categories.push({ name: "On-Page & Content", score: merged.onPageContent.score, icon: "SEO" });
      }
      if (merged.technicalHealth) {
        categories.push({ name: "Technical Health", score: merged.technicalHealth.score, icon: "TEC" });
      }
      if (merged.performanceSpeed) {
        categories.push({ name: "Performance", score: merged.performanceSpeed.score, icon: "SPD" });
      }
      if (merged.authorityTrust) {
        categories.push({ name: "Authority & Trust", score: merged.authorityTrust.score, icon: "TRS" });
      }
    } else {
      // Legacy categories fallback
      if (this.auditData.localSeoScore !== undefined && this.auditData.localSeoScore !== null) {
        categories.push({ name: "Local SEO", score: this.auditData.localSeoScore, icon: "LOC" });
      }
      categories.push({ name: "On-Page SEO", score: this.auditData.seoScore ?? 0, icon: "SEO" });
      
      if (this.auditData.technicalSeoScore !== undefined && this.auditData.technicalSeoScore !== null) {
        categories.push({ name: "Technical SEO", score: this.auditData.technicalSeoScore, icon: "TEC" });
      }
      
      categories.push({ name: "Performance", score: this.auditData.performanceScore ?? 0, icon: "SPD" });
      categories.push({ name: "Links", score: this.auditData.linksScore ?? 0, icon: "LNK" });
    }
    
    // 2x3 Grid of Scorecards
    const cardWidth = (CONTENT_WIDTH - 10) / 3; // 3 cards per row with gaps
    const cardGap = 5;
    
    categories.forEach((cat, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      
      if (col === 0 && i > 0) {
        this.yPos += 60;
        this.checkPageBreak(60);
      }
      
      const x = MARGIN + col * (cardWidth + cardGap);
      const y = this.yPos;
      
      this.drawScorecard(x, y, cardWidth, cat.name, cat.score);
    });
    
    this.yPos += 65;
  }

  // ============================================================================
  // DETAILED RECOMMENDATIONS PAGE
  // ============================================================================
  private drawDetailedRecommendations() {
    const recs = this.auditData.recommendations || [];
    if (recs.length === 0) return;
    
    this.doc.addPage();
    this.currentPage++;
    this.yPos = 25;
    this.drawPageHeader();
    
    this.drawSectionTitle("Detailed Recommendations");
    
    // Group by priority
    const critical = recs.filter(r => r.priority.toLowerCase() === "critical");
    const high = recs.filter(r => r.priority.toLowerCase() === "high");
    const medium = recs.filter(r => r.priority.toLowerCase() === "medium");
    const low = recs.filter(r => r.priority.toLowerCase() === "low" || (!["critical", "high", "medium"].includes(r.priority.toLowerCase())));
    
    const printGroup = (items: typeof recs, label: string) => {
      if (items.length === 0) return;
      
      this.checkPageBreak(20);
      
      // Group header
      this.doc.setFontSize(11);
      this.doc.setTextColor(...COLORS.textPrimary);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(`${label} (${items.length})`, MARGIN, this.yPos + 5);
      this.yPos += 12;
      
      items.slice(0, 10).forEach((rec, i) => {
        this.drawRecommendationCard(rec, i);
      });
      
      if (items.length > 10) {
        this.doc.setFontSize(8);
        this.doc.setTextColor(...COLORS.textMuted);
        this.doc.text(`+ ${items.length - 10} more ${label.toLowerCase()} items...`, MARGIN, this.yPos);
        this.yPos += 10;
      }
      
      this.yPos += 5;
    };
    
    printGroup(critical, "Critical Priority");
    printGroup(high, "High Priority");
    printGroup(medium, "Medium Priority");
    printGroup(low, "Low Priority");
  }

  // ============================================================================
  // LINK ANALYSIS PAGE
  // ============================================================================
  private drawLinkAnalysis() {
    if (!this.auditData.includeSections?.linkAnalysis) return;
    
    const internal = this.auditData.internalLinks ?? 0;
    const external = this.auditData.externalLinks ?? 0;
    const broken = this.auditData.brokenLinks ?? 0;
    const total = internal + external + broken;
    
    if (total === 0) return;
    
    this.checkPageBreak(80);
    
    this.drawSectionTitle("Link Analysis");
    
    // Table for link data
    const headers = ["Link Type", "Count", "Percentage"];
    const rows = [
      ["Internal Links", String(internal), `${total > 0 ? Math.round((internal / total) * 100) : 0}%`],
      ["External Links", String(external), `${total > 0 ? Math.round((external / total) * 100) : 0}%`],
      ["Broken Links", String(broken), `${total > 0 ? Math.round((broken / total) * 100) : 0}%`],
    ];
    
    this.drawTable(headers, rows, [80, 45, 45]);
    
    this.yPos += 15;
  }

  // ============================================================================
  // CALL TO ACTION PAGE - Agency branded
  // ============================================================================
  private drawCallToAction() {
    this.doc.addPage();
    this.currentPage++;
    this.yPos = 60;
    this.drawPageHeader(false);
    
    // What's Next? Header
    this.doc.setFontSize(24);
    this.doc.setTextColor(...COLORS.textPrimary);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("What's Next?", this.pageWidth / 2, this.yPos, { align: "center" });
    
    this.yPos += 25;
    
    // CTA Box - uses brand colors
    this.doc.setFillColor(...this.brandPrimary);
    this.doc.roundedRect(30, this.yPos, this.pageWidth - 60, 80, 6, 6, "F");
    
    this.yPos += 20;
    
    this.doc.setFontSize(14);
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFont("helvetica", "bold");
    const ctaHeading = this.branding.companyName 
      ? `Let ${this.branding.companyName} Help You Rank Higher`
      : "Need Help Fixing These Issues?";
    this.doc.text(ctaHeading, this.pageWidth / 2, this.yPos, { align: "center" });
    
    this.yPos += 15;
    
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    const ctaText = this.branding.companyName
      ? `Our SEO experts at ${this.branding.companyName} can implement these recommendations and boost your search visibility.`
      : "Our team of SEO experts can help you implement these recommendations and improve your search rankings.";
    const ctaLines = this.doc.splitTextToSize(ctaText, this.pageWidth - 80);
    this.doc.text(ctaLines, this.pageWidth / 2, this.yPos, { align: "center" });
    
    this.yPos += 30;
    
    // Contact info box
    this.doc.setFillColor(...COLORS.white);
    const contactBoxW = 140;
    this.doc.roundedRect(this.pageWidth / 2 - contactBoxW / 2, this.yPos - 5, contactBoxW, 25, 4, 4, "F");
    
    this.doc.setFontSize(11);
    this.doc.setTextColor(...this.brandPrimary);
    this.doc.setFont("helvetica", "bold");
    const contactLabel = this.branding.email || this.branding.website || this.branding.phone || "Get Started Today";
    this.doc.text(contactLabel, this.pageWidth / 2, this.yPos + 10, { align: "center" });
    
    this.yPos += 50;
    
    // Summary stats box
    this.doc.setFillColor(...COLORS.borderLight);
    this.doc.roundedRect(30, this.yPos, this.pageWidth - 60, 50, 4, 4, "F");
    
    this.yPos += 15;
    
    this.doc.setFontSize(12);
    this.doc.setTextColor(...COLORS.textPrimary);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Audit Summary", this.pageWidth / 2, this.yPos, { align: "center" });
    
    this.yPos += 15;
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.textSecondary);
    this.doc.setFont("helvetica", "normal");
    
    const summaryItems = [
      `Overall Score: ${this.overallScore}/100 (Grade ${this.grade})`,
      `Total Recommendations: ${this.auditData.recommendations?.length || 0}`,
      `Report Generated: ${this.createdDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    ];
    
    summaryItems.forEach((item, i) => {
      this.doc.text(item, this.pageWidth / 2, this.yPos + i * 8, { align: "center" });
    });
  }

  // ============================================================================
  // GENERATE FULL REPORT
  // ============================================================================
  public generate(): ArrayBuffer {
    // Page 1: Cover
    this.drawCoverPage();
    
    // Page 2: Executive Summary
    this.drawExecutiveSummary();
    
    // Category Performance (continues on same page if space)
    this.drawCategoryPerformance();
    
    // Link Analysis (if enabled)
    this.drawLinkAnalysis();
    
    // Detailed Recommendations
    this.drawDetailedRecommendations();
    
    // Final Page: CTA
    this.drawCallToAction();
    
    // Add footers to all pages
    this.totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= this.totalPages; i++) {
      this.doc.setPage(i);
      if (i > 1) { // Skip cover page footer
        this.drawPageFooter(i, this.totalPages);
      }
    }
    
    return this.doc.output("arraybuffer");
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[PDF API V2] Starting PDF generation");
    const body = await request.json();
    const auditData: AuditData = body.auditData;
    
    console.log("[PDF API V2] Audit data received:", JSON.stringify(auditData, null, 2).substring(0, 500));

    if (!auditData) {
      console.error("[PDF API V2] No audit data provided");
      return NextResponse.json({ error: "Audit data is required" }, { status: 400 });
    }

    // Use the new PDFReportV2 class for clean, print-first design
    const report = new PDFReportV3(auditData);
    const pdfBuffer = report.generate();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="seo-audit-${auditData.domain || "report"}-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[PDF API V2] PDF generation error:", error);
    console.error("[PDF API V2] Error stack:", error instanceof Error ? error.stack : "No stack available");
    return NextResponse.json(
      { error: "Failed to generate PDF", details: String(error) },
      { status: 500 }
    );
  }
}

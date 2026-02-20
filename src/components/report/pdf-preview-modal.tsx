"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Loader2,
  X,
  CheckCircle2,
  Circle,
  Sparkles,
  FileBarChart,
  Shield,
  Settings2,
  Zap,
  Palette,
  Building2,
  ChevronDown,
} from "lucide-react";

type ReportStyle = "modern" | "executive" | "minimal";

interface AgencyBranding {
  companyName: string;
  website: string;
  email: string;
  phone: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
}

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditData: Record<string, unknown>;
}

interface SectionOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const STYLE_OPTIONS: { id: ReportStyle; label: string; description: string; accent: string }[] = [
  { id: "modern", label: "Modern", description: "Bold header band, vibrant colors", accent: "from-indigo-500 to-purple-500" },
  { id: "executive", label: "Executive", description: "Clean & professional, serif feel", accent: "from-slate-700 to-slate-900" },
  { id: "minimal", label: "Minimal", description: "Typography-first, lots of whitespace", accent: "from-gray-400 to-gray-600" },
];

export function PDFPreviewModal({ isOpen, onClose, auditData }: PDFPreviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<ReportStyle>("modern");
  const [showBranding, setShowBranding] = useState(false);
  const [branding, setBranding] = useState<AgencyBranding>({
    companyName: "", website: "", email: "", phone: "", tagline: "", primaryColor: "#4F46E5", accentColor: "#8B5CF6",
  });
  const [sections, setSections] = useState<SectionOption[]>([
    { id: "executiveSummary", label: "Executive Summary", description: "Score overview, quick wins, and key insights", icon: <Sparkles className="h-4 w-4" />, enabled: true },
    { id: "categoryPerformance", label: "Big 5 Categories", description: "Local SEO, On-Page, Technical, Performance, Authority", icon: <FileBarChart className="h-4 w-4" />, enabled: true },
    { id: "recommendations", label: "Prioritized Recommendations", description: "High, Medium, and Low priority improvements", icon: <Zap className="h-4 w-4" />, enabled: true },
    { id: "authorityTrust", label: "Authority & Trust Details", description: "Links, Social profiles, E-E-A-T signals", icon: <Shield className="h-4 w-4" />, enabled: true },
    { id: "technicalDetails", label: "Technical Health Details", description: "Indexing, SSL, Mobile, Sitemaps analysis", icon: <Settings2 className="h-4 w-4" />, enabled: false },
  ]);

  const extractDomain = (): string => {
    const data = auditData as Record<string, unknown>;
    if (data.domain && typeof data.domain === 'string' && data.domain !== 'Website') return data.domain;
    if (data.url && typeof data.url === 'string') { try { return new URL(data.url).hostname; } catch {} }
    if (data.baseUrl && typeof data.baseUrl === 'string') { try { return new URL(data.baseUrl).hostname; } catch {} }
    if (data.pageClassifications && Array.isArray(data.pageClassifications) && data.pageClassifications.length > 0) {
      const firstPage = data.pageClassifications[0] as { url?: string };
      if (firstPage?.url) { try { return new URL(firstPage.url).hostname; } catch {} }
    }
    if (data.auditMapping) {
      const mapping = data.auditMapping as Record<string, string[]>;
      for (const section of Object.values(mapping)) {
        if (Array.isArray(section) && section.length > 0 && typeof section[0] === 'string') { try { return new URL(section[0]).hostname; } catch {} }
      }
    }
    return "Website";
  };

  const domain = extractDomain();
  const overallScore = (auditData as { overallScore?: number }).overallScore ?? 0;
  const grade = overallScore >= 90 ? "A+" : overallScore >= 80 ? "A" : overallScore >= 70 ? "B" : overallScore >= 60 ? "C" : overallScore >= 50 ? "D" : "F";

  const getScoreColor = (score: number) => { if (score >= 80) return "text-green-600"; if (score >= 60) return "text-amber-600"; return "text-red-600"; };
  const getScoreBg = (score: number) => { if (score >= 80) return "bg-green-100"; if (score >= 60) return "bg-amber-100"; return "bg-red-100"; };
  const toggleSection = (id: string) => { setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)); };

  const computeCheckCounts = () => {
    const data = auditData as Record<string, unknown>;
    let passed = 0, warnings = 0, failed = 0;
    const merged = data.mergedCategories as Record<string, { checks?: Array<{ status?: string }> }> | undefined;
    if (merged) {
      ['localSeo', 'onPageContent', 'technicalHealth', 'performanceSpeed', 'authorityTrust'].forEach(cat => {
        merged[cat]?.checks?.forEach((c: { status?: string }) => {
          if (c.status === 'pass' || c.status === 'passed' || c.status === 'good') passed++;
          else if (c.status === 'warning' || c.status === 'moderate') warnings++;
          else if (c.status === 'fail' || c.status === 'failed' || c.status === 'poor' || c.status === 'error') failed++;
        });
      });
    }
    if (passed === 0 && warnings === 0 && failed === 0) {
      ['localSeo', 'seo', 'links', 'usability', 'performance', 'social', 'content', 'eeat', 'technology'].forEach(cat => {
        const catData = data[cat] as { checks?: Array<{ status?: string }> } | undefined;
        catData?.checks?.forEach((c: { status?: string }) => {
          if (c.status === 'pass' || c.status === 'passed' || c.status === 'good') passed++;
          else if (c.status === 'warning' || c.status === 'moderate') warnings++;
          else if (c.status === 'fail' || c.status === 'failed' || c.status === 'poor' || c.status === 'error') failed++;
        });
      });
    }
    if (passed === 0 && warnings === 0 && failed === 0) {
      const score = (data.overallScore as number) || 50;
      passed = Math.round(score / 10); warnings = Math.round((100 - score) / 20); failed = Math.round((100 - score) / 15);
    }
    return { passed, warnings, failed };
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const counts = computeCheckCounts();
      const includeSections = { technicalDetails: sections.find(s => s.id === "technicalDetails")?.enabled, authorityTrust: sections.find(s => s.id === "authorityTrust")?.enabled };
      const data = auditData as Record<string, unknown>;
      const pagesScanned = data.pagesAnalyzed || data.pagesScanned;
      const crawlType = data.pageClassifications ? "Deep Crawl" : (data.crawlType as string) || "Quick Audit";

      const agencyBranding = showBranding && branding.companyName ? branding : undefined;

      const enrichedData = {
        ...auditData,
        domain: domain !== "Website" ? domain : (data.url ? new URL(data.url as string).hostname : "Website"),
        pagesScanned, crawlType,
        passedChecks: counts.passed, warningChecks: counts.warnings, failedChecks: counts.failed,
        includeSections,
        reportStyle: selectedStyle,
        agencyBranding,
      };

      const response = await fetch("/api/report/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ auditData: enrichedData }) });
      if (!response.ok) { throw new Error(`Failed to generate PDF: ${await response.text()}`); }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const sanitizedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/i, '').replace(/[^a-zA-Z0-9.-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      a.download = `seo-audit-${sanitizedDomain || 'report'}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      onClose();
    } catch (error) {
      console.error("PDF download error:", error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally { setIsGenerating(false); }
  };

  useEffect(() => { if (isOpen) { setPreviewReady(false); const t = setTimeout(() => setPreviewReady(true), 500); return () => clearTimeout(t); } }, [isOpen]);

  if (!isOpen) return null;
  const counts = computeCheckCounts();

  // Style-dependent preview colors
  const styleColors: Record<ReportStyle, { bar: string; accent: string; text: string }> = {
    modern: { bar: "bg-indigo-600", accent: "text-indigo-600", text: "bg-indigo-50" },
    executive: { bar: "bg-slate-800", accent: "text-slate-800", text: "bg-slate-50" },
    minimal: { bar: "bg-gray-400", accent: "text-gray-700", text: "bg-gray-50" },
  };
  const sc = styleColors[selectedStyle];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Generate PDF Report</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Choose style, sections & branding</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* LEFT: Preview */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Cover Preview</h3>
              <div className="bg-white border-2 border-slate-200 rounded-xl shadow-lg overflow-hidden aspect-[8.5/11]">
                {!previewReady ? (
                  <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
                ) : (
                  <div className="h-full flex flex-col">
                    {/* Style-dependent top */}
                    {selectedStyle === "modern" ? (
                      <div className={`${sc.bar} h-16 flex flex-col justify-center px-4`}>
                        <span className="text-white text-[9px] font-bold tracking-widest">{showBranding && branding.companyName ? branding.companyName.toUpperCase() : "SEO AUDIT TOOL"}</span>
                        <span className="text-white/90 text-[11px] font-bold mt-0.5">SEO Health Report</span>
                      </div>
                    ) : selectedStyle === "executive" ? (
                      <>
                        <div className={`${sc.bar} h-1`} />
                        <div className="px-4 pt-3">
                          <span className={`text-[9px] font-bold tracking-widest ${sc.accent}`}>{showBranding && branding.companyName ? branding.companyName.toUpperCase() : "SEO AUDIT TOOL"}</span>
                        </div>
                      </>
                    ) : (
                      <div className="px-4 pt-6">
                        <span className={`text-[8px] font-bold ${sc.accent}`}>{showBranding && branding.companyName ? branding.companyName : "SEO Audit Tool"}</span>
                      </div>
                    )}

                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                      {selectedStyle !== "modern" && <h1 className={`text-lg font-bold text-slate-800 mb-1 ${selectedStyle === "minimal" ? "text-left w-full" : ""}`}>SEO Health Report</h1>}
                      <div className={`${sc.text} px-3 py-1.5 rounded-lg mb-4`}>
                        <span className={`text-xs font-medium ${sc.accent}`}>{domain}</span>
                      </div>
                      <div className={`w-14 h-14 rounded-full border-4 ${getScoreColor(overallScore).replace('text', 'border')} flex items-center justify-center mb-3`}>
                        <span className={`text-xl font-bold ${getScoreColor(overallScore)}`}>{grade}</span>
                      </div>
                      <div className={`${getScoreBg(overallScore)} px-3 py-1.5 rounded-full mb-4`}>
                        <span className={`text-base font-bold ${getScoreColor(overallScore)}`}>{overallScore}</span>
                        <span className="text-xs text-slate-500 ml-1">/ 100</span>
                      </div>
                      <div className="flex gap-2 text-[10px]">
                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded"><span className="font-bold">{counts.passed}</span> Passed</div>
                        <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded"><span className="font-bold">{counts.warnings}</span> Warn</div>
                        <div className="bg-red-100 text-red-700 px-2 py-1 rounded"><span className="font-bold">{counts.failed}</span> Issues</div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 px-4 py-1.5 text-center">
                      <span className="text-[9px] text-slate-400">{showBranding && branding.companyName ? `Powered by ${branding.companyName}` : "Powered by SEO Audit Tool"}</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 text-center">Live preview updates as you configure</p>
            </div>

            {/* RIGHT: Config */}
            <div className="lg:col-span-3 space-y-5">
              {/* Style Picker */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Report Style
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {STYLE_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => setSelectedStyle(opt.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${selectedStyle === opt.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                      <div className={`h-2 rounded-full bg-gradient-to-r ${opt.accent} mb-2`} />
                      <p className={`text-sm font-semibold ${selectedStyle === opt.id ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`}>{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Report Sections */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Sections</h3>
                <div className="space-y-2">
                  {sections.map(section => (
                    <button key={section.id} onClick={() => toggleSection(section.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${section.enabled ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                      <div className={section.enabled ? "text-indigo-600" : "text-slate-400"}>
                        {section.enabled ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={section.enabled ? "text-indigo-600" : "text-slate-400"}>{section.icon}</span>
                          <span className={`font-medium text-sm ${section.enabled ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>{section.label}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{section.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Agency Branding (collapsible) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button onClick={() => setShowBranding(!showBranding)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Agency Branding</p>
                      <p className="text-xs text-slate-500">Add your company name, colors & contact info</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${showBranding ? "rotate-180" : ""}`} />
                </button>

                {showBranding && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Company Name</label>
                        <input type="text" value={branding.companyName} onChange={e => setBranding(p => ({ ...p, companyName: e.target.value }))}
                          placeholder="Your Agency Name" className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Website</label>
                        <input type="text" value={branding.website} onChange={e => setBranding(p => ({ ...p, website: e.target.value }))}
                          placeholder="yoursite.com" className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Email</label>
                        <input type="email" value={branding.email} onChange={e => setBranding(p => ({ ...p, email: e.target.value }))}
                          placeholder="hello@agency.com" className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Phone</label>
                        <input type="tel" value={branding.phone} onChange={e => setBranding(p => ({ ...p, phone: e.target.value }))}
                          placeholder="+1 555 000 0000" className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Tagline</label>
                      <input type="text" value={branding.tagline} onChange={e => setBranding(p => ({ ...p, tagline: e.target.value }))}
                        placeholder="Your SEO & Digital Marketing Partner" className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Primary Color</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input type="color" value={branding.primaryColor} onChange={e => setBranding(p => ({ ...p, primaryColor: e.target.value }))}
                            className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
                          <input type="text" value={branding.primaryColor} onChange={e => setBranding(p => ({ ...p, primaryColor: e.target.value }))}
                            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Accent Color</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input type="color" value={branding.accentColor} onChange={e => setBranding(p => ({ ...p, accentColor: e.target.value }))}
                            className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
                          <input type="text" value={branding.accentColor} onChange={e => setBranding(p => ({ ...p, accentColor: e.target.value }))}
                            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Report Details summary */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Report Details</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Domain</span><span className="font-medium text-slate-700 dark:text-slate-300">{domain}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Score</span><span className={`font-medium ${getScoreColor(overallScore)}`}>{overallScore}/100 ({grade})</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Style</span><span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{selectedStyle}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Sections</span><span className="font-medium text-slate-700 dark:text-slate-300">{sections.filter(s => s.enabled).length} / {sections.length}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500">Print-friendly white background</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium">Cancel</button>
            <button onClick={handleDownload} disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-red-500/20">
              {isGenerating ? (<><Loader2 className="h-4 w-4 animate-spin" />Generating...</>) : (<><Download className="h-4 w-4" />Download PDF</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

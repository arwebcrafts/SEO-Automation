"use client";

import { Check, X, AlertTriangle, Info, ChevronDown, ChevronUp, ExternalLink, Shield, Zap, Link2, FileText, Globe, Eye, Loader2, Wrench, Copy, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { VerificationModal } from "./verification-modal";
import { GoogleSearchPreview } from "./google-search-preview";
import { KeywordConsistencyTable } from "./keyword-consistency-table";
import { HeaderHierarchy } from "./header-hierarchy";
import { useViewMode, TECHNICAL_CHECKS } from "./view-mode-toggle";

// Map check IDs to WordPress fix actions for per-page fixes
const checkToFixAction: Record<string, { action: string; label: string }> = {
  "meta-description": { action: "fix_meta_page", label: "Fix Meta" },
  "metaDescription": { action: "fix_meta_page", label: "Fix Meta" },
  "title-tag": { action: "fix_title_page", label: "Fix Title" },
  "title": { action: "fix_title_page", label: "Fix Title" },
  "image-alt": { action: "fix_alt_text_page", label: "Fix Alt" },
  "imageAlt": { action: "fix_alt_text_page", label: "Fix Alt" },
  "headingStructure": { action: "fix_headings_page", label: "Fix Headings" },
  "heading-structure": { action: "fix_headings_page", label: "Fix Headings" },
  "canonical-tag": { action: "fix_canonical_page", label: "Fix Canonical" },
  "canonicalUrl": { action: "fix_canonical_page", label: "Fix Canonical" },
  // Keywords and content checks - show recommendation only (no auto-fix)
  "keywordPlacement": { action: "fix_keywords_page", label: "View Tips" },
  "keyword-placement": { action: "fix_keywords_page", label: "View Tips" },
  "keywordConsistency": { action: "fix_keywords_page", label: "View Tips" },
  // Broken links - show recommendation
  "brokenLinks": { action: "fix_broken_links_page", label: "View Links" },
  "broken-links": { action: "fix_broken_links_page", label: "View Links" },
};

// Per-Page Fix Button Component with AI-powered issue analysis
interface PerPageFixButtonProps {
  checkId: string;
  pageUrl: string;
  pagePathname: string;
  finding: {
    status: string;
    score: number;
    value: Record<string, unknown>;
    message: string;
  };
  onFixed?: (result: PerPageFixResult) => void;
}

interface PerPageFixResult {
  success: boolean;
  message?: string;
  pageUrl?: string;
  aiSuggestion?: string;
  fixApplied?: boolean;
}

function PerPageFixButton({ checkId, pageUrl, pagePathname, finding, onFixed }: PerPageFixButtonProps) {
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<PerPageFixResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fixInfo = checkToFixAction[checkId];
  if (!fixInfo) return null;
  
  // Only show fix button for issues (not passed checks)
  if (finding.status === 'pass' && finding.score >= 80) return null;

  const handlePerPageFix = async () => {
    const saved = localStorage.getItem('wp_connection_global');
    if (!saved) {
      setResult({ success: false, message: "No WordPress connection" });
      return;
    }

    const { siteUrl, apiKey } = JSON.parse(saved);
    setFixing(true);
    setResult(null);

    // Generate AI-powered fix suggestion based on the issue
    const aiSuggestion = generateAISuggestion(checkId, finding);
    
    console.log(`%c[PerPageFix] Starting fix for: ${pagePathname}`, 'color: #4CAF50; font-weight: bold');
    console.log(`[PerPageFix] Check ID: ${checkId}`);
    console.log(`[PerPageFix] Page URL: ${pageUrl}`);
    console.log(`[PerPageFix] Issue Details:`, finding.value);
    console.log(`[PerPageFix] AI Suggestion:`, aiSuggestion);

    try {
      const requestBody = {
        site_url: siteUrl,
        api_key: apiKey,
        action: fixInfo.action,
        options: {
          page_url: pageUrl,
          page_pathname: pagePathname,
          check_id: checkId,
          current_value: finding.value,
          issue_message: finding.message,
          ai_suggestion: aiSuggestion,
          score: finding.score,
        }
      };

      console.log(`%c[PerPageFix] Request to WordPress:`, 'color: #2196F3; font-weight: bold');
      console.log(JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      console.log(`%c[PerPageFix] Response from WordPress:`, 'color: #9C27B0; font-weight: bold');
      console.log(`[PerPageFix] Status: ${response.status}`);
      console.log(JSON.stringify(data, null, 2));

      const fixResult: PerPageFixResult = {
        success: data.success || response.ok,
        message: data.message || (data.success ? 'Fix applied' : 'Fix failed'),
        pageUrl,
        aiSuggestion,
        fixApplied: data.fixed > 0 || data.success,
      };

      setResult(fixResult);
      onFixed?.(fixResult);
    } catch (error) {
      console.error(`%c[PerPageFix] Error:`, 'color: #F44336; font-weight: bold', error);
      setResult({ success: false, message: "Fix failed - check connection" });
    } finally {
      setFixing(false);
    }
  };

  // Generate AI suggestion based on issue type and current values
  function generateAISuggestion(checkId: string, finding: { value: Record<string, unknown>; message: string }): string {
    const value = finding.value;
    
    switch (checkId) {
      case 'title':
      case 'title-tag': {
        const currentTitle = value.title as string || '';
        const length = value.length as number || currentTitle.length;
        if (length < 30) {
          return `Title is too short (${length} chars). Expand to include primary keyword and make it compelling. Optimal: 30-60 chars. Suggestion: Add descriptive words about the page content.`;
        } else if (length > 60) {
          return `Title is too long (${length} chars). Shorten while keeping the main keyword at the start. Optimal: 30-60 chars. Current: "${currentTitle.substring(0, 50)}..."`;
        }
        return `Optimize title for SEO. Current: "${currentTitle}"`;
      }
      
      case 'meta-description':
      case 'metaDescription': {
        const desc = value.description as string || '';
        const length = value.length as number || desc.length;
        if (length === 0) {
          return `No meta description found. Generate a compelling 120-160 character description that includes the main keyword and a call to action.`;
        } else if (length < 120) {
          return `Meta description too short (${length} chars). Expand to 120-160 chars with more detail about page content.`;
        } else if (length > 160) {
          return `Meta description too long (${length} chars). Shorten to 120-160 chars, keeping the most important info first.`;
        }
        return `Optimize meta description. Current length: ${length} chars.`;
      }
      
      case 'headingStructure':
      case 'heading-structure': {
        const h1Count = value.h1 as number || 0;
        const h2Count = value.h2 as number || 0;
        const h3Count = value.h3 as number || 0;
        if (h1Count === 0) {
          return `Missing H1 tag. Add a single H1 with the primary keyword.`;
        } else if (h1Count > 1) {
          return `Multiple H1 tags found (${h1Count}). Convert extra H1s to H2. Only one H1 per page.`;
        }
        if (h3Count === 0 && h2Count > 3) {
          return `No H3 tags found. Add H3 subheadings to break up content under H2 sections.`;
        }
        return `Heading structure: H1=${h1Count}, H2=${h2Count}, H3=${h3Count}. Consider adding more subheadings.`;
      }
      
      case 'image-alt':
      case 'imageAlt': {
        const missing = value.missingAlt as number || value.imagesWithoutAlt as number || 0;
        return `${missing} images missing alt text. Generate descriptive alt text for each image describing its content.`;
      }
      
      default:
        return `Fix ${checkId} issue. Current: ${finding.message}`;
    }
  }

  if (result) {
    return (
      <div className="relative inline-flex">
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-[10px] rounded-md border transition-colors",
            result.success
              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
          )}
        >
          {result.success ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {result.success ? 'Fixed' : 'Failed'}
        </button>
        {expanded && (
          <div className="absolute top-full left-0 mt-1 z-20 p-2 bg-white dark:bg-slate-800 border rounded-lg shadow-lg text-[10px] min-w-[200px] max-w-[300px]">
            <p className={result.success ? "text-green-600" : "text-red-600"}>{result.message}</p>
            {result.aiSuggestion && (
              <p className="mt-1 text-slate-500 italic">{result.aiSuggestion}</p>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setResult(null); }}
              className="mt-2 text-blue-600 hover:underline"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); handlePerPageFix(); }}
      disabled={fixing}
      className="flex items-center gap-1 px-2 py-1 text-[10px] bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-md hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 transition-all font-medium"
      title={`Fix this issue on ${pagePathname}`}
    >
      {fixing ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Wrench className="w-3 h-3" />
      )}
      {fixing ? 'Fixing...' : fixInfo.label}
    </button>
  );
}

// Expandable Text Component - fixes text truncation issue
function ExpandableText({ text, maxLength = 100, className }: { text: string; maxLength?: number; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!text || text.length <= maxLength) {
    return <span className={className}>{text}</span>;
  }
  
  return (
    <span className={className}>
      {expanded ? text : text.substring(0, maxLength) + '...'}
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="ml-1 text-blue-600 hover:underline text-[10px] font-medium"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </span>
  );
}

interface PerPageFinding {
  url: string;
  pathname: string;
  status: string;
  score: number;
  value: Record<string, unknown>;
  message: string;
}

interface CheckItemProps {
  id: string;
  name: string;
  status: "pass" | "warning" | "fail" | "info";
  message: string;
  value?: Record<string, unknown>;
  forceShow?: boolean;
  sourcePages?: string[];
  perPageFindings?: PerPageFinding[];
}

export function CheckItem({ id, name, status, message, value, forceShow, sourcePages, perPageFindings }: CheckItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showPerPageDetails, setShowPerPageDetails] = useState(false);
  const { viewMode } = useViewMode();
  
  // Hide technical checks in simple mode (unless they have issues)
  const isTechnical = TECHNICAL_CHECKS.includes(id);
  const hasIssue = status === "fail" || status === "warning";
  
  if (viewMode === "simple" && isTechnical && !hasIssue && !forceShow) {
    return null;
  }
  
  const statusConfig = {
    pass: {
      icon: Check,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    fail: {
      icon: X,
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
    info: {
      icon: Info,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // All checks with value data are expandable to show proof of audit
  const hasExpandableContent: boolean = !!(value && Object.keys(value).length > 0);

  const renderExpandedContent = () => {
    if (!value) return null;

    switch (id) {
      case "searchPreview":
        return (
          <GoogleSearchPreview
            title={(value.title as string) || ""}
            url={(value.url as string) || ""}
            description={(value.description as string) || ""}
          />
        );
      
      case "keywordConsistency":
        return (
          <KeywordConsistencyTable
            keywords={(value.keywords as Array<{
              keyword: string;
              frequency: number;
              inTitle: boolean;
              inMeta: boolean;
              inHeaders: boolean;
            }>) || []}
          />
        );
      
      case "headingStructure":
        return (
          <HeaderHierarchy
            h1={value.h1 as number}
            h2={value.h2 as number}
            h3={value.h3 as number}
            h4={value.h4 as number}
            h5={value.h5 as number}
            h6={value.h6 as number}
            skippedLevels={value.skippedLevels as boolean}
            skippedLevelMessage={value.skippedLevelMessage as string}
          />
        );
      
      case "localKeywords":
        return (
          <div className="space-y-3">
            {(value.cities as string[])?.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Cities/Locations:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(value.cities as string[]).map((city, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full">{city}</span>
                  ))}
                </div>
              </div>
            )}
            {(value.services as string[])?.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Services:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(value.services as string[]).map((service, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs rounded-full">{service}</span>
                  ))}
                </div>
              </div>
            )}
            {(value.localPhrases as string[])?.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Local Phrases:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(value.localPhrases as string[]).map((phrase, i) => (
                    <span key={i} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs rounded-full">{phrase}</span>
                  ))}
                </div>
              </div>
            )}
            {value.nearMeOptimized === true && (
              <div className="text-xs text-green-600 dark:text-green-400">✓ Optimized for &quot;near me&quot; searches</div>
            )}
          </div>
        );
      
      case "serviceAreas":
        return (
          <div className="space-y-2">
            {(value.serviceAreas as string[])?.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Detected Service Areas:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(value.serviceAreas as string[]).map((area, i) => (
                    <span key={i} className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs rounded-full">{area}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
              {value.hasServiceAreaPage === true && <span className="text-green-600">✓ Service Area Page</span>}
              {value.hasServiceAreaSchema === true && <span className="text-green-600">✓ Schema</span>}
              {value.hasMultipleLocations === true && <span className="text-blue-600">📍 Multiple Locations</span>}
            </div>
          </div>
        );
      
      case "localBusinessSchema":
        return (
          <div className="space-y-2">
            {typeof value.schemaType === "string" && value.schemaType && (
              <div className="text-xs">
                <span className="font-medium text-muted-foreground">Schema Type:</span>{" "}
                <span className="text-primary">{value.schemaType}</span>
              </div>
            )}
            <div className="text-xs">
              <span className="font-medium text-muted-foreground">Completeness:</span>{" "}
              <span className={cn(
                (value.completeness as number) >= 70 ? "text-green-600" : 
                (value.completeness as number) >= 40 ? "text-yellow-600" : "text-red-600"
              )}>{value.completeness as number}%</span>
            </div>
            {(value.missingFields as string[])?.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Missing Fields:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(value.missingFields as string[]).slice(0, 5).map((field, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs rounded-full">{field}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        // Generic proof of audit display for all other checks
        return (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              Audit Findings & Proof
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(value).map(([key, val]) => {
                // Skip internal or complex nested objects for display
                if (key === 'recommendation' || val === null || val === undefined) return null;
                
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                
                // Handle different value types
                if (typeof val === 'boolean') {
                  // Skip confusing technical security headers - users don't need to see these
                  const skipTechTerms = ['hasHsts', 'hasCsp', 'hasXFrameOptions', 'hasXContentTypeOptions', 'hasReferrerPolicy'];
                  if (skipTechTerms.includes(key)) return null;
                  
                  // Improve URL Structure display with better labels
                  const urlStructureLabels: Record<string, { good: string; bad: string }> = {
                    'hasUnderscores': { good: '✓ No underscores in URL', bad: '✗ Contains underscores' },
                    'hasUppercase': { good: '✓ Lowercase URL', bad: '✗ Contains uppercase' },
                    'hasParameters': { good: '✓ Clean URL (no parameters)', bad: '✗ Has URL parameters' },
                    'hasFileExtension': { good: '✓ No file extension', bad: '✗ Has file extension' },
                  };
                  
                  const urlLabel = urlStructureLabels[key];
                  if (urlLabel) {
                    // For URL structure, false is usually good (no underscores = good)
                    const isGood = !val;
                    return (
                      <div key={key} className="flex items-center gap-2 text-xs p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <span className={cn("w-5 h-5 rounded-full flex items-center justify-center", isGood ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600")}>
                          {isGood ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        </span>
                        <span className="font-medium text-slate-600 dark:text-slate-400">{isGood ? urlLabel.good : urlLabel.bad}</span>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={key} className="flex items-center gap-2 text-xs p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className={cn("w-5 h-5 rounded-full flex items-center justify-center", val ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                        {val ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      </span>
                      <span className="font-medium text-slate-600 dark:text-slate-400">{formattedKey}</span>
                    </div>
                  );
                }
                
                if (Array.isArray(val)) {
                  if (val.length === 0) return null;
                  return (
                    <div key={key} className="col-span-full p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{formattedKey}:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {val.slice(0, 10).map((item, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                            {typeof item === 'string' ? item : JSON.stringify(item)}
                          </span>
                        ))}
                        {val.length > 10 && <span className="text-xs text-slate-500">+{val.length - 10} more</span>}
                      </div>
                    </div>
                  );
                }
                
                if (typeof val === 'number') {
                  const isPercentage = key.toLowerCase().includes('percent') || key.toLowerCase().includes('ratio') || key.toLowerCase().includes('score');
                  const isCount = key.toLowerCase().includes('count') || key.toLowerCase().includes('total') || key.toLowerCase().includes('length');
                  return (
                    <div key={key} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-400">{formattedKey}</span>
                      <span className={cn(
                        "font-bold px-2 py-0.5 rounded",
                        isPercentage && val >= 80 ? "bg-green-100 text-green-700" :
                        isPercentage && val >= 50 ? "bg-yellow-100 text-yellow-700" :
                        isPercentage && val < 50 ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {isPercentage ? `${val}%` : isCount ? val : val}
                      </span>
                    </div>
                  );
                }
                
                if (typeof val === 'string' && val.length > 0) {
                  const isUrl = val.startsWith('http') || val.startsWith('/');
                  return (
                    <div key={key} className={cn("p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs", val.length > 60 && "col-span-full")}>
                      <span className="font-medium text-slate-600 dark:text-slate-400">{formattedKey}:</span>
                      {isUrl ? (
                        <a href={val} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline flex items-center gap-1 mt-1">
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[300px]">{val}</span>
                        </a>
                      ) : (
                        <span className="ml-1 text-slate-800 dark:text-slate-200 break-words">{val.length > 100 ? val.substring(0, 100) + '...' : val}</span>
                      )}
                    </div>
                  );
                }
                
                return null;
              })}
            </div>
            {/* Per-Page Findings Section */}
            {perPageFindings && perPageFindings.length > 1 && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPerPageDetails(!showPerPageDetails);
                  }}
                  className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  {showPerPageDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <Globe className="w-3 h-3" />
                  View findings for each page ({perPageFindings.length} pages)
                </button>
                
                {showPerPageDetails && (
                  <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto">
                    {perPageFindings.map((finding, idx) => {
                      const statusColors = {
                        pass: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                        warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
                        fail: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
                        info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                      };
                      const statusIcons = {
                        pass: <Check className="w-3 h-3 text-green-600" />,
                        warning: <AlertTriangle className="w-3 h-3 text-amber-600" />,
                        fail: <X className="w-3 h-3 text-red-600" />,
                        info: <Info className="w-3 h-3 text-blue-600" />,
                      };
                      
                      return (
                        <div 
                          key={idx} 
                          className={cn(
                            "p-3 rounded-lg border text-xs",
                            statusColors[finding.status as keyof typeof statusColors] || statusColors.info
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <a 
                              href={finding.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {finding.pathname}
                            </a>
                            <div className="flex items-center gap-2">
                              {/* Per-page fix button */}
                              <PerPageFixButton
                                checkId={id}
                                pageUrl={finding.url}
                                pagePathname={finding.pathname}
                                finding={{
                                  status: finding.status,
                                  score: finding.score,
                                  value: finding.value,
                                  message: finding.message,
                                }}
                              />
                              <span className="flex items-center gap-1">
                                {statusIcons[finding.status as keyof typeof statusIcons]}
                                <span className="font-medium">{finding.score}/100</span>
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 mb-2">{finding.message}</p>
                          {finding.value && Object.keys(finding.value).length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                              {Object.entries(finding.value).slice(0, 8).map(([key, val]) => {
                                if (val === null || val === undefined || key === 'recommendation' || key === 'htmlSnippet') return null;
                                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                const isLongText = typeof val === 'string' && val.length > 50;
                                return (
                                  <div key={key} className={cn("flex flex-col", isLongText && "col-span-2")}>
                                    <span className="text-slate-500 dark:text-slate-500 text-[10px] font-medium">{formattedKey}:</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                      {typeof val === 'boolean' ? (val ? '✓' : '✗') : 
                                       typeof val === 'number' ? val : 
                                       typeof val === 'string' ? (
                                         <ExpandableText text={val} maxLength={isLongText ? 100 : 50} />
                                       ) : 
                                       JSON.stringify(val).substring(0, 50)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* Detected on pages (for single page or when per-page not available) */}
            {sourcePages && sourcePages.length > 0 && (!perPageFindings || perPageFindings.length <= 1) && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Detected on:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sourcePages.slice(0, 5).map((url, i) => {
                    try {
                      const pathname = new URL(url).pathname || '/';
                      return (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {pathname}
                        </a>
                      );
                    } catch { return null; }
                  })}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  const statusStyles = {
    pass: "border-l-green-400 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-900/10",
    warning: "border-l-amber-400 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10",
    fail: "border-l-red-400 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10",
    info: "border-l-blue-400 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10",
  };

  return (
    <div
      id={id}
      className="border-b border-slate-100 dark:border-slate-800 last:border-b-0"
    >
      <div 
        className={cn(
          "flex items-start gap-4 p-4 hover:bg-muted/30 transition-all duration-200 border-l-4 rounded-r-lg",
          statusStyles[status],
          hasExpandableContent && "cursor-pointer hover:shadow-md"
        )}
        onClick={() => hasExpandableContent && setExpanded(!expanded)}
      >
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
            config.bg,
            "ring-2 ring-white dark:ring-slate-800"
          )}
        >
          <Icon className={cn("w-5 h-5", config.color)} />
        </div>
        <div className="flex-1 min-w-0 pr-12">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{name}</h4>
            {hasIssue && (
              <span className={cn(
                "px-2 py-0.5 text-xs font-medium rounded-full",
                status === "fail" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              )}>
                {status === "fail" ? "Issue" : "Warning"}
                {perPageFindings && perPageFindings.length > 1 && ` (${perPageFindings.filter(f => f.status !== 'pass').length} pages)`}
              </span>
            )}
            {status === "pass" && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Passed
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
          {sourcePages && sourcePages.length > 0 && hasIssue && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <span className="font-medium">Found on:</span>
              {sourcePages.slice(0, 3).map(url => {
                try { return new URL(url).pathname || '/'; } catch { return url; }
              }).join(', ')}{sourcePages.length > 3 ? ` +${sourcePages.length - 3} more` : ''}
            </p>
          )}
        </div>
        {hasExpandableContent && (
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            expanded ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
          )}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        )}
      </div>
      
      {expanded && hasExpandableContent && (
        <div className="px-4 pb-4 pt-2 ml-14 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-lg border-l-4 border-l-blue-200 dark:border-l-blue-800">
          {renderExpandedContent()}
          
          {/* Verification Button */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowVerification(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Eye className="w-4 h-4" />
              View Audit Details
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Click to see detailed findings from this audit check
            </p>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        checkName={name}
        checkStatus={status}
        sourceUrl={sourcePages?.[0]}
        findings={value || {}}
        sourceCode={(value as any)?.sourceCode || (value as any)?.htmlSnippet}
        detectedElements={(
          Object.entries(value || {}).filter(([key, val]) => 
            typeof val === 'string' && (val.includes('<') || val.includes('>'))
          ).map(([key, val]) => ({
            element: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            snippet: String(val).substring(0, 500),
          }))
        )}
      />
    </div>
  );
}

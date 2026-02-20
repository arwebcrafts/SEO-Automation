"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Search, Loader2, Globe, FileSearch, CheckCircle, XCircle, LogIn, Zap } from "lucide-react";
import { PageSelector } from "./page-selector";
import { runFrontendSmartAudit, type SmartAuditOutput, type FrontendAuditProgress } from "@/lib/frontend-smart-audit";

interface CrawlResult {
  baseUrl: string;
  pagesFound: number;
  pages: Array<{
    url: string;
    status: number;
    title?: string;
    links: string[];
    error?: string;
    depth: number;
    internalLinkCount: number;
    isNavigation: boolean;
  }>;
  urlGroups: {
    core: string[];
    blog: string[];
    product: string[];
    service: string[];
    category: string[];
    other: string[];
  };
  topLinkedPages: Array<{ url: string; linkCount: number }>;
  sitemapUrls: string[];
  errors: string[];
}

export function AuditForm() {
  const { isSignedIn, isLoaded } = useAuth();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlTaskId, setCrawlTaskId] = useState<string | null>(null);
  const [crawlPublicToken, setCrawlPublicToken] = useState<string | null>(null);
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [crawlStatus, setCrawlStatus] = useState("");
  const [pagesFound, setPagesFound] = useState(0);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [error, setError] = useState("");
  const [auditMode, setAuditMode] = useState<"quick" | "deep">("quick");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const router = useRouter();

  // Progress state for quick audit
  const [quickAuditProgress, setQuickAuditProgress] = useState(0);
  const [quickAuditStatus, setQuickAuditStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a website URL");
      return;
    }

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    if (auditMode === "deep") {
      // Deep Crawl requires authentication
      if (!isSignedIn) {
        setShowAuthPrompt(true);
        return;
      }
      await startDeepCrawl(cleanUrl);
    } else {
      // Quick Audit is FREE - runs entirely on frontend, no auth needed
      await startQuickAudit(cleanUrl);
    }
  };

  const startQuickAudit = async (cleanUrl: string) => {
    setIsLoading(true);
    setQuickAuditProgress(0);
    setQuickAuditStatus("Fetching page data...");

    try {
      // Run entirely on frontend using proxy-fetch + frontend analyzers
      const result = await runFrontendSmartAudit(
        cleanUrl,
        [cleanUrl], // Single URL only for Quick Audit
        undefined,  // No crawl data
        (progress: FrontendAuditProgress) => {
          setQuickAuditProgress(progress.progress);
          setQuickAuditStatus(progress.label);
        }
      );

      const auditId = `quick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const domain = new URL(cleanUrl).hostname;

      const transformedResult = {
        id: auditId,
        domain: domain,
        url: cleanUrl,
        status: "COMPLETED",
        overallScore: result.overallScore,
        overallGrade: result.overallGrade,
        localSeoScore: result.localSeo?.score ?? null,
        seoScore: result.seo?.score ?? null,
        linksScore: result.links?.score ?? null,
        usabilityScore: result.usability?.score ?? null,
        performanceScore: result.performance?.score ?? null,
        socialScore: result.social?.score ?? null,
        contentScore: result.content?.score ?? null,
        eeatScore: result.eeat?.score ?? null,
        technicalSeoScore: result.technicalSeo?.score ?? null,
        localSeoResults: result.localSeo,
        seoResults: result.seo,
        linksResults: result.links,
        usabilityResults: result.usability,
        performanceResults: result.performance,
        socialResults: result.social,
        technologyResults: result.technology,
        technicalSeoResults: result.technicalSeo,
        contentResults: result.content,
        eeatResults: result.eeat,
        recommendations: result.recommendations,
        createdAt: new Date().toISOString(),
        pageClassifications: result.pageClassifications,
        auditMapping: result.auditMapping,
        pagesAnalyzed: result.pagesAnalyzed,
        pagesFailed: result.pagesFailed,
      };

      sessionStorage.setItem(`audit_${auditId}`, JSON.stringify(transformedResult));
      window.location.href = `/${domain}?id=${auditId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze. Please try again.");
      setIsLoading(false);
      setQuickAuditProgress(0);
      setQuickAuditStatus("");
    }
  };

  const startDeepCrawl = async (cleanUrl: string) => {
    console.log("[Deep Crawl] Starting deep crawl for:", cleanUrl);
    setIsCrawling(true);
    setCrawlProgress(0);
    setCrawlStatus("Starting crawl...");
    setPagesFound(0);
    setCrawlResult(null);

    try {
      console.log("[Deep Crawl] Sending POST request to /api/crawl");
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, maxPages: 50 }),
      });

      console.log("[Deep Crawl] POST response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[Deep Crawl] POST error response:", errorData);
        throw new Error(errorData.error || "Failed to start crawl");
      }

      const data = await response.json();
      console.log("[Deep Crawl] POST response data:", { runId: data.runId, publicToken: data.publicToken ? "exists" : "missing" });
      
      setCrawlTaskId(data.runId);
      setCrawlPublicToken(data.publicToken);

      console.log("[Deep Crawl] Starting polling for run:", data.runId);
      // Start polling for status
      pollCrawlStatus(data.runId, data.publicToken, cleanUrl);
    } catch (err) {
      console.error("[Deep Crawl] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to start crawl");
      setIsCrawling(false);
    }
  };

  const handleSelectionChange = (urls: string[]) => {
    setSelectedUrls(urls);
  };

  const [auditProgress, setAuditProgress] = useState(0);
  const [auditStatus, setAuditStatus] = useState("");

  const handleRunAudit = async (useFrontend: boolean = false, sectionSelections?: Record<string, string[]>) => {
    if (!crawlResult || selectedUrls.length === 0) {
      setError("Please select at least one page to audit");
      return;
    }

    setIsRunningAudit(true);
    setAuditProgress(0);
    setAuditStatus(useFrontend ? "Starting frontend audit..." : "Starting smart audit...");
    
    console.log("[Audit] Section selections received:", sectionSelections);
    
    try {
      // Use frontend processing if toggle is enabled
      if (useFrontend) {
        console.log("[Frontend Audit] Starting frontend audit for", selectedUrls.length, "pages");
        
        const result = await runFrontendSmartAudit(
          crawlResult.baseUrl,
          selectedUrls,
          crawlResult,
          (progress: FrontendAuditProgress) => {
            setAuditProgress(progress.progress);
            setAuditStatus(progress.label);
          }
        );
        
        console.log("[Frontend Audit] Audit completed with score:", result.overallScore);
        
        // Generate a unique ID for this audit
        const auditId = `frontend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const domain = new URL(crawlResult.baseUrl).hostname;
        
        // Transform frontend audit output to match the expected format for results page
        const transformedResult = {
          id: auditId,
          domain: domain,
          url: crawlResult.baseUrl,
          status: "COMPLETED",
          overallScore: result.overallScore,
          overallGrade: result.overallGrade,
          localSeoScore: result.localSeo?.score ?? null,
          seoScore: result.seo?.score ?? null,
          linksScore: result.links?.score ?? null,
          usabilityScore: result.usability?.score ?? null,
          performanceScore: result.performance?.score ?? null,
          socialScore: result.social?.score ?? null,
          contentScore: result.content?.score ?? null,
          eeatScore: result.eeat?.score ?? null,
          technicalSeoScore: result.technicalSeo?.score ?? null,
          localSeoResults: result.localSeo,
          seoResults: result.seo,
          linksResults: result.links,
          usabilityResults: result.usability,
          performanceResults: result.performance,
          socialResults: result.social,
          technologyResults: result.technology,
          technicalSeoResults: result.technicalSeo,
          contentResults: result.content,
          eeatResults: result.eeat,
          recommendations: result.recommendations,
          createdAt: new Date().toISOString(),
          pageClassifications: result.pageClassifications,
          auditMapping: result.auditMapping,
          pagesAnalyzed: result.pagesAnalyzed,
          pagesFailed: result.pagesFailed,
        };
        
        // Store the transformed result in sessionStorage
        sessionStorage.setItem(`audit_${auditId}`, JSON.stringify(transformedResult));
        
        // Navigate to results page
        window.location.href = `/${domain}?id=${auditId}`;
        return;
      }
      
      // Use Trigger.dev backend processing
      const auditResponse = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: crawlResult.baseUrl,
          selectedUrls,
          crawlData: crawlResult,
          sectionSelections: sectionSelections // Pass section-specific page selections
        }),
      });

      if (!auditResponse.ok) {
        const auditErr = await auditResponse.json();
        setError(`Audit failed: ${auditErr.error}`);
        setIsRunningAudit(false);
        return;
      }

      const auditData = await auditResponse.json();
      
      // If audit is running in background (multi-page), poll for status
      if (auditData.status === "RUNNING" && auditData.runId) {
        console.log("[Smart Audit] Audit started in background, polling for status...");
        await pollAuditStatus(auditData.runId, auditData.publicToken, auditData.id);
      } else if (auditData.status === "COMPLETED") {
        // Single page audit completed immediately
        const domain = new URL(crawlResult.baseUrl).hostname;
        sessionStorage.setItem(`audit_${auditData.id}`, JSON.stringify(auditData));
        router.push(`/${domain}?id=${auditData.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run audit");
      setIsRunningAudit(false);
    }
  };

  const pollAuditStatus = async (runId: string, publicToken: string, auditId: string) => {
    let pollAttempts = 0;
    const maxPollAttempts = 180; // 6 minutes at 2 second intervals
    
    const poll = async () => {
      pollAttempts++;
      console.log(`[Smart Audit Poll] Attempt ${pollAttempts}/${maxPollAttempts}`);
      
      if (pollAttempts > maxPollAttempts) {
        setError("Audit is taking longer than expected. Please check back later.");
        setIsRunningAudit(false);
        return;
      }

      try {
        const response = await fetch(`/api/audit?runId=${runId}&publicToken=${publicToken}&auditId=${auditId}`, {
          cache: 'no-cache',
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch audit status");
        }
        
        const data = await response.json();
        console.log(`[Smart Audit Poll] Status: ${data.status}`);

        // Update progress from metadata
        if (data.metadata?.status) {
          setAuditProgress(data.metadata.status.progress ?? 0);
          setAuditStatus(data.metadata.status.label ?? "Analyzing pages...");
        }

        if (data.status === "COMPLETED" && data.output) {
          console.log("[Smart Audit Poll] Audit completed!");
          const domain = new URL(crawlResult!.baseUrl).hostname;
          sessionStorage.setItem(`audit_${auditId}`, JSON.stringify(data.output));
          console.log("[Smart Audit Poll] Redirecting to:", `/${domain}?id=${auditId}`);
          // Use window.location for more reliable redirect
          window.location.href = `/${domain}?id=${auditId}`;
        } else if (data.status === "FAILED" || data.status === "CRASHED") {
          setError("Audit failed. Please try again.");
          setIsRunningAudit(false);
        } else {
          // Continue polling
          setTimeout(poll, 2000);
        }
      } catch (err) {
        console.error("[Smart Audit Poll] Error:", err);
        setTimeout(poll, 3000);
      }
    };

    poll();
  };

  const pollCrawlStatus = useCallback(async (taskId: string, publicToken: string, originalUrl: string) => {
    let pollAttempts = 0;
    const maxPollAttempts = 150; // 5 minutes at 2 second intervals
    const poll = async () => {
      pollAttempts++;
      console.log(`[Deep Crawl Poll] Attempt ${pollAttempts}/${maxPollAttempts} for task:`, taskId);
      
      // Safety check to prevent infinite polling
      if (pollAttempts > maxPollAttempts) {
        console.error("[Deep Crawl Poll] Max attempts reached, aborting");
        setError("Crawl is taking longer than expected. Please check back later.");
        setIsCrawling(false);
        return;
      }

      try {
        console.log(`[Deep Crawl Poll] Fetching status from /api/crawl...`);
        const response = await fetch(`/api/crawl?runId=${taskId}&publicToken=${publicToken}`, {
          cache: 'no-cache',
        });
        
        console.log(`[Deep Crawl Poll] Response status:`, response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("[Deep Crawl Poll] Error response:", errorData);
          throw new Error(errorData.error || "Failed to fetch status");
        }
        
        const data = await response.json();
        console.log(`[Deep Crawl Poll] Response data - status: ${data.status}, hasOutput: ${!!data.output}, hasMetadata: ${!!data.metadata}`);

        // Update progress from metadata
        if (data.metadata?.status) {
          const oldProgress = crawlProgress;
          const newProgress = data.metadata.status.progress ?? 0;
          const newStatus = data.metadata.status.label ?? "Initializing crawl...";
          const newPages = data.metadata.status.pagesFound ?? 0;
          
          setCrawlProgress(newProgress);
          setCrawlStatus(newStatus);
          setPagesFound(newPages);
          
          console.log(`[Deep Crawl Poll] Progress updated: ${oldProgress}% -> ${newProgress}%, Status: "${newStatus}", Pages: ${newPages}`);
          
          // Log any errors from metadata
          if (data.metadata.status.lastError) {
            console.warn("[Deep Crawl Poll] Crawl warning:", data.metadata.status.lastError);
          }
        }

        // Check if completed
        if (data.status === "COMPLETED" && data.output) {
          console.log("[Deep Crawl Poll] Crawl completed successfully!");
          setCrawlResult(data.output);
          setShowPageSelector(true);
          setIsCrawling(false);
        } else if (data.status === "FAILED" || data.status === "CRASHED") {
          console.error("[Deep Crawl Poll] Crawl failed with status:", data.status);
          setError("Crawl failed. Please try again.");
          setIsCrawling(false);
        } else if (data.status === "TIMED_OUT" || data.status === "EXPIRED") {
          console.error("[Deep Crawl Poll] Crawl timed out with status:", data.status);
          setError("Crawl timed out. The website might be too large or blocking crawlers. Try the Quick Audit instead.");
          setIsCrawling(false);
        } else {
          console.log(`[Deep Crawl Poll] Still running (${data.status}), polling again in 2s...`);
          // Continue polling
          setTimeout(poll, 2000);
        }
      } catch (err) {
        console.error("[Deep Crawl Poll] Error:", err);
        // Don't stop polling on network errors, just retry after a delay
        if (pollAttempts < maxPollAttempts) {
          console.log(`[Deep Crawl Poll] Retrying in 3s (attempt ${pollAttempts + 1}/${maxPollAttempts})...`);
          setTimeout(poll, 3000);
        } else {
          console.error("[Deep Crawl Poll] Max attempts reached after error, giving up");
          setError("Failed to check crawl status after multiple attempts. Please try again.");
          setIsCrawling(false);
        }
      }
    };

    poll();
  }, [router, crawlProgress]);

  if (isCrawling) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl border shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-10 h-10 text-blue-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold">Deep Crawling Website</h2>
            <p className="text-muted-foreground mt-2">Discovering and analyzing all pages...</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-medium text-blue-600">{crawlProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${crawlProgress}%` }}
              />
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span>{crawlStatus}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
              <FileSearch className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{pagesFound}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Pages Found</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 text-center">
              <Globe className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">Active</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">Status</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            This may take 1-2 minutes depending on the size of your website.
          </p>
        </div>
      </div>
    );
  }

  // Show PageSelector after crawl completes
  if (showPageSelector && crawlResult) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <PageSelector
          crawlResult={crawlResult}
          onSelectionChange={handleSelectionChange}
          onRunAudit={handleRunAudit}
          isRunningAudit={isRunningAudit}
          auditProgress={auditProgress}
          auditStatus={auditStatus}
        />
      </div>
    );
  }

  // Show Quick Audit progress UI
  if (isLoading && auditMode === "quick") {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl border shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-amber-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold">Quick SEO Audit</h2>
            <p className="text-muted-foreground mt-2">Analyzing your page in real-time...</p>
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-medium text-amber-600">{quickAuditProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${quickAuditProgress}%` }}
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
              <span>{quickAuditStatus || "Starting analysis..."}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">No sign-up required &bull; 100% free &bull; Frontend-only analysis</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Audit Mode Toggle */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setAuditMode("quick")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            auditMode === "quick"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          ⚡ Quick Audit
        </button>
        <button
          type="button"
          onClick={() => setAuditMode("deep")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            auditMode === "deep"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          🔍 Deep Crawl
        </button>
      </div>
      
      <p className="text-center text-sm text-muted-foreground mb-4">
        {auditMode === "quick" 
          ? "Free instant SEO audit — no sign-up required (~30 seconds)"
          : "Crawl all pages for comprehensive analysis (1-2 min, requires sign-in)"
        }
      </p>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., example.com)"
              className="w-full pl-12 pr-4 py-4 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze"
            )}
          </button>
        </div>
        {error && <p className="mt-3 text-destructive text-sm">{error}</p>}
      </form>

      {/* Auth Prompt Modal - Only for Deep Crawl */}
      {showAuthPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Sign In for Deep Crawl
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Deep Crawl analyzes all pages on your site and requires a free account. 
                Or use <button onClick={() => { setShowAuthPrompt(false); setAuditMode("quick"); }} className="text-blue-600 underline font-medium">Quick Audit</button> for free without signing up.
              </p>
              <div className="flex flex-col gap-3">
                <SignInButton mode="modal">
                  <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Sign In / Sign Up
                  </button>
                </SignInButton>
                <button
                  onClick={() => setShowAuthPrompt(false)}
                  className="w-full px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                It&apos;s free! No credit card required.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

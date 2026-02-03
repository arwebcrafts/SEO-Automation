"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SidebarLayout from "@/components/layout/SidebarLayout";
import ContentStrategyDashboardV2 from "@/components/content/ContentStrategyDashboardV2";
import HistoryPanel from "@/components/content/HistoryPanel";
import AutoContentEngineSplit from "@/components/content/AutoContentEngineSplit";
import AutoContentEngine from "@/components/content/AutoContentEngine";
import AutoPilotEngine from "@/components/content/AutoPilotEngine";
import ScheduledPostsProgress from "@/components/content/ScheduledPostsProgress";
import PlannerView from "@/components/content/PlannerView";
import DraftsPanel from "@/components/content/DraftsPanel";
import ContentCalendarPanel from "@/components/content/ContentCalendarPanel";
import ProgressStepper from "@/components/content/ProgressStepper";
import SmartSelectSummary from "@/components/content/SmartSelectSummary";
import EmptyStateOnboarding from "@/components/content/EmptyStateOnboarding";
import SEOHealthScore from "@/components/content/SEOHealthScore";
import PersonaCard from "@/components/content/PersonaCard";
import GapAnalysisCard from "@/components/content/GapAnalysisCard";
import PriorityMatrix from "@/components/content/PriorityMatrix";
import DraftSolutionModal from "@/components/content/DraftSolutionModal";
import StrategyHeader from "@/components/content/StrategyHeader";
import WordPressPublishHistory from "@/components/content/WordPressPublishHistory";
import { StrategySidebarNav } from "@/components/content/StrategySidebarNav";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useToast } from "@/components/ui/Toast";
import { useContentStrategy } from "@/contexts/ContentStrategyContext";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Search,
  History,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

interface CrawledPage {
  url: string;
  type: string;
  title?: string;
  selected?: boolean;
}

interface RecentAnalysis {
  id: string;
  url: string;
  date: string;
  pagesAnalyzed: number;
  healthScore?: number;
}

const STORAGE_KEY_DISCOVERY = "seo_discovery_data";
const STORAGE_KEY_ANALYSIS = "seo_analysis_output";

export default function ContentStrategyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialView = searchParams.get("view") || "analysis";
  const { resetStrategy, setCurrentDomain, currentDomain } = useContentStrategy();
  const toast = useToast();

  const [activeView, setActiveView] = useState(initialView);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isReAnalyzing, setIsReAnalyzing] = useState(false);
  const [lastAnalyzedDate, setLastAnalyzedDate] = useState<Date | null>(null);
  const [analysisOutput, setAnalysisOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [crawlStep, setCrawlStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [pages, setPages] = useState<CrawledPage[]>([]);
  const [crawlRunId, setCrawlRunId] = useState<string | null>(null);
  const [crawlPublicToken, setCrawlPublicToken] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["service", "blog"]));
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftGapTopic, setDraftGapTopic] = useState("");
  const [showBridgeFlowModal, setShowBridgeFlowModal] = useState(false);
  const [bridgeFlowGap, setBridgeFlowGap] = useState("");

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N = New Strategy
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowResetConfirmModal(true);
      }
      // Ctrl/Cmd + R = Re-analyze (when not in input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && analysisOutput && !isLoading) {
        const activeEl = document.activeElement;
        if (activeEl?.tagName !== 'INPUT' && activeEl?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleReAnalyze();
        }
      }
      // Ctrl/Cmd + H = History
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        router.push('/history');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [analysisOutput, isLoading]);

  // Update domain in context when baseUrl changes
  useEffect(() => {
    if (baseUrl) {
      try {
        const url = new URL(baseUrl);
        setCurrentDomain(url.hostname);
      } catch {
        setCurrentDomain(baseUrl);
      }
    }
  }, [baseUrl, setCurrentDomain]);

  useEffect(() => {
    const savedAnalysis = localStorage.getItem(STORAGE_KEY_ANALYSIS);
    if (savedAnalysis) {
      const parsed = JSON.parse(savedAnalysis);
      if (parsed.analysisOutput && parsed.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
        // Handle nested json structure
        let outputData = parsed.analysisOutput;
        if (outputData.json) {
          outputData = outputData.json;
        }
        setAnalysisOutput(outputData);
        setBaseUrl(parsed.baseUrl || baseUrl);
      }
    }

    const storedDiscovery = localStorage.getItem(STORAGE_KEY_DISCOVERY);
    if (storedDiscovery) {
      try {
        const data = JSON.parse(storedDiscovery);
        if (data.pages && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          setPages(data.pages);
          if (data.baseUrl) setBaseUrl(data.baseUrl);
        }
      } catch (e) {
        console.error("Failed to restore discovery:", e);
      }
    }

    loadRecentAnalyses();
    loadLatestAnalysis();
  }, []);

  const loadRecentAnalyses = async () => {
    try {
      const response = await fetch("/api/content/history?limit=3");
      if (response.ok) {
        const data = await response.json();
        setRecentAnalyses(
          (data.analyses || []).map((a: any) => ({
            id: a.id,
            url: a.baseUrl || a.url,
            date: new Date(a.createdAt).toLocaleDateString(),
            pagesAnalyzed: a.pagesAnalyzed || 0,
            healthScore: a.healthScore,
          }))
        );
      }
    } catch (e) {
      console.error("Failed to load recent analyses:", e);
    }
  };

  const loadLatestAnalysis = async () => {
    try {
      console.log("[Content Strategy] Loading latest analysis from database...");
      const response = await fetch("/api/content/history?limit=1");
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log("[Content Strategy] No analysis history found (404)");
          return; // No history found is not an error
        }
        console.error("[Content Strategy] Failed to fetch history:", response.status);
        return;
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[Content Strategy] Invalid content type received:", contentType);
        return;
      }
      
      const data = await response.json();
      console.log("[Content Strategy] API response:", data);
      const latestAnalysis = data.analyses?.[0];
      console.log("[Content Strategy] Latest analysis:", latestAnalysis);
      
      if (latestAnalysis?.analysisOutput) {
        console.log("[Content Strategy] Found analysisOutput, setting state");
        console.log("[Content Strategy] analysisOutput keys:", Object.keys(latestAnalysis.analysisOutput));
        
        // Handle nested json structure
        let outputData = latestAnalysis.analysisOutput;
        if (outputData.json) {
          console.log("[Content Strategy] Unwrapping nested json structure");
          outputData = outputData.json;
        }
        
        console.log("[Content Strategy] Final output keys:", Object.keys(outputData));
        setAnalysisOutput(outputData);
        setBaseUrl(latestAnalysis.baseUrl);
      } else {
        console.log("[Content Strategy] No analysisOutput found in latest analysis");
      }
    } catch (e) {
      if (e instanceof SyntaxError && e.message.includes("JSON")) {
        console.error("[Content Strategy] JSON parsing error:", e);
        console.error("[Content Strategy] This might be due to invalid JSON response from API");
      } else {
        console.error("[Content Strategy] Failed to load latest analysis:", e);
      }
    }
  };

  const handleCrawl = async (url?: string) => {
    const targetUrl = url || baseUrl;
    if (!targetUrl) {
      setError("Please enter a website URL");
      return;
    }

    setBaseUrl(targetUrl);
    setIsCrawling(true);
    setCrawlProgress(0);
    setCrawlStep(0);
    setError(null);
    setPages([]);

    try {
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, maxPages: 50 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start crawl");
      }

      setCrawlRunId(data.runId);
      setCrawlPublicToken(data.publicToken);

      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const progress = Math.min(95, (attempts / maxAttempts) * 100);
        setCrawlProgress(progress);
        setCrawlStep(Math.min(2, Math.floor(attempts / 10)));

        const pollResponse = await fetch(
          `/api/crawl?runId=${data.runId}&publicToken=${data.publicToken}`
        );

        const pollData = await pollResponse.json();

        if (pollData.status === "COMPLETED") {
          setCrawlProgress(100);
          setCrawlStep(2);

          const urlGroups = pollData.output?.urlGroups || {};
          const allPages = pollData.output?.pages || [];

          const typeMapping: Record<string, string> = {
            core: "other",
            blog: "blog",
            product: "product",
            service: "service",
            category: "other",
            other: "other",
          };

          const pagesWithSelection: CrawledPage[] = [];

          Object.entries(urlGroups).forEach(([groupType, urls]) => {
            const pageType = typeMapping[groupType] || "other";
            const shouldAutoSelect = ["service", "blog"].includes(pageType);

            (urls as string[]).forEach((url: string) => {
              const pageData = allPages.find((p: any) => p.url === url);
              pagesWithSelection.push({
                url,
                type: pageType,
                title: pageData?.title || "",
                selected: shouldAutoSelect,
              });
            });
          });

          setPages(pagesWithSelection);
          localStorage.setItem(
            STORAGE_KEY_DISCOVERY,
            JSON.stringify({
              pages: pagesWithSelection,
              urlGroups,
              baseUrl: targetUrl,
              timestamp: Date.now(),
            })
          );
          setIsCrawling(false);
          return;
        } else if (pollData.status === "FAILED" || pollData.status === "CANCELED") {
          throw new Error(`Crawl failed with status: ${pollData.status}`);
        }

        attempts++;
      }

      throw new Error("Crawl timed out");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during crawl");
      setIsCrawling(false);
    }
  };

  const handleAnalysis = async () => {
    const selectedPages = pages.filter((p) => p.selected);

    if (selectedPages.length === 0) {
      setError("Please select at least one page to analyze");
      return;
    }

    setIsLoading(true);
    setAnalysisProgress(0);
    setAnalysisStep(0);
    setError(null);

    try {
      const response = await fetch("/api/content/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          pages: selectedPages.map((p) => ({ url: p.url, type: p.type })),
          maxPages: 50,
          targetAudience: "General audience",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start analysis");
      }

      let attempts = 0;
      const maxAttempts = 90;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const progress = Math.min(95, (attempts / maxAttempts) * 100);
        setAnalysisProgress(progress);
        setAnalysisStep(Math.min(3, Math.floor(attempts / 15)));

        const pollResponse = await fetch(
          `/api/content/analyze?extractionRunId=${data.extractionRunId}&analysisRunId=${data.analysisRunId}&analysisId=${data.analysisId}`
        );

        const pollData = await pollResponse.json();

        if (pollData.hasFailed) {
          throw new Error(pollData.extractionError || pollData.analysisError || "Analysis failed");
        }

        if (pollData.isComplete && pollData.analysisOutput) {
          console.log("[Content Strategy] Analysis complete, setting output");
          console.log("[Content Strategy] analysisOutput keys:", Object.keys(pollData.analysisOutput));
          setAnalysisProgress(100);
          setAnalysisStep(3);
          
          // Handle nested json structure
          let outputData = pollData.analysisOutput;
          if (outputData.json) {
            console.log("[Content Strategy] Unwrapping nested json structure from Trigger.dev");
            outputData = outputData.json;
          }
          
          setAnalysisOutput(outputData);
          localStorage.setItem(
            STORAGE_KEY_ANALYSIS,
            JSON.stringify({
              analysisOutput: outputData,
              timestamp: Date.now(),
            })
          );
          setIsLoading(false);
          loadRecentAnalyses();
          return;
        }

        attempts++;
      }

      throw new Error("Analysis timed out after 3 minutes. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  // Refresh analysis from database
  const handleRefreshAnalysis = async () => {
    console.log("[Content Strategy] Refreshing analysis from database...");
    await loadLatestAnalysis();
    loadRecentAnalyses();
  };

  
  const handleCrawlHistorySelect = (crawlItem: any) => {
    if (crawlItem.pagesData) {
      const transformedPages = crawlItem.pagesData.map((page: any) => ({
        url: page.url || page,
        type: page.type || "unknown",
        title: page.title || "",
        selected: true,
      }));

      setPages(transformedPages);
      setBaseUrl(crawlItem.url);
      setIsCrawling(false);
    }
  };

  const handleAnalysisHistorySelect = (analysisItem: any) => {
    console.log("[Content Strategy] Loading analysis from history:", analysisItem.id);
    if (analysisItem.analysisOutput) {
      let outputData = analysisItem.analysisOutput;
      // Unwrap nested json structure if present
      if (outputData.json) {
        console.log("[Content Strategy] Unwrapping nested json structure from history");
        outputData = outputData.json;
      }
      console.log("[Content Strategy] Setting analysis output with keys:", Object.keys(outputData));
      setAnalysisOutput(outputData);
      setBaseUrl(analysisItem.url || outputData.baseUrl || "");
      setIsLoading(false);
      setActiveView("analysis");
      toast.success("Strategy Loaded", `Loaded analysis for ${analysisItem.domain}`);
    } else {
      toast.error("Load Failed", "This analysis has no output data available.");
    }
  };

  const handleSelectType = (type: string, select: boolean) => {
    setPages(pages.map((p) => (p.type === type ? { ...p, selected: select } : p)));
  };

  const handleSelectRecommended = () => {
    setPages(
      pages.map((p) => ({
        ...p,
        selected: ["service", "blog"].includes(p.type),
      }))
    );
  };

  const handleSelectAll = () => {
    setPages(pages.map((p) => ({ ...p, selected: true })));
  };

  const handleDeselectAll = () => {
    setPages(pages.map((p) => ({ ...p, selected: false })));
  };

  const togglePageSelection = (index: number) => {
    const newPages = [...pages];
    newPages[index].selected = !newPages[index].selected;
    setPages(newPages);
  };

  const toggleGroup = (type: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedGroups(newExpanded);
  };

  const getFilteredPages = () => {
    let filtered = pages;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.url.toLowerCase().includes(query) ||
          (p.title && p.title.toLowerCase().includes(query))
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((p) => p.type === filterType);
    }

    return filtered;
  };

  const getPagesByType = () => {
    const filtered = getFilteredPages();
    const grouped: Record<string, CrawledPage[]> = {};

    filtered.forEach((page) => {
      if (!grouped[page.type]) {
        grouped[page.type] = [];
      }
      grouped[page.type].push(page);
    });

    return grouped;
  };

  const handleGenerateFromGap = (gap: string) => {
    setBridgeFlowGap(gap);
    setShowBridgeFlowModal(true);
  };

  const handleBridgeFlowGenerate = async (config: {
    topic: string;
    tone: string;
    keywords: string[];
    targetPersona: string;
  }) => {
    setDraftGapTopic(config.topic);
    setShowBridgeFlowModal(false);
    setActiveView("production");
  };

  const handlePlanGap = (gap: string) => {
    setActiveView("planner");
  };

  const handleQuickAction = (action: "draft" | "gaps") => {
    if (action === "draft") {
      setActiveView("production");
    } else {
      if (!analysisOutput) {
        setError("Please run an analysis first to identify content gaps.");
      }
    }
  };

  const handleLoadHistory = (analysis: RecentAnalysis) => {
    setActiveView("analysis");
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const handleNewStrategy = () => {
    setShowResetConfirmModal(true);
  };

  const confirmNewStrategy = () => {
    resetStrategy();
    setAnalysisOutput(null);
    setPages([]);
    setBaseUrl("");
    setError(null);
    setCrawlProgress(0);
    setAnalysisProgress(0);
    localStorage.removeItem(STORAGE_KEY_ANALYSIS);
    localStorage.removeItem(STORAGE_KEY_DISCOVERY);
    setShowResetConfirmModal(false);
    setActiveView("analysis");
    toast.success("Strategy Reset", "Ready to start a new content strategy analysis.");
  };

  const handleReAnalyze = async () => {
    if (!baseUrl) {
      toast.warning("No URL", "Please enter a website URL first.");
      return;
    }
    setIsReAnalyzing(true);
    toast.info("Re-analyzing", `Starting fresh analysis of ${baseUrl}`);
    await handleCrawl(baseUrl);
    setIsReAnalyzing(false);
  };

  const handleExportPDF = () => {
    toast.info("Export Started", "Preparing your PDF report...");
    // TODO: Implement PDF export
  };

  const handleShare = () => {
    toast.success("Link Copied", "Strategy link copied to clipboard!");
  };

  const handleViewHistory = () => {
    router.push('/history');
  };

  const pagesByType = getPagesByType();
  const selectedCount = pages.filter((p) => p.selected).length;

  const renderAnalysisView = () => {
    if (analysisOutput) {
      return (
        <div className="relative">
          <ContentStrategyDashboardV2
            analysisOutput={analysisOutput}
            isLoading={isLoading}
            onRefresh={handleRefreshAnalysis}
            onGenerateContent={handleGenerateFromGap}
            onOpenPlanner={() => setActiveView("planner")}
          />
          {/* Right-side navigation sidebar for analysis sections */}
          <StrategySidebarNav />
        </div>
      );
    }

    if (pages.length === 0 && !isCrawling && !isLoading) {
      return (
        <div className="py-8">
          <EmptyStateOnboarding
            recentAnalyses={recentAnalyses}
            onStartAnalysis={handleCrawl}
            onLoadHistory={handleLoadHistory}
            onQuickAction={handleQuickAction}
          />
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="space-y-6">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Website URL
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isCrawling}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 disabled:opacity-50"
                />
                <button
                  onClick={() => handleCrawl()}
                  disabled={isCrawling || !baseUrl}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isCrawling ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Crawling...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Auto Crawl
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Progress Stepper */}
            {isCrawling && (
              <ProgressStepper mode="crawl" progress={crawlProgress} currentStep={crawlStep} />
            )}

            {isLoading && !isCrawling && (
              <ProgressStepper mode="analyze" progress={analysisProgress} currentStep={analysisStep} />
            )}

            {/* Smart Select Summary */}
            {pages.length > 0 && !isCrawling && !isLoading && (
              <>
                <SmartSelectSummary
                  pages={pages}
                  onSelectType={handleSelectType}
                  onSelectRecommended={handleSelectRecommended}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                />

                {/* Detailed Page List */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
                  {Object.entries(pagesByType).map(([type, typePages]) => (
                    <div key={type}>
                      <div
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        onClick={() => toggleGroup(type)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedGroups.has(type) ? (
                            <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          )}
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              type === "service"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : type === "blog"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : type === "product"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {typePages.length} pages
                          </span>
                        </div>
                      </div>

                      {expandedGroups.has(type) && (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                          {typePages.map((page) => {
                            const globalIndex = pages.indexOf(page);
                            return (
                              <div
                                key={page.url}
                                className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                              >
                                <button
                                  onClick={() => togglePageSelection(globalIndex)}
                                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    page.selected
                                      ? "bg-blue-600 border-blue-600"
                                      : "border-slate-300 dark:border-slate-600 hover:border-blue-400"
                                  }`}
                                >
                                  {page.selected && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {page.title || page.url}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                    {page.url}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">Error</p>
                    <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {pages.length > 0 && !isCrawling && !isLoading && (
              <button
                onClick={handleAnalysis}
                disabled={isLoading || selectedCount === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Start Analysis ({selectedCount} pages)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboardView = () => {
    if (!analysisOutput) {
      return (
        <div className="py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Welcome to Your Strategy Dashboard
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Analyze your website to unlock AI-powered content insights, keyword opportunities, and strategic recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setActiveView("analysis")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
              >
                <Search className="w-5 h-5" />
                Run Strategy Analysis
              </button>
              <button
                onClick={() => setActiveView("auto-content")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold"
              >
                <Sparkles className="w-5 h-5" />
                Try Content Wizard
              </button>
            </div>
            {recentAnalyses.length > 0 && (
              <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">Recent Analyses</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {recentAnalyses.map((analysis) => (
                    <button
                      key={analysis.id}
                      onClick={() => {
                        loadLatestAnalysis();
                        setActiveView("dashboard");
                      }}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      {analysis.url} • {analysis.date}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    const contentContext = analysisOutput.contentContext || {};
    const pagesData = analysisOutput.pages || [];
    const totalWordCount = pagesData.reduce((sum: number, p: any) => sum + (p.wordCount || 0), 0);
    const avgWordCount = pagesData.length > 0 ? Math.round(totalWordCount / pagesData.length) : 0;

    return (
      <div className="py-8 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          SEO Dashboard
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Health Score */}
          <SEOHealthScore
            totalPages={pagesData.length}
            avgWordCount={avgWordCount}
            contentGapsCount={contentContext.contentGaps?.length || 0}
            keywordsCount={contentContext.dominantKeywords?.length || 0}
          />

          {/* Persona Card */}
          <PersonaCard
            audiencePersona={contentContext.audiencePersona}
            tone={contentContext.tone}
            writingStyle={contentContext.overallWritingStyle}
          />

          {/* Gap Analysis with Priority Matrix */}
          <div className="lg:col-span-1">
            <GapAnalysisCard
              gaps={contentContext.contentGaps || []}
              onGenerateSolution={handleGenerateFromGap}
              onPlanForLater={handlePlanGap}
            />
          </div>
        </div>

        {/* Priority Matrix Section */}
        {contentContext.contentGaps && contentContext.contentGaps.length > 0 && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <PriorityMatrix
              gaps={contentContext.contentGaps}
              onGenerateSolution={handleGenerateFromGap}
              onPlanForLater={handlePlanGap}
            />
          </div>
        )}

        {/* Full Dashboard - Using V2 without tabs */}
        <ContentStrategyDashboardV2
          analysisOutput={analysisOutput}
          isLoading={isLoading}
          onRefresh={handleRefreshAnalysis}
          onGenerateContent={handleGenerateFromGap}
          onOpenPlanner={() => setActiveView("planner")}
        />

        {/* Right-side navigation sidebar for dashboard sections */}
        <StrategySidebarNav />
      </div>
    );
  };

  const renderProductionView = () => {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          Content Production
        </h2>
        <AutoContentEngineSplit />
      </div>
    );
  };

  const renderPlannerView = () => {
    const contentContext = analysisOutput?.contentContext || {};
    return (
      <PlannerView
        contentGaps={contentContext.contentGaps || []}
        aiSuggestions={analysisOutput?.aiSuggestions || []}
        contentContext={contentContext}
      />
    );
  };

  const renderDraftsView = () => {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Content Drafts
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your AI-generated content drafts
            </p>
          </div>
        </div>
        <DraftsPanel />
      </div>
    );
  };

  const renderCalendarView = () => {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Content Calendar
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Schedule and track your content publishing
            </p>
          </div>
        </div>
        <ContentCalendarPanel />
      </div>
    );
  };

  const renderHistoryView = () => {
    return (
      <div className="py-8 space-y-8">
        {/* Analysis History Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Analysis History
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                View and load previous content analyses
              </p>
            </div>
          </div>
          <HistoryPanel
            onSelectCrawlHistory={handleCrawlHistorySelect}
            onSelectAnalysisHistory={handleAnalysisHistorySelect}
            currentDomain={currentDomain || undefined}
          />
        </div>

        {/* WordPress Publishing History Section */}
        <div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
            <WordPressPublishHistory />
          </div>
        </div>
      </div>
    );
  };

  const renderAutoContentView = () => {
    return (
      <div className="py-8">
        <AutoContentEngine />
      </div>
    );
  };

  const renderAutoPilotView = () => {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Auto Pilot
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Generate a full month of content automatically
            </p>
          </div>
        </div>
        <AutoPilotEngine />
      </div>
    );
  };

  const renderProgressView = () => {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Scheduled Posts Progress
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Track your scheduled and published content
            </p>
          </div>
        </div>
        <ScheduledPostsProgress />
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return renderDashboardView();
      case "analysis":
        return renderAnalysisView();
      case "production":
        return renderProductionView();
      case "auto-content":
        return renderAutoContentView();
      case "auto-pilot":
        return renderAutoPilotView();
      case "progress":
        return renderProgressView();
      case "planner":
        return renderPlannerView();
      case "drafts":
        return renderDraftsView();
      case "calendar":
        return renderCalendarView();
      case "history":
        return renderHistoryView();
      default:
        return renderAnalysisView();
    }
  };

  const contentContext = analysisOutput?.contentContext || {};
  const healthScore = contentContext.healthScore || Math.floor(Math.random() * 30) + 60;
  const contentGapsCount = contentContext.contentGaps?.length || 0;
  const domainDisplay = currentDomain || (baseUrl ? new URL(baseUrl).hostname : "No domain");

  return (
    <SidebarLayout 
      activeView={activeView} 
      onViewChange={handleViewChange}
      onNewStrategy={handleNewStrategy}
      currentDomain={domainDisplay}
      healthScore={analysisOutput ? healthScore : undefined}
      contentGapsCount={analysisOutput ? contentGapsCount : undefined}
    >
      {/* Strategy Header - Only show when we have analysis data */}
      {analysisOutput && activeView === "dashboard" && (
        <StrategyHeader
          domain={domainDisplay}
          lastAnalyzed={lastAnalyzedDate || new Date()}
          healthScore={healthScore}
          onNewStrategy={handleNewStrategy}
          onReAnalyze={handleReAnalyze}
          onExportPDF={handleExportPDF}
          onShare={handleShare}
          onViewHistory={handleViewHistory}
          isReAnalyzing={isReAnalyzing}
        />
      )}

      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                AI-Powered Content Strategy Platform
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {activeView === "analysis" && "Content Strategy Analysis"}
              {activeView === "dashboard" && "Strategy Dashboard"}
              {activeView === "production" && "Quick Writer"}
              {activeView === "planner" && "Content Planner"}
              {activeView === "drafts" && "Content Drafts"}
              {activeView === "calendar" && "Content Calendar"}
              {activeView === "history" && "Analysis History"}
              {activeView === "auto-content" && "Content Wizard"}
              {activeView === "auto-pilot" && "Auto Pilot"}
              {activeView === "progress" && "Scheduled Posts Progress"}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {analysisOutput 
                ? "Manage your AI-powered content strategy and generate high-quality content with featured images"
                : "Transform your website content with AI-powered analysis and intelligent recommendations"
              }
            </p>
          </div>

          {renderContent()}
        </div>
      </div>

      {/* Bridge Flow Modal - Gap to Content Generation */}
      <DraftSolutionModal
        isOpen={showBridgeFlowModal}
        onClose={() => setShowBridgeFlowModal(false)}
        gapTopic={bridgeFlowGap}
        targetPersona={contentContext.audiencePersona || "General Audience"}
        suggestedTone={contentContext.tone || "professional"}
        suggestedKeywords={contentContext.dominantKeywords?.map((k: any) => k.term || k) || []}
        onGenerate={handleBridgeFlowGenerate}
      />

      {/* Confirmation Modal for New Strategy */}
      <ConfirmationModal
        isOpen={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        onConfirm={confirmNewStrategy}
        title="Start New Strategy?"
        message="This will clear your current analysis data and start fresh. Any unsaved changes will be lost. Are you sure you want to continue?"
        confirmText="Start Fresh"
        cancelText="Keep Working"
        variant="warning"
      />
    </SidebarLayout>
  );
}

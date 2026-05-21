"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  BarChart3,
  Activity,
  FileSearch,
  Database,
  Search
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContentStrategy } from "@/contexts/ContentStrategyContext";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { FilterToolbar } from "@/components/history/FilterToolbar";

interface Audit {
  id: string;
  domain: string;
  url: string;
  status: string;
  overallScore: number | null;
  overallGrade: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface ContentAnalysis {
  id: string;
  baseUrl: string;
  domain: string;
  status: string;
  pagesAnalyzed: number;
  gapsFound?: number;
  topics?: number;
  createdAt: string;
  completedAt: string | null;
}

export default function HistoryPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadFromHistory, resetStrategy } = useContentStrategy();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [contentAnalyses, setContentAnalyses] = useState<ContentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnalysisId, setLoadingAnalysisId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  
  // Get initial tab from URL parameter
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'audits' ? 'audits' : tabParam === 'content' ? 'content' : 'all';
  const [filterType, setFilterType] = useState<"all" | "audits" | "content">(initialTab);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const [auditsRes, contentRes] = await Promise.all([
          fetch("/api/audit/history"),
          fetch("/api/content/history"),
        ]);

        if (auditsRes.ok) {
          const auditsData = await auditsRes.json();
          setAudits(auditsData.audits || []);
        }

        if (contentRes.ok) {
          const contentData = await contentRes.json();
          setContentAnalyses(contentData.analyses || []);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const filteredAudits = audits.filter(audit =>
    audit.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    audit.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContent = contentAnalyses.filter(analysis =>
    analysis.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    analysis.baseUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allItems = filterType === "all" 
    ? [...filteredAudits, ...filteredContent]
    : filterType === "audits" 
    ? filteredAudits 
    : filteredContent;

  // Pagination logic
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  const paginatedItems = allItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const completedAudits = audits.filter(a => a.status === "COMPLETED").length;
  const runningAudits = audits.filter(a => a.status === "RUNNING").length;
  const completedContent = contentAnalyses.filter(a => a.status === "COMPLETED").length;
  const runningContent = contentAnalyses.filter(a => a.status === "RUNNING").length;

  const handleLoadAnalysis = async (analysisId: string) => {
    setLoadingAnalysisId(analysisId);
    try {
      const response = await fetch(`/api/content/history/${analysisId}`);
      if (response.ok) {
        const data = await response.json();
        loadFromHistory({
          analysisData: data.contentContext || {
            dominantKeywords: [],
            contentGaps: [],
            audiencePersona: '',
            tone: '',
          },
          aiSuggestions: data.aiSuggestions || [],
          events: data.events || [],
          domain: data.domain,
          runId: analysisId,
        });
        router.push('/content-strategy?view=dashboard');
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoadingAnalysisId(null);
    }
  };

  const handleNewStrategy = () => {
    resetStrategy();
    router.push('/content-strategy?view=analysis');
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Loading history...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              History
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              View all your SEO audits and content strategy analyses
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setFilterType("all");
                  router.push('/history');
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                  filterType === "all"
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>All</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                    {audits.length + contentAnalyses.length}
                  </span>
                </div>
                {filterType === "all" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </button>
              <button
                onClick={() => {
                  setFilterType("audits");
                  router.push('/history?tab=audits');
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                  filterType === "audits"
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>SEO Audits</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                    {audits.length}
                  </span>
                </div>
                {filterType === "audits" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </button>
              <button
                onClick={() => {
                  setFilterType("content");
                  router.push('/history?tab=content');
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                  filterType === "content"
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Content Strategy</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                    {contentAnalyses.length}
                  </span>
                </div>
                {filterType === "content" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </button>
            </div>
            
            {/* Filter Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <FilterToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onExport={() => console.log("Export clicked")}
              />
            </div>
          </div>

          {/* History List */}
          <div className="space-y-4">
            {filterType === "all" || filterType === "audits" ? (
              <>
                {filteredAudits.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      SEO Audits
                    </h2>
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                          <tr>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Domain
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              URL
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Score
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Grade
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {filteredAudits.map((audit) => (
                            <tr
                              key={audit.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-indigo-600" />
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {audit.domain}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                {audit.url}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {audit.overallScore ?? "--"}
                              </td>
                              <td className="px-6 py-4">
                                {audit.overallGrade && (
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      audit.overallGrade === "A"
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                        : audit.overallGrade === "B"
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                        : audit.overallGrade === "C"
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                    }`}
                                  >
                                    {audit.overallGrade}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {new Date(audit.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                {audit.completedAt && (
                                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                                    Completed
                                  </span>
                                )}
                                {audit.status === "RUNNING" && (
                                  <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                                    In Progress
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Link
                                  href={`/${audit.domain}?id=${audit.id}`}
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : null}

            {filterType === "all" || filterType === "content" ? (
              <>
                {filteredContent.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Content Strategy Analyses
                    </h2>
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                          <tr>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Domain
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Pages Analyzed
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Gaps Found
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Topics
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {filteredContent.map((analysis) => (
                            <tr
                              key={analysis.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {analysis.domain}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {analysis.pagesAnalyzed}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {analysis.gapsFound ?? 0}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {analysis.topics ?? 0}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {new Date(analysis.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                {analysis.status === "COMPLETED" && (
                                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                                    Completed
                                  </span>
                                )}
                                {analysis.status === "RUNNING" && (
                                  <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                                    In Progress
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {analysis.status === "COMPLETED" && (
                                  <button
                                    onClick={() => handleLoadAnalysis(analysis.id)}
                                    disabled={loadingAnalysisId === analysis.id}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                  >
                                    {loadingAnalysisId === analysis.id ? "Loading..." : "Load"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : null}

            {allItems.length === 0 && (
              <div className="text-center py-12">
                {filterType === "audits" ? (
                  <>
                    <FileSearch className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No audits yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Run your first SEO audit to see your history here
                    </p>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Run an Audit
                    </Link>
                  </>
                ) : filterType === "content" ? (
                  <>
                    <Database className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No content strategy analyses yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Analyze your website to discover content gaps and AI-powered suggestions
                    </p>
                    <Link
                      href="/content-strategy?view=analysis"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Start Analysis
                    </Link>
                  </>
                ) : (
                  <>
                    <FileSearch className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No history yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Start running audits or content analyses to see them here
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Run an Audit
                      </Link>
                      <Link
                        href="/content-strategy?view=analysis"
                        className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Analyze Content
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, allItems.length)} of {allItems.length} items
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white"
                            : "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  Search,
  Filter,
  BarChart3,
  Activity
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContentStrategy } from "@/contexts/ContentStrategyContext";
import SidebarLayout from "@/components/layout/SidebarLayout";

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
      <SidebarLayout onNewStrategy={handleNewStrategy}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Loading history...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout onNewStrategy={handleNewStrategy}>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Your History
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              View all your SEO audits and content strategy analyses
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Audits</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{audits.length}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Content Analyses</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{contentAnalyses.length}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{completedAudits + completedContent}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">In Progress</p>
                  <p className="text-3xl font-bold text-amber-600">{runningAudits + runningContent}</p>
                </div>
                <Clock className="w-10 h-10 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setFilterType("all");
                  router.push('/history');
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                  filterType === "all"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>All History</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-600">
                    {audits.length + contentAnalyses.length}
                  </span>
                </div>
                {filterType === "all" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => {
                  setFilterType("audits");
                  router.push('/history?tab=audits');
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                  filterType === "audits"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>SEO Audits</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                    {audits.length}
                  </span>
                </div>
                {filterType === "audits" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => {
                  setFilterType("content");
                  router.push('/history?tab=content');
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                  filterType === "content"
                    ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Content Strategy</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                    {contentAnalyses.length}
                  </span>
                </div>
                {filterType === "content" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                )}
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by domain or URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
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
                    <div className="space-y-3">
                      {filteredAudits.map((audit) => (
                        <Link
                          key={audit.id}
                          href={`/${audit.domain}?id=${audit.id}`}
                          className="block bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                  {audit.domain}
                                </h3>
                                {audit.overallGrade && (
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      audit.overallGrade === "A"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                        : audit.overallGrade === "B"
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                        : audit.overallGrade === "C"
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                    }`}
                                  >
                                    Grade: {audit.overallGrade}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{audit.url}</p>
                              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(audit.createdAt).toLocaleDateString()}
                                </div>
                                {audit.completedAt && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Completed
                                  </div>
                                )}
                                {audit.status === "RUNNING" && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    In Progress
                                  </div>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="w-5 h-5 text-slate-400" />
                          </div>
                        </Link>
                      ))}
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
                    <div className="space-y-3">
                      {filteredContent.map((analysis) => (
                        <div
                          key={analysis.id}
                          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <BarChart3 className="w-5 h-5 text-purple-500" />
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                  {analysis.domain}
                                </h3>
                                {analysis.status === "COMPLETED" && (
                                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                    Ready to Load
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{analysis.baseUrl}</p>
                              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Activity className="w-4 h-4" />
                                  {analysis.pagesAnalyzed} pages analyzed
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(analysis.createdAt).toLocaleDateString()}
                                </div>
                                {analysis.completedAt && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Completed
                                  </div>
                                )}
                                {analysis.status === "RUNNING" && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    In Progress
                                  </div>
                                )}
                              </div>
                            </div>
                            {analysis.status === "COMPLETED" && (
                              <button
                                onClick={() => handleLoadAnalysis(analysis.id)}
                                disabled={loadingAnalysisId === analysis.id}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {loadingAnalysisId === analysis.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Loading...
                                  </>
                                ) : (
                                  'Load Strategy'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}

            {allItems.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No history found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Start running audits or content analyses to see them here
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Audit
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

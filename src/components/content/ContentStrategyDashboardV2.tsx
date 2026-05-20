"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Target,
  BookOpen,
  Lightbulb,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Download,
  RefreshCw,
  Loader2,
  X,
  Copy,
  ChevronDown,
  ChevronUp,
  Globe,
  Calendar as CalendarIcon,
  Zap,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileSearch,
  BarChart3,
  Filter,
  Search,
  Maximize2,
  Info,
  FileEdit,
  Play,
  Sparkles,
} from "lucide-react";

interface Keyword {
  term: string;
  density: "High" | "Medium" | "Low";
  pages: number;
}

interface ContentContext {
  dominantKeywords: Keyword[];
  contentGaps: string[];
  audiencePersona: string;
  tone: string;
  overallWritingStyle?: {
    dominantTone: string;
    averageFormality: string;
    commonPerspective: string;
    brandVoiceSummary: string;
  };
  contentPatterns?: {
    preferredContentTypes: string[];
    averagePostLength: string;
    commonStructures: string[];
    ctaPatterns: string[];
  };
}

interface AISuggestion {
  type: "Blog Post" | "Whitepaper" | "Case Study" | "Guide" | "Infographic";
  title: string;
  reason: string;
  targetKeywords: string[];
  relatedServiceUrl?: string;
  contentOutline?: string[];
  suggestedTone?: string;
  targetLength?: number;
  keyMessagePoints?: string[];
}

interface PageData {
  url: string;
  type: string;
  title?: string;
  wordCount: number;
  mainTopic?: string;
  summary?: string;
  content?: string;
  keywords?: string[];
  writingStyle?: {
    tone: string;
    perspective: "First Person" | "Second Person" | "Third Person";
    formality: "Formal" | "Informal" | "Semi-Formal";
    sentenceStructure: string;
    averageSentenceLength: number;
    readabilityLevel: string;
    voice: "Active" | "Passive" | "Mixed";
  };
  contentStructure?: {
    hasHeadings: boolean;
    hasSubheadings: boolean;
    usesLists: boolean;
    hasCallToAction: boolean;
    paragraphCount: number;
    averageParagraphLength: number;
  };
  brandVoice?: {
    keyPhrases: string[];
    terminology: string[];
    valuePropositions: string[];
    differentiators: string[];
  };
}

interface AnalysisOutput {
  baseUrl: string;
  contentContext: ContentContext;
  aiSuggestions: AISuggestion[];
  pages: PageData[];
  extractionData?: {
    baseUrl: string;
    pagesProcessed: number;
    extractedPages: Array<{
      url: string;
      type: "service" | "blog" | "product" | "other";
      title?: string;
      content: string;
      wordCount: number;
      mainTopic?: string;
      summary?: string;
    }>;
    aggregatedContent: {
      services: string[];
      blogs: string[];
      products: string[];
    };
    totalWordCount: number;
  };
}

interface ContentStrategyDashboardV2Props {
  analysisOutput: AnalysisOutput | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onGenerateContent?: (gap: string) => void;
  onOpenPlanner?: () => void;
}

const SectionNav = ({ 
  sections, 
  activeSection 
}: { 
  sections: { id: string; label: string; icon: any }[];
  activeSection: string;
}) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="hidden lg:block sticky top-24 w-48 flex-shrink-0">
      <nav className="space-y-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
              activeSection === section.id
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default function ContentStrategyDashboardV2({
  analysisOutput,
  isLoading,
  onRefresh,
  onGenerateContent,
  onOpenPlanner,
}: ContentStrategyDashboardV2Props) {
  const [activeTab, setActiveTab] = useState("overview");
  const [keywordSort, setKeywordSort] = useState<{ field: "term" | "pages" | "density"; direction: "asc" | "desc" }>({
    field: "pages",
    direction: "desc"
  });
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [pageFilterType, setPageFilterType] = useState<"all" | "service" | "blog">("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<"all" | "Blog Post" | "Case Study" | "Guide" | "Whitepaper" | "Infographic">("all");
  const [isGeneratingContent, setIsGeneratingContent] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Debug logging
  console.log("[DashboardV2] Rendering with analysisOutput:", analysisOutput ? "EXISTS" : "NULL");
  if (analysisOutput) {
    console.log("[DashboardV2] analysisOutput keys:", Object.keys(analysisOutput));
    console.log("[DashboardV2] contentContext:", analysisOutput.contentContext);
    console.log("[DashboardV2] pages count:", analysisOutput.pages?.length || 0);
  }

  const sections = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "persona", label: "Target Persona", icon: Users },
    { id: "keywords", label: "Keywords", icon: Target },
    { id: "gaps", label: "Content Gaps", icon: AlertCircle },
    { id: "suggestions", label: "AI Suggestions", icon: Lightbulb },
    { id: "pages", label: "Analyzed Pages", icon: Globe },
  ];

  // Scroll spy effect
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id)
      }));

      for (const section of sectionElements) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Analyzing Content...
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            AI is extracting insights from your website content
          </p>
        </div>
      </div>
    );
  }

  if (!analysisOutput) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            No Analysis Data
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Start a content analysis to see your content strategy insights
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Start Analysis
            </button>
          )}
        </div>
      </div>
    );
  }

  const { contentContext, aiSuggestions, pages, extractionData } = analysisOutput;
  const totalPages = pages?.length || 0;
  const totalWordCount = pages?.reduce((sum, page) => sum + (page.wordCount || 0), 0) || 0;

  const servicePages = pages?.filter(p => {
    const typeLower = p.type?.toLowerCase() || '';
    const urlLower = p.url?.toLowerCase() || '';
    return typeLower === 'service' || urlLower.includes('/services/');
  }) || [];

  const blogPages = pages?.filter(p => {
    const typeLower = p.type?.toLowerCase() || '';
    const urlLower = p.url?.toLowerCase() || '';
    return typeLower === 'blog' || urlLower.includes('/blog/');
  }) || [];

  const getFilteredPages = () => {
    let filtered = pages || [];
    if (searchQuery) {
      filtered = filtered.filter(page =>
        (page.mainTopic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (page.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.url.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (pageFilterType !== 'all') {
      filtered = filtered.filter(p => {
        const typeLower = p.type?.toLowerCase() || '';
        const urlLower = p.url?.toLowerCase() || '';
        if (pageFilterType === 'service') {
          return typeLower === 'service' || urlLower.includes('/services/');
        } else if (pageFilterType === 'blog') {
          return typeLower === 'blog' || urlLower.includes('/blog/');
        }
        return false;
      });
    }
    return filtered;
  };

  const handleGenerateFromGap = async (gap: string) => {
    if (onGenerateContent) {
      onGenerateContent(gap);
    }
  };

  const togglePageExpansion = (pageUrl: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageUrl)) {
      newExpanded.delete(pageUrl);
    } else {
      newExpanded.add(pageUrl);
    }
    setExpandedPages(newExpanded);
  };

  const handleKeywordSort = (field: "term" | "pages" | "density") => {
    setKeywordSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getSortedKeywords = () => {
    const keywords = contentContext?.dominantKeywords || [];
    return [...keywords].sort((a, b) => {
      let comparison = 0;
      if (keywordSort.field === "term") {
        comparison = a.term.localeCompare(b.term);
      } else if (keywordSort.field === "pages") {
        comparison = a.pages - b.pages;
      } else if (keywordSort.field === "density") {
        const densityOrder = { "High": 3, "Medium": 2, "Low": 1 };
        comparison = densityOrder[a.density] - densityOrder[b.density];
      }
      return keywordSort.direction === "asc" ? comparison : -comparison;
    });
  };

  return (
    <div className="flex gap-8">
      {/* Scroll Spy Navigation */}
      <SectionNav sections={sections} activeSection={activeSection} />

      {/* Main Content */}
      <div ref={contentRef} className="flex-1 space-y-8">
        {/* Overview Section */}
        <section id="overview" className="scroll-mt-24">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Analysis Overview
            </h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600 uppercase">Pages</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">+12%</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalPages}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Analyzed</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <span className="text-xs font-medium text-green-600 uppercase">Words</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">+8%</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalWordCount.toLocaleString()}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Content</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    <span className="text-xs font-medium text-purple-600 uppercase">Keywords</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <Minus className="w-4 h-4" />
                    <span className="text-xs font-medium">0%</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{contentContext?.dominantKeywords?.length || 0}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Identified</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-medium text-amber-600 uppercase">Gaps</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-xs font-medium">-15%</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{contentContext?.contentGaps?.length || 0}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Opportunities</p>
              </div>
            </div>

            {/* Page Type Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Service Pages</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{servicePages.length}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${totalPages > 0 ? (servicePages.length / totalPages) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Blog Posts</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{blogPages.length}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${totalPages > 0 ? (blogPages.length / totalPages) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Persona Section */}
        <section id="persona" className="scroll-mt-24">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Target Persona & Writing Style
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Persona Info */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                  <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-3">Target Audience</h3>
                  <p className="text-lg text-slate-900 dark:text-slate-100">
                    {contentContext?.audiencePersona || 'Not yet identified'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-3">Brand Tone</h3>
                  <p className="text-lg text-slate-900 dark:text-slate-100">
                    {contentContext?.tone || 'Not yet identified'}
                  </p>
                </div>
              </div>

              {/* Writing Style */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Writing Style Analysis</h3>
                {contentContext?.overallWritingStyle ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-600">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Dominant Tone</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{contentContext.overallWritingStyle.dominantTone}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-600">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Formality</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{contentContext.overallWritingStyle.averageFormality}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-600">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Perspective</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{contentContext.overallWritingStyle.commonPerspective}</span>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Brand Voice Summary</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{contentContext.overallWritingStyle.brandVoiceSummary}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Writing style analysis not available</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Keywords Section */}
        <section id="keywords" className="scroll-mt-24">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Dominant Keywords
            </h2>

            {contentContext?.dominantKeywords && contentContext.dominantKeywords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4">
                        <button
                          onClick={() => handleKeywordSort("term")}
                          className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Keyword
                          {keywordSort.field === "term" && (
                            keywordSort.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4">
                        <button
                          onClick={() => handleKeywordSort("pages")}
                          className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Pages
                          {keywordSort.field === "pages" && (
                            keywordSort.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4">
                        <button
                          onClick={() => handleKeywordSort("density")}
                          className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Density
                          {keywordSort.field === "density" && (
                            keywordSort.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedKeywords().map((keyword, index) => (
                      <tr
                        key={index}
                        className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                          keyword.density === "High"
                            ? "bg-red-50/50 dark:bg-red-900/10"
                            : keyword.density === "Medium"
                            ? "bg-amber-50/50 dark:bg-amber-900/10"
                            : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{keyword.term}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-600 dark:text-slate-400">{keyword.pages} page{keyword.pages !== 1 ? 's' : ''}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            keyword.density === "High"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                              : keyword.density === "Medium"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                          }`}>
                            {keyword.density}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">No keywords identified yet</p>
            )}
          </div>
        </section>

        {/* Content Gaps Section */}
        <section id="gaps" className="scroll-mt-24">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Content Gaps ({contentContext?.contentGaps?.length || 0})
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Click "Draft Article" to generate content for any gap
              </p>
            </div>

            {contentContext?.contentGaps && contentContext.contentGaps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contentContext.contentGaps.map((gap, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                      index < 2
                        ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                        : index < 4
                        ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                        : "bg-slate-50 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        index < 2
                          ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                          : index < 4
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300"
                      }`}>
                        {index < 2 ? "High Priority" : index < 4 ? "Medium Priority" : "Low Priority"}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">#{index + 1}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4 line-clamp-2">{gap}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerateFromGap(gap)}
                        disabled={isGeneratingContent === gap}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                      >
                        {isGeneratingContent === gap ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileEdit className="w-4 h-4" />
                        )}
                        Draft Article
                      </button>
                      <button
                        onClick={onOpenPlanner}
                        className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                        title="Schedule for later"
                      >
                        <CalendarIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-slate-700 dark:text-slate-300 font-medium">No Content Gaps Found!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Your content strategy looks comprehensive</p>
              </div>
            )}
          </div>
        </section>

        {/* AI Suggestions Section */}
        <section id="suggestions" className="scroll-mt-24">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                AI Content Suggestions ({aiSuggestions?.length || 0})
              </h2>

              {/* Content Type Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-500 dark:text-slate-400">Filter by:</span>
                {["all", "Blog Post", "Case Study", "Guide", "Whitepaper", "Infographic"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setContentTypeFilter(type as typeof contentTypeFilter)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      contentTypeFilter === type
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {type === "all" ? "All Types" : type}
                  </button>
                ))}
              </div>
            </div>

            {aiSuggestions && aiSuggestions.length > 0 ? (
              <div className="space-y-4">
                {aiSuggestions
                  .filter(suggestion => contentTypeFilter === "all" || suggestion.type === contentTypeFilter)
                  .map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-700/30 rounded-xl p-5 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          suggestion.type === "Blog Post" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
                          suggestion.type === "Case Study" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                          suggestion.type === "Guide" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" :
                          "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300"
                        }`}>
                          {suggestion.type}
                        </span>
                        {suggestion.targetLength && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ~{suggestion.targetLength} words
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleGenerateFromGap(suggestion.title)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generate
                      </button>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{suggestion.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{suggestion.reason}</p>

                    {suggestion.targetKeywords && suggestion.targetKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {suggestion.targetKeywords.map((kw, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-600 rounded text-xs text-slate-700 dark:text-slate-300">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {suggestion.relatedServiceUrl && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                        <a
                          href={suggestion.relatedServiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Related Service
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">No AI suggestions available yet</p>
            )}
          </div>
        </section>

        {/* Analyzed Pages Section */}
        <section id="pages" className="scroll-mt-24">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Analyzed Pages ({getFilteredPages().length})
              </h2>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filter */}
                <select
                  value={pageFilterType}
                  onChange={(e) => setPageFilterType(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="all">All Types</option>
                  <option value="service">Services</option>
                  <option value="blog">Blog</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {getFilteredPages().map((page, index) => (
                <div
                  key={page.url}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden"
                >
                  <button
                    onClick={() => togglePageExpansion(page.url)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                        page.type === 'service' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                        page.type === 'blog' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                      }`}>
                        {page.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {page.mainTopic || page.title || page.url.split('/').pop() || 'Untitled'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{page.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{page.wordCount?.toLocaleString() || 0} words</span>
                      {expandedPages.has(page.url) ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {expandedPages.has(page.url) && (
                    <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-600">
                      <div className="pt-4 space-y-3">
                        {page.summary && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Summary</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{page.summary}</p>
                          </div>
                        )}
                        {page.keywords && page.keywords.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Keywords</p>
                            <div className="flex flex-wrap gap-1">
                              {page.keywords.map((kw, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-600 rounded text-xs text-slate-700 dark:text-slate-300">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {page.writingStyle && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Writing Style</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 rounded text-xs text-purple-700 dark:text-purple-300">
                                {page.writingStyle.tone}
                              </span>
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded text-xs text-blue-700 dark:text-blue-300">
                                {page.writingStyle.formality}
                              </span>
                              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 rounded text-xs text-green-700 dark:text-green-300">
                                {page.writingStyle.voice} Voice
                              </span>
                            </div>
                          </div>
                        )}
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Page
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions Footer */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Ready to Create Content?</h2>
              <p className="text-blue-100 text-sm">Use AI to generate articles based on your content gaps and suggestions</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onOpenPlanner}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors font-medium"
              >
                <CalendarIcon className="w-4 h-4" />
                Open Planner
              </button>
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Re-Analyze
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

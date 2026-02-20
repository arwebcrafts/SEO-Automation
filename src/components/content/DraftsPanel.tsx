"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  ExternalLink,
  Plus,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Copy,
  MoreVertical,
  Sparkles,
  Image as ImageIcon,
  MapPin,
  Tag,
  User,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useContentStrategy } from "@/contexts/ContentStrategyContext";

interface Draft {
  id: string;
  title: string;
  content: string;
  status: "PENDING" | "GENERATING" | "READY" | "PUBLISHING" | "PUBLISHED" | "FAILED";
  scheduledFor: string;
  createdAt: string;
  updatedAt: string;
  wordpressSite?: {
    siteUrl: string;
  };
  featuredImage?: string;
  imageUrl?: string;
  imagePrompt?: string;
  metadata?: {
    keywords: string[];
    targetLocation: string;
    tone: string;
    contentType: string;
    wordCount: number;
  };
}

export default function DraftsPanel() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { activeWebsite, openWebsiteSwitcher } = useContentStrategy();

  useEffect(() => {
    fetchDrafts();
  }, [activeWebsite?.id]);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const url = activeWebsite?.id 
        ? `/api/posts/update?websiteId=${activeWebsite.id}`
        : "/api/posts/update";
      const response = await fetch(url);
      const data = await response.json();
      setDrafts(data.posts || []);
    } catch (error) {
      console.error("Error fetching drafts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrafts = drafts.filter((draft) => {
    const matchesSearch = draft.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || draft.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
      PUBLISHED: { 
        color: "text-green-700 dark:text-green-300", 
        bg: "bg-green-100 dark:bg-green-900/30",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        label: "Published"
      },
      PUBLISHING: { 
        color: "text-blue-700 dark:text-blue-300", 
        bg: "bg-blue-100 dark:bg-blue-900/30",
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        label: "Publishing"
      },
      READY: { 
        color: "text-purple-700 dark:text-purple-300", 
        bg: "bg-purple-100 dark:bg-purple-900/30",
        icon: <Eye className="w-3.5 h-3.5" />,
        label: "Ready"
      },
      GENERATING: { 
        color: "text-amber-700 dark:text-amber-300", 
        bg: "bg-amber-100 dark:bg-amber-900/30",
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        label: "Generating"
      },
      FAILED: { 
        color: "text-red-700 dark:text-red-300", 
        bg: "bg-red-100 dark:bg-red-900/30",
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        label: "Failed"
      },
      PENDING: { 
        color: "text-slate-700 dark:text-slate-300", 
        bg: "bg-slate-100 dark:bg-slate-900/30",
        icon: <Clock className="w-3.5 h-3.5" />,
        label: "Pending"
      },
    };
    return configs[status] || configs.PENDING;
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content.replace(/<[^>]*>/g, ""));
  };

  const statusCounts = {
    all: drafts.length,
    PENDING: drafts.filter(d => d.status === "PENDING").length,
    GENERATING: drafts.filter(d => d.status === "GENERATING").length,
    READY: drafts.filter(d => d.status === "READY").length,
    PUBLISHED: drafts.filter(d => d.status === "PUBLISHED").length,
    FAILED: drafts.filter(d => d.status === "FAILED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading drafts...</p>
        </div>
      </div>
    );
  }

  // Show website selection prompt if no website is selected
  if (!activeWebsite) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Select a Website
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Choose a website to view and manage its content drafts
        </p>
        <button
          onClick={openWebsiteSwitcher}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Globe className="w-4 h-4" />
          Select Website
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(statusCounts).map(([key, count]) => {
          const config = key === "all" ? { color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800", label: "All" } : getStatusConfig(key);
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`p-3 rounded-xl border-2 transition-all ${
                statusFilter === key 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                  : "border-transparent bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
              }`}
            >
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{count}</p>
              <p className={`text-xs font-medium ${config.color}`}>{config.label || key}</p>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search drafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Drafts List/Grid */}
      {filteredDrafts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No drafts found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Generate content from the AI Writer to create your first draft"}
          </p>
          <button
            onClick={() => window.location.href = "/content-strategy?view=production"}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate Content
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrafts.map((draft) => {
            const statusConfig = getStatusConfig(draft.status);
            return (
              <div
                key={draft.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Featured Image */}
                {draft.featuredImage || draft.imageUrl ? (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={draft.featuredImage || draft.imageUrl} 
                      alt={draft.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>
                    {draft.imagePrompt && (
                      <div className="absolute bottom-3 left-3">
                        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-white" />
                          <span className="text-xs text-white">AI Generated</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center relative">
                    <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="p-5">
                  <div className="mb-3">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-2">
                      {draft.title}
                    </h3>
                    
                    {/* Keywords */}
                    {draft.metadata?.keywords && draft.metadata.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {draft.metadata.keywords.slice(0, 3).map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                          >
                            <Tag className="w-2 h-2" />
                            {keyword}
                          </span>
                        ))}
                        {draft.metadata.keywords.length > 3 && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            +{draft.metadata.keywords.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                    {draft.content.replace(/<[^>]*>/g, "").substring(0, 150)}...
                  </p>
                  
                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    {draft.metadata?.targetLocation && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {draft.metadata.targetLocation}
                      </div>
                    )}
                    {draft.metadata?.wordCount && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {draft.metadata.wordCount.toLocaleString()} words
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(draft.scheduledFor).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(draft.updatedAt).toLocaleDateString()}
                    </div>
                    {draft.metadata?.tone && (
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {draft.metadata.tone}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/editor?id=${draft.id}`}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleCopyContent(draft.content)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Copy content"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {draft.status === "PUBLISHED" && draft.wordpressSite && (
                      <a
                        href={draft.wordpressSite.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="View live"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Delete this draft?")) {
                        // TODO: Implement delete
                      }
                    }}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Content</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Metadata</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Scheduled</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredDrafts.map((draft) => {
                const statusConfig = getStatusConfig(draft.status);
                return (
                  <tr key={draft.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          {draft.featuredImage || draft.imageUrl ? (
                            <img 
                              src={draft.featuredImage || draft.imageUrl} 
                              alt={draft.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate mb-1">
                            {draft.title}
                          </p>
                          {/* Keywords */}
                          {draft.metadata?.keywords && draft.metadata.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {draft.metadata.keywords.slice(0, 2).map((keyword, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                                >
                                  <Tag className="w-2 h-2" />
                                  {keyword}
                                </span>
                              ))}
                              {draft.metadata.keywords.length > 2 && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  +{draft.metadata.keywords.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                      {draft.imagePrompt && (
                        <div className="mt-1">
                          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            AI Image
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {draft.metadata?.targetLocation && (
                          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <MapPin className="w-3 h-3" />
                            {draft.metadata.targetLocation}
                          </div>
                        )}
                        {draft.metadata?.wordCount && (
                          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <FileText className="w-3 h-3" />
                            {draft.metadata.wordCount.toLocaleString()} words
                          </div>
                        )}
                        {draft.metadata?.tone && (
                          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <User className="w-3 h-3" />
                            {draft.metadata.tone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(draft.scheduledFor).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/editor?id=${draft.id}`}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleCopyContent(draft.content)}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

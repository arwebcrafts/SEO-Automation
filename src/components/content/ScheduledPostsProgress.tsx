"use client";

import { useState, useEffect } from "react";
import {
  Calendar, Clock, CheckCircle2, Loader2, AlertCircle, RefreshCw,
  ExternalLink, Trash2, Eye, FileText, Image as ImageIcon, Filter, Globe,
} from "lucide-react";
import { useContentStrategy } from "@/contexts/ContentStrategyContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  scheduledFor: string;
  status: "PENDING" | "PUBLISHING" | "PUBLISHED" | "FAILED";
  wpPostId?: number;
  publishedAt?: string;
  publishError?: string;
  featuredImageUrl?: string;
  focusKeyword: string;
  contentLength?: number;
}

export default function ScheduledPostsProgress() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);
  const { activeWebsite, openWebsiteSwitcher } = useContentStrategy();

  useEffect(() => {
    loadScheduledPosts();
  }, [activeWebsite?.id]);

  // Timeout after 10 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isLoading) {
      timeoutId = setTimeout(() => {
        setIsTimeout(true);
      }, 10000);
    } else {
      setIsTimeout(false);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  const loadScheduledPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = activeWebsite?.id 
        ? `/api/scheduled-posts?limit=100&websiteId=${activeWebsite.id}`
        : "/api/scheduled-posts?limit=100";
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts || []);
      } else {
        throw new Error(data.error || "Failed to load posts");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scheduled posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this scheduled post?")) return;
    
    try {
      const response = await fetch(`/api/scheduled-posts?id=${postId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filter === "all") return true;
    return post.status === filter;
  });

  const stats = {
    total: posts.length,
    pending: posts.filter(p => p.status === "PENDING").length,
    published: posts.filter(p => p.status === "PUBLISHED").length,
    failed: posts.filter(p => p.status === "FAILED").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "PENDING": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "PUBLISHING": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      case "FAILED": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PUBLISHED": return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "PENDING": return <Clock className="w-4 h-4 text-blue-600" />;
      case "PUBLISHING": return <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />;
      case "FAILED": return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-12 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeout Message */}
        {isTimeout && (
          <Alert variant="warning" title="Loading">
            Taking longer than usual. Please wait...
          </Alert>
        )}

        {/* Filter Bar Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
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
          Choose a website to view its scheduled posts progress
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Scheduled</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.pending}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.published}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Published</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.failed}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Needs Attention Alert Strip */}
      {stats.failed > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-900/20 dark:to-amber-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Needs Attention: {stats.failed} Failed Post{stats.failed !== 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {stats.failed} scheduled post{stats.failed !== 1 ? 's have' : ' has'} failed to publish. Review errors and retry.
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilter("FAILED")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              View Failed
            </button>
          </div>
        </div>
      )}

      {/* Filter & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Posts</option>
            <option value="PENDING">Pending</option>
            <option value="PUBLISHED">Published</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        
        <button
          onClick={loadScheduledPosts}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadScheduledPosts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No scheduled posts found</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            Use Auto Pilot to generate and schedule content
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Post</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scheduled For</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Keywords</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {post.featuredImageUrl ? (
                          <img
                            src={post.featuredImageUrl}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="max-w-xs">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {post.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {post.contentLength?.toLocaleString() || "N/A"} words
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {new Date(post.scheduledFor).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(post.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(post.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                          {post.status}
                        </span>
                      </div>
                      {post.status === "PUBLISHED" && post.wpPostId && (
                        <p className="text-xs text-slate-500 mt-1">WP ID: {post.wpPostId}</p>
                      )}
                      {post.status === "FAILED" && post.publishError && (
                        <p className="text-xs text-red-500 mt-1 truncate max-w-[150px]" title={post.publishError}>
                          {post.publishError}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs">
                        {post.focusKeyword || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {post.status === "PUBLISHED" && post.wpPostId && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_WORDPRESS_URL || ''}/?p=${post.wpPostId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            title="View on WordPress"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {post.status !== "PUBLISHED" && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Post Preview Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Post Preview</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {selectedPost.featuredImageUrl && (
                <img
                  src={selectedPost.featuredImageUrl}
                  alt={selectedPost.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {selectedPost.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                <span>Scheduled: {new Date(selectedPost.scheduledFor).toLocaleString()}</span>
                <span className={`px-2 py-0.5 rounded ${getStatusColor(selectedPost.status)}`}>
                  {selectedPost.status}
                </span>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
                <div dangerouslySetInnerHTML={{ __html: selectedPost.content.substring(0, 1000) + "..." }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

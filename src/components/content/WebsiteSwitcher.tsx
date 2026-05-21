"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Plus,
  Check,
  Loader2,
  ExternalLink,
  Settings,
  Trash2,
  ChevronDown,
  X,
  AlertCircle,
  Search,
} from "lucide-react";

interface Website {
  id: string;
  name: string;
  siteUrl: string;
  apiKey?: string;
  isActive: boolean;
  _count?: {
    scheduledContent: number;
    keywords: number;
  };
  createdAt: string;
}

interface WebsiteSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onWebsiteSelect: (website: Website) => void;
  currentWebsiteId?: string;
}

export default function WebsiteSwitcher({
  isOpen,
  onClose,
  onWebsiteSelect,
  currentWebsiteId,
}: WebsiteSwitcherProps) {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter websites based on search query
  const filteredWebsites = websites.filter(
    (website) =>
      website.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      website.siteUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get favicon URL from website URL
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWebsites();
    }
  }, [isOpen]);

  const loadWebsites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/content/sites");
      const data = await response.json();
      if (data.success) {
        setWebsites(data.data || []);
      } else {
        setError(data.error || "Failed to load websites");
      }
    } catch (err) {
      setError("Failed to load websites");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim() || !newSiteUrl.trim()) {
      setAddError("Name and URL are required");
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      // Normalize URL
      let normalizedUrl = newSiteUrl.trim();
      if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
        normalizedUrl = "https://" + normalizedUrl;
      }
      normalizedUrl = normalizedUrl.replace(/\/$/, "");

      const response = await fetch("/api/content/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSiteName.trim(),
          siteUrl: normalizedUrl,
          apiKey: newApiKey.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWebsites((prev) => [data.data, ...prev]);
        setNewSiteName("");
        setNewSiteUrl("");
        setNewApiKey("");
        setShowAddForm(false);
        // Auto-select the new website
        onWebsiteSelect(data.data);
      } else {
        setAddError(data.error || "Failed to add website");
      }
    } catch (err) {
      setAddError("Failed to add website");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteWebsite = async (websiteId: string) => {
    if (!confirm("Are you sure you want to delete this website? All associated data will be lost.")) {
      return;
    }

    try {
      const response = await fetch(`/api/content/sites?id=${websiteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWebsites((prev) => prev.filter((w) => w.id !== websiteId));
      }
    } catch (err) {
      console.error("Failed to delete website:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Your Websites
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Select a website to manage its content strategy
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Search Input */}
          {!showAddForm && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search websites..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={loadWebsites}
                className="mt-4 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWebsites.map((website) => {
                const faviconUrl = getFaviconUrl(website.siteUrl);
                return (
                  <div
                    key={website.id}
                    onClick={() => onWebsiteSelect(website)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      currentWebsiteId === website.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    {faviconUrl ? (
                      <img
                        src={faviconUrl}
                        alt=""
                        className="w-12 h-12 rounded-xl flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {website.name}
                      </h3>
                      {currentWebsiteId === website.id && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {website.siteUrl}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      {website._count && (
                        <>
                          <span>{website._count.scheduledContent} posts</span>
                          <span>{website._count.keywords} keywords</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentWebsiteId === website.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWebsite(website.id);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                );
              })}

              {filteredWebsites.length === 0 && !showAddForm && (
                <div className="text-center py-8">
                  <Globe className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No websites yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Add your first website to start creating content
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Add Website Form */}
          {showAddForm && (
            <form onSubmit={handleAddWebsite} className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Add New Website
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Website Name *
                  </label>
                  <input
                    type="text"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    placeholder="My Business Website"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Website URL *
                  </label>
                  <input
                    type="text"
                    value={newSiteUrl}
                    onChange={(e) => setNewSiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    WordPress API Key (Optional)
                  </label>
                  <input
                    type="text"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder="Your SEO AutoFix plugin API key"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Required for auto-publishing to WordPress
                  </p>
                </div>
                {addError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{addError}</p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Website
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setAddError(null);
                    }}
                    className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add New Website
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Compact website selector for sidebar/header
export function WebsiteSelector({
  currentWebsite,
  onOpenSwitcher,
}: {
  currentWebsite?: Website | null;
  onOpenSwitcher: () => void;
}) {
  return (
    <button
      onClick={onOpenSwitcher}
      className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
        <Globe className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {currentWebsite?.name || "Select Website"}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {currentWebsite?.siteUrl || "Click to add or switch"}
        </p>
      </div>
      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
    </button>
  );
}

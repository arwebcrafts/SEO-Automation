"use client";

import SidebarLayout from "@/components/layout/SidebarLayout";
import { AuditForm } from "@/components/audit/audit-form";
import { StatCard } from "@/components/dashboard/StatCard";
import { NoDomainOnboarding } from "@/components/dashboard/NoDomainOnboarding";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ThingsToDo } from "@/components/dashboard/ThingsToDo";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  FileText,
  Calendar,
  TrendingUp,
  BarChart3,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";

interface RecentAudit {
  id: string;
  domain: string;
  status: string;
  overallScore: number | null;
  overallGrade: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDomain, setHasDomain] = useState(false);
  const [contentDraftsCount, setContentDraftsCount] = useState(0);
  const [scheduledPostsCount, setScheduledPostsCount] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isWordPressConnected, setIsWordPressConnected] = useState(false);
  const [hasGeneratedArticle, setHasGeneratedArticle] = useState(false);
  const [hasScheduledPost, setHasScheduledPost] = useState(false);

  const fetchRecentAudits = async () => {
    try {
      const res = await fetch("/api/audit/history");
      if (res.ok) {
        const data = await res.json();
        setRecentAudits(data.audits?.slice(0, 5) || []);
        setHasDomain(data.audits?.length > 0);
        setFetchError(null);
      } else {
        throw new Error(`Failed to load audit history (${res.status})`);
      }
    } catch (error) {
      console.error("Error fetching recent audits:", error);
      setFetchError("Could not load your dashboard data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const fetchContentStats = async () => {
    try {
      // Fetch draft count
      const draftsRes = await fetch("/api/content/history?status=draft&limit=1");
      if (draftsRes.ok) {
        const draftsData = await draftsRes.json();
        setContentDraftsCount(draftsData.total || draftsData.count || 0);
      }
    } catch (error) {
      console.error("Error fetching content drafts:", error);
    }

    try {
      // Fetch scheduled posts count
      const scheduledRes = await fetch("/api/scheduled-posts?status=scheduled&limit=1");
      if (scheduledRes.ok) {
        const scheduledData = await scheduledRes.json();
        setScheduledPostsCount(scheduledData.total || scheduledData.count || 0);
      }
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
    }
  };

  const fetchOnboardingStatus = async () => {
    try {
      const wpRes = await fetch("/api/wordpress");
      if (wpRes.ok) {
        const wpData = await wpRes.json();
        setIsWordPressConnected(!!(wpData.siteUrl || wpData.connected));
      }
    } catch { /* silent — non-critical */ }

    try {
      const historyRes = await fetch("/api/content/history?limit=1");
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const items = historyData.items || historyData.articles || [];
        setHasGeneratedArticle(items.length > 0);
      }
    } catch { /* silent */ }

    try {
      const scheduledRes = await fetch("/api/scheduled-posts?limit=1");
      if (scheduledRes.ok) {
        const scheduledData = await scheduledRes.json();
        const items = scheduledData.posts || scheduledData.items || [];
        setHasScheduledPost(items.length > 0);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchRecentAudits();
      fetchContentStats();
      fetchOnboardingStatus();
    }
  }, [isSignedIn]);

  const handleAddDomain = (domain: string) => {
    setHasDomain(true);
    // Navigate to audit form with the domain pre-filled
    router.push(`/audits/new?url=${encodeURIComponent(domain)}`);
  };

  const thingsToDoTasks = [
    {
      id: "add-website",
      label: "Add your first website",
      completed: hasDomain,
      action: "/settings?tab=sites"
    },
    {
      id: "run-audit",
      label: "Run your first audit",
      completed: recentAudits.length > 0,
      action: "/audits/new"
    },
    {
      id: "connect-wordpress",
      label: "Connect WordPress",
      completed: isWordPressConnected,
      action: "/settings?tab=wordpress"
    },
    {
      id: "generate-article",
      label: "Generate your first AI article",
      completed: hasGeneratedArticle,
      action: "/content/production"
    },
    {
      id: "schedule-post",
      label: "Schedule your first post",
      completed: hasScheduledPost,
      action: "/content/calendar"
    },
  ];

  const handleTaskClick = (taskId: string) => {
    switch (taskId) {
      case "add-website":
        router.push("/settings?tab=sites");
        break;
      case "run-audit":
        router.push("/audits/new");
        break;
      case "connect-wordpress":
        router.push("/settings?tab=wordpress");
        break;
      case "generate-article":
        router.push("/content/production");
        break;
      case "schedule-post":
        router.push("/content/calendar");
        break;
      default:
        break;
    }
  };

  // Show onboarding if no domain
  if (!hasDomain && !loading) {
    return (
      <SidebarLayout>
        <NoDomainOnboarding onAddDomain={handleAddDomain} />
      </SidebarLayout>
    );
  }

  const dashboardContent = (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Welcome back, {user?.firstName || "there"} 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {hasDomain
              ? `Here's a snapshot of your SEO health`
              : "Here's an overview of your SEO activity"
            }
          </p>
        </div>

        {/* Error Banner */}
        {fetchError && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{fetchError}</span>
            <button
              onClick={() => {
                setLoading(true);
                setFetchError(null);
                fetchRecentAudits();
              }}
              className="ml-auto flex items-center gap-1.5 text-red-600 hover:text-red-800 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Audits"
            value={recentAudits.length}
            delta={{
              value: recentAudits.length > 0 ? "+2" : "0",
              trend: recentAudits.length > 0 ? "up" : "neutral",
              period: "this month"
            }}
            icon={TrendingUp}
            href="/history?tab=audits"
            loading={loading}
          />
          <StatCard
            label="SEO Score"
            value={
              recentAudits.length > 0
                ? Math.round(
                    recentAudits
                      .filter((a) => a.overallScore !== null)
                      .reduce((sum, a) => sum + (a.overallScore || 0), 0) /
                      recentAudits.filter((a) => a.overallScore !== null).length
                  )
                : "--"
            }
            delta={recentAudits.length > 0 ? {
              value: "+5%",
              trend: "up",
              period: "vs last month"
            } : undefined}
            icon={BarChart3}
            href="/history?tab=audits"
            loading={loading}
          />
          <StatCard
            label="Content Drafts"
            value={contentDraftsCount}
            delta={{
              value: contentDraftsCount > 0 ? `${contentDraftsCount}` : "0",
              trend: contentDraftsCount > 0 ? "up" : "neutral",
              period: "active"
            }}
            icon={FileText}
            href="/content/drafts"
            loading={loading}
          />
          <StatCard
            label="Scheduled Posts"
            value={scheduledPostsCount}
            delta={{
              value: scheduledPostsCount > 0 ? `${scheduledPostsCount}` : "0",
              trend: scheduledPostsCount > 0 ? "up" : "neutral",
              period: "upcoming"
            }}
            icon={Calendar}
            href="/content/calendar"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Audit */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Run an audit
              </h2>
              <AuditForm />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Scans 50+ ranking factors • ~30 seconds
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="order-1 lg:order-2">
            <RecentActivity audits={recentAudits} loading={loading} />
          </div>
        </div>

        {/* Things to Do Widget */}
        <div className="mt-6">
          <ThingsToDo tasks={thingsToDoTasks} onTaskClick={handleTaskClick} />
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <SidebarLayout>{dashboardContent}</SidebarLayout>
    </ErrorBoundary>
  );
}

"use client";

import SidebarLayout from "@/components/layout/SidebarLayout";
import { AuditForm } from "@/components/audit/audit-form";
import { StatCard } from "@/components/dashboard/StatCard";
import { NoDomainOnboarding } from "@/components/dashboard/NoDomainOnboarding";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ThingsToDo } from "@/components/dashboard/ThingsToDo";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  FileText,
  Calendar,
  TrendingUp,
  BarChart3,
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
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDomain, setHasDomain] = useState(false);

  useEffect(() => {
    const fetchRecentAudits = async () => {
      try {
        const res = await fetch("/api/audit/history");
        if (res.ok) {
          const data = await res.json();
          setRecentAudits(data.audits?.slice(0, 5) || []);
          setHasDomain(data.audits?.length > 0);
        }
      } catch (error) {
        console.error("Error fetching recent audits:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn) {
      fetchRecentAudits();
    }
  }, [isSignedIn]);

  const handleAddDomain = (domain: string) => {
    // TODO: Implement domain addition logic
    console.log("Adding domain:", domain);
    setHasDomain(true);
  };

  const thingsToDoTasks = [
    { id: "add-website", label: "Add your first website", completed: hasDomain },
    { id: "run-audit", label: "Run your first audit", completed: recentAudits.length > 0 },
    { id: "connect-wordpress", label: "Connect WordPress", completed: false },
    { id: "generate-article", label: "Generate your first AI article", completed: false },
    { id: "schedule-post", label: "Schedule your first post", completed: false },
  ];

  const handleTaskClick = (taskId: string) => {
    // TODO: Implement task navigation
    console.log("Task clicked:", taskId);
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
          />
          <StatCard
            label="Content Drafts"
            value={0}
            delta={{
              value: "0",
              trend: "neutral",
              period: "active"
            }}
            icon={FileText}
            href="/content-strategy?view=drafts"
          />
          <StatCard
            label="Scheduled Posts"
            value={0}
            delta={{
              value: "0",
              trend: "neutral",
              period: "upcoming"
            }}
            icon={Calendar}
            href="/content-strategy?view=calendar"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Audit */}
          <div className="lg:col-span-2">
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
          <div>
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

  return <SidebarLayout>{dashboardContent}</SidebarLayout>;
}

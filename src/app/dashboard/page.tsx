"use client";

import SidebarLayout from "@/components/layout/SidebarLayout";
import { AuditForm } from "@/components/audit/audit-form";
import { useAuth } from "@clerk/nextjs";
import {
  FileText,
  Calendar,
  TrendingUp,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
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
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentAudits = async () => {
      try {
        const res = await fetch("/api/audit/history");
        if (res.ok) {
          const data = await res.json();
          setRecentAudits(data.audits?.slice(0, 5) || []);
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

  const dashboardContent = (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Welcome back
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Here's an overview of your SEO activity
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Last 30 days</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {recentAudits.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Total Audits
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {recentAudits.length > 0
                ? Math.round(
                    recentAudits
                      .filter((a) => a.overallScore !== null)
                      .reduce((sum, a) => sum + (a.overallScore || 0), 0) /
                      recentAudits.filter((a) => a.overallScore !== null).length
                  )
                : "--"}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              SEO Score
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              0
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Content Drafts
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Upcoming</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              0
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Scheduled Posts
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Audit */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Quick SEO Audit
              </h2>
              <AuditForm />
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Recent Activity
                </h2>
                <Link
                  href="/history?tab=audits"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-slate-100 dark:bg-slate-700 rounded-lg h-16"
                    />
                  ))}
                </div>
              ) : recentAudits.length > 0 ? (
                <div className="space-y-3">
                  {recentAudits.map((audit) => (
                    <div
                      key={audit.id}
                      className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          audit.overallGrade === "A" || audit.overallGrade === "B"
                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                            : audit.overallGrade === "C"
                            ? "bg-amber-100 dark:bg-amber-900/30"
                            : "bg-rose-100 dark:bg-rose-900/30"
                        }`}
                      >
                        <span
                          className={`text-sm font-bold ${
                            audit.overallGrade === "A" || audit.overallGrade === "B"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : audit.overallGrade === "C"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {audit.overallGrade || "--"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {audit.domain}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(audit.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    No audits yet
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Run your first audit to see activity here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return <SidebarLayout>{dashboardContent}</SidebarLayout>;
}

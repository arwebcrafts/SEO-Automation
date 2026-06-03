"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  BarChart3,
  Search,
  Plus
} from "lucide-react";
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

export default function AuditsPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const auditsRes = await fetch("/api/audit/history");
        if (auditsRes.ok) {
          const auditsData = await auditsRes.json();
          setAudits(auditsData.audits || []);
        }
      } catch (error) {
        console.error("Error fetching audits:", error);
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

  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Loading audits...</p>
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                SEO Audits
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                View and manage your website SEO audits
              </p>
            </div>
            <Link
              href="/audits/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              New Audit
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audits by domain or URL..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Audits List */}
          {filteredAudits.length > 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
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
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {searchQuery ? "No audits found" : "No audits yet"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {searchQuery 
                  ? "Try a different search term"
                  : "Run your first SEO audit to see your history here"
                }
              </p>
              {!searchQuery && (
                <Link
                  href="/audits/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Run an Audit
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

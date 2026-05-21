import { Clock, AlertCircle, ArrowRight, FileSearch } from "lucide-react";
import Link from "next/link";

interface RecentAudit {
  id: string;
  domain: string;
  status: string;
  overallScore: number | null;
  overallGrade: string | null;
  createdAt: string;
}

interface RecentActivityProps {
  audits: RecentAudit[];
  loading: boolean;
}

export function RecentActivity({ audits, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="w-3/4 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Activity</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <FileSearch className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No audits yet</p>
            <p className="text-xs text-slate-400 mt-1">Run your first audit to see results here</p>
          </div>
          <a
            href="/audits/new"
            className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Run First Audit
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
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
      <div className="space-y-3">
        {audits.map((audit) => (
          <Link
            key={audit.id}
            href={`/${audit.domain}?id=${audit.id}`}
            className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors block"
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
          </Link>
        ))}
      </div>
    </div>
  );
}

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
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-slate-100 dark:bg-slate-700 rounded-lg h-16"
            />
          ))}
        </div>
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSearch className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No audits yet
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Run your first audit above to start tracking SEO health over time.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            Learn more about audits
            <ArrowRight className="w-4 h-4" />
          </Link>
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

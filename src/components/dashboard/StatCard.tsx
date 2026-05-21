import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface Delta {
  value: string;
  trend: "up" | "down" | "neutral";
  period: string;
}

interface StatCardProps {
  label: string;
  value: number | string;
  delta?: Delta;
  icon: LucideIcon;
  href?: string;
}

export function StatCard({ label, value, delta, icon: Icon, href }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <Icon className="w-5 h-5 text-slate-400" />
        {delta && (
          <div className="flex items-center gap-1 text-xs font-medium">
            {delta.trend === "up" && (
              <span className="text-emerald-600 dark:text-emerald-400">▲</span>
            )}
            {delta.trend === "down" && (
              <span className="text-rose-600 dark:text-rose-400">▼</span>
            )}
            {delta.trend === "neutral" && (
              <span className="text-slate-500 dark:text-slate-400">→</span>
            )}
            <span
              className={
                delta.trend === "up"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : delta.trend === "down"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-500 dark:text-slate-400"
              }
            >
              {delta.value}
            </span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
        {value}
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {label}
        {delta && (
          <span className="text-slate-400 dark:text-slate-500 ml-1">
            ({delta.period})
          </span>
        )}
      </div>
    </>
  );

  const cardClassName = "bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700";

  if (href) {
    return (
      <Link
        href={href}
        className={`${cardClassName} cursor-pointer hover:shadow-md transition-shadow block`}
      >
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}

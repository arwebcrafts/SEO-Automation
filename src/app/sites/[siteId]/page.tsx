"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Globe, BarChart3, FileText, Calendar, Loader2 } from "lucide-react";

export default function SiteDetailPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sites/${siteId}/overview`).then((r) => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [siteId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Globe className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{data?.site?.name || "Site"}</h1>
            <p className="text-sm text-slate-500">{data?.site?.url}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[{ label: "Total Content", value: data?.overview?.totalContent || 0, icon: FileText },
            { label: "Published", value: data?.overview?.published || 0, icon: BarChart3 },
            { label: "Scheduled", value: data?.overview?.scheduled || 0, icon: Calendar }].map((s) => {
            const Icon = s.icon; return (
            <div key={s.label} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Icon className="w-5 h-5 text-blue-600 mb-2" /><p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p><p className="text-xs text-slate-500">{s.label}</p>
            </div>); })}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Content</h2>
          {data?.overview?.recentContent?.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{c.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{c.status}</span>
            </div>
          )) || <p className="text-sm text-slate-500">No content yet.</p>}
        </div>
      </div>
    </div>
  );
}

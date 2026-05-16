"use client";
import React, { useState } from "react";
import { MapPin, Search, BarChart3, Globe, ChevronRight, Loader2 } from "lucide-react";

export default function GeoAuditPage() {
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runAudit = async () => {
    if (!domain || !location) return;
    setLoading(true);
    try {
      const res = await fetch("/api/geo/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain, location }) });
      const data = await res.json();
      setResults(data.audit || data);
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">GEO Audit</h1>
        <p className="text-slate-500 mb-8">Analyze your local SEO performance by location</p>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Domain</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
              </div>
            </div>
          </div>
          <button onClick={runAudit} disabled={loading || !domain || !location} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} {loading ? "Analyzing..." : "Run GEO Audit"}
          </button>
        </div>

        {results && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Results</h2>
                <div className="text-3xl font-bold text-blue-600">{results.score || results.results?.localSeoScore || "N/A"}</div>
              </div>
              {results.results?.recommendations?.map((rec: any, i: number) => (
                <div key={i} className="flex items-start gap-3 py-3 border-t border-slate-100 dark:border-slate-700">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${rec.priority === "HIGH" ? "bg-red-100 text-red-700" : rec.priority === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{rec.priority}</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{rec.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { Search, Loader2, MapPin, Star, Globe } from "lucide-react";

export default function ScanPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const scan = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch("/api/scan/business", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, location }) });
      const data = await res.json();
      setResults(data.results);
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Business Scanner</h1>
        <p className="text-slate-500 mb-8">Scan and analyze businesses in any niche or location</p>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Business type (e.g. dentist, plumber)" className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (e.g. Austin, TX)" className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
          </div>
          <button onClick={scan} disabled={loading || !query} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} {loading ? "Scanning..." : "Scan"}
          </button>
        </div>
        {results && (
          <div className="space-y-3">
            {results.businesses?.map((b: any) => (
              <div key={b.rank} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600">#{b.rank}</div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{b.name}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{b.rating} ({b.reviews})</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.address}</span>
                  </div>
                </div>
                {b.website && <a href={b.website} target="_blank" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><Globe className="w-4 h-4 text-slate-400" /></a>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

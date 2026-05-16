"use client";
import React, { useState } from "react";
import { MapPin, Plus, FileText, Loader2 } from "lucide-react";

export default function LocationPagesPage() {
  const [domain, setDomain] = useState("");
  const [locations, setLocations] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<any[]>([]);

  const generate = async () => {
    if (!domain || !locations) return;
    setLoading(true);
    try {
      const locs = locations.split("\n").map((l) => l.trim()).filter(Boolean);
      const res = await fetch("/api/content/locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain, locations: locs, businessType }) });
      const data = await res.json();
      setPages(data.pages || []);
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Location Pages Generator</h1>
        <p className="text-slate-500 mb-8">Generate optimized location-specific landing pages</p>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-8 space-y-4">
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain (e.g. mybusiness.com)" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
          <input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Business type (e.g. Plumbing, Dental)" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
          <textarea value={locations} onChange={(e) => setLocations(e.target.value)} placeholder="Enter locations (one per line)&#10;New York, NY&#10;Los Angeles, CA&#10;Chicago, IL" rows={5} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
          <button onClick={generate} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {loading ? "Generating..." : "Generate Pages"}
          </button>
        </div>

        {pages.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Generated Pages ({pages.length})</h2>
            {pages.map((p, i) => (
              <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{p.title}</p>
                  <p className="text-sm text-slate-500">{p.location} · /{p.slug}</p>
                </div>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

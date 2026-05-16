"use client";
import React from "react";
import { FileText, Send, BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Reports</h1>
        <p className="text-slate-500 mb-8">Generate and send SEO reports</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{ icon: FileText, title: "Generate Report", desc: "Create a comprehensive SEO report for any domain.", action: "Generate", href: "/api/reports/generate" },
            { icon: Send, title: "Send Report", desc: "Email a report to a client or team member.", action: "Send", href: "#" },
            { icon: BarChart3, title: "Weekly Reports", desc: "Automated weekly SEO performance summaries.", action: "Configure", href: "#" }].map((c) => {
            const Icon = c.icon; return (
            <div key={c.title} className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4"><Icon className="w-6 h-6 text-blue-600" /></div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{c.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{c.desc}</p>
              <button className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">{c.action}</button>
            </div>); })}
        </div>
      </div>
    </div>
  );
}

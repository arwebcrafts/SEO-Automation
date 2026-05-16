"use client";
import React, { useState, useEffect } from "react";
import { Star, Send, Users, TrendingUp, Mail, BarChart3, Loader2 } from "lucide-react";

export default function ReviewsPage() {
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState("dashboard");
  const [contacts, setContacts] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch("/api/reviews/stats").then((r) => r.json()).then((d) => setStats(d.stats)).catch(() => {});
    fetch("/api/reviews/contacts").then((r) => r.json()).then((d) => setContacts(d.contacts || [])).catch(() => {});
  }, []);

  const addContact = async () => {
    if (!newEmail || !newName) return;
    const res = await fetch("/api/reviews/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contacts: [{ email: newEmail, name: newName }] }) });
    if (res.ok) { setNewEmail(""); setNewName(""); const d = await res.json(); setContacts([...(d.contacts || []), ...contacts]); }
  };

  const statCards = [
    { label: "Total Contacts", value: stats?.totalContacts || 0, icon: Users, color: "text-blue-600" },
    { label: "Requests Sent", value: stats?.totalSent || 0, icon: Send, color: "text-indigo-600" },
    { label: "Open Rate", value: `${stats?.openRate || 0}%`, icon: Mail, color: "text-green-600" },
    { label: "Review Rate", value: `${stats?.reviewRate || 0}%`, icon: Star, color: "text-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Review Management</h1>
        <p className="text-slate-500 mb-8">Manage contacts and automate review requests</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => { const Icon = s.icon; return (
            <div key={s.label} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ); })}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            {["dashboard", "contacts", "settings"].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-6 py-3 text-sm font-medium capitalize ${tab === t ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"}`}>{t}</button>
            ))}
          </div>
          <div className="p-6">
            {tab === "contacts" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                  <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                  <button onClick={addContact} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Add</button>
                </div>
                {contacts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <div><p className="font-medium text-sm text-slate-900 dark:text-white">{c.name}</p><p className="text-xs text-slate-500">{c.email}</p></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.unsubscribed ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{c.unsubscribed ? "Unsubscribed" : "Active"}</span>
                  </div>
                ))}
              </div>
            )}
            {tab === "dashboard" && <p className="text-slate-500 text-sm">Review request metrics and recent activity will appear here.</p>}
            {tab === "settings" && <p className="text-slate-500 text-sm">Configure your review request email template and auto-send settings.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

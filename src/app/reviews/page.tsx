"use client";

import { useEffect, useState } from "react";
import SidebarLayout from "@/components/layout/SidebarLayout";

type Site = { id: string; name: string };

export default function ReviewsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState("");
  const [tab, setTab] = useState<"overview" | "contacts" | "settings" | "history">("overview");
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [contacts, setContacts] = useState<
    Array<{ id: string; name: string; email: string | null; _count: { reviewRequests: number } }>
  >([]);
  const [csv, setCsv] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    void fetch("/api/content/sites")
      .then((r) => r.json())
      .then((j) => {
        const list = j.data || [];
        setSites(list.map((s: Site) => ({ id: s.id, name: s.name })));
        if (list[0]) setSiteId(list[0].id);
      });
  }, []);

  useEffect(() => {
    if (!siteId) return;
    void fetch(`/api/reviews/stats?wordpressSiteId=${siteId}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
    void fetch(`/api/reviews/contacts?wordpressSiteId=${siteId}`)
      .then((r) => r.json())
      .then((j) => setContacts(j.data || []))
      .catch(() => setContacts([]));
  }, [siteId, tab]);

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/reviews/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordpressSiteId: siteId, name, email }),
    });
    setName("");
    setEmail("");
    setTab("contacts");
  }

  async function importCsv(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/reviews/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordpressSiteId: siteId, csv }),
    });
    const j = await res.json();
    alert(`Imported ${j.imported}, skipped ${j.skipped}`);
    setCsv("");
  }

  return (
    <SidebarLayout>
      <main className="container mx-auto flex-1 px-4 py-8 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Review reactivation</h1>
        <label className="text-sm block mb-4">
          Site{" "}
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="ml-2 border rounded px-2 py-1"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2 border-b mb-6">
          {(["overview", "contacts", "settings", "history"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-2 capitalize ${tab === t ? "border-b-2 border-primary font-medium" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && stats && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">Sent (month): {String(stats.sentThisMonth)}</div>
            <div className="border rounded-lg p-4">Pending: {String(stats.pending)}</div>
            <div className="border rounded-lg p-4">Contacts: {String(stats.contacts)}</div>
          </div>
        )}

        {tab === "contacts" && (
          <div className="space-y-6">
            <form onSubmit={addContact} className="flex flex-wrap gap-2 items-end">
              <input
                className="border rounded px-2 py-1"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className="border rounded px-2 py-1"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-1 rounded">
                Add &amp; schedule
              </button>
            </form>
            <form onSubmit={importCsv} className="space-y-2">
              <textarea
                className="w-full border rounded p-2 font-mono text-sm h-32"
                placeholder="CSV with columns name,email"
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
              />
              <button type="submit" className="bg-secondary px-4 py-1 rounded">
                Import CSV
              </button>
            </form>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Requests</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.name}</td>
                    <td className="p-2">{c.email}</td>
                    <td className="p-2">{c._count.reviewRequests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "settings" && (
          <p className="text-sm text-muted-foreground">
            Use <code>/api/reviews/settings</code> or extend this tab with a full form (SendGrid key,
            templates). Quick start: set keys via API or Prisma.
          </p>
        )}

        {tab === "history" && (
          <p className="text-sm text-muted-foreground">
            History is available from the database (<code>ReviewRequest</code>). Add a table view
            when needed.
          </p>
        )}
      </main>
    </SidebarLayout>
  );
}

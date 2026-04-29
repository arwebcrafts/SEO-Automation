"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Loader2, ExternalLink, ClipboardList } from "lucide-react";

type Overview = {
  site: { id: string; name: string; siteUrl: string };
  health: {
    seoScore: number | null;
    grade: string | null;
    aeoGeoChecklist: Array<{ id: string; label: string; pass: boolean }>;
  };
  gbp: {
    name: string;
    rating: number | null;
    reviewCount: number | null;
    address: string;
  } | null;
  recentPosts: Array<{ id: string; title: string; status: string; publishedAt: string | null }>;
  keywords: Array<{ id: string; keyword: string; searchVolume: number | null }>;
  reviewsSentThisMonth: number;
  chatbotLeadsThisWeek: number;
  lastAuditAt: string | null;
};

export default function SiteDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;
  const [data, setData] = useState<Overview | null>(null);
  const [geo, setGeo] = useState<{ llmsTxt: string; jsonLd: object } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [ov, g] = await Promise.all([
          fetch(`/api/sites/${siteId}/overview`).then((r) => r.json()),
          fetch(`/api/geo/artifacts?wordpressSiteId=${encodeURIComponent(siteId)}`).then((r) =>
            r.json()
          ),
        ]);
        if (ov.error) {
          router.push("/content-scheduler");
          return;
        }
        setData(ov);
        if (!g.error) setGeo({ llmsTxt: g.llmsTxt, jsonLd: g.jsonLd });
      } finally {
        setLoading(false);
      }
    })();
  }, [siteId, router]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{data.site.name}</h1>
            <a
              href={data.site.siteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1 text-sm"
            >
              {data.site.siteUrl}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex gap-2">
            <Link
              href="/gbp-audit"
              className="px-4 py-2 rounded-lg border hover:bg-muted text-sm"
            >
              GBP audit
            </Link>
            <Link
              href="/content-strategy"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
            >
              Content
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border p-4 bg-card">
            <h2 className="font-semibold mb-2">SEO health</h2>
            <p className="text-4xl font-bold">{data.health.seoScore ?? "—"}</p>
            <p className="text-sm text-muted-foreground">
              Grade {data.health.grade ?? "—"} · Last audit{" "}
              {data.lastAuditAt ? new Date(data.lastAuditAt).toLocaleDateString() : "—"}
            </p>
          </div>
          <div className="rounded-xl border p-4 bg-card md:col-span-2">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> SEO + AEO + GEO checklist
            </h2>
            <ul className="text-sm space-y-1">
              {data.health.aeoGeoChecklist.map((row) => (
                <li key={row.id} className={row.pass ? "text-green-600" : "text-amber-600"}>
                  {row.pass ? "✓" : "○"} {row.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {data.gbp && (
          <div className="rounded-xl border p-4 bg-card">
            <h2 className="font-semibold mb-2">Google Business Profile</h2>
            <p className="font-medium">{data.gbp.name}</p>
            <p className="text-sm text-muted-foreground">{data.gbp.address}</p>
            <p className="text-sm">
              ★ {data.gbp.rating ?? "—"} ({data.gbp.reviewCount ?? 0} reviews)
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border p-4 bg-card">
            <h2 className="font-semibold mb-2">Recent posts</h2>
            <ul className="text-sm space-y-2">
              {data.recentPosts.length === 0 && <li className="text-muted-foreground">None yet</li>}
              {data.recentPosts.map((p) => (
                <li key={p.id}>{p.title}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border p-4 bg-card">
            <h2 className="font-semibold mb-2">Keywords</h2>
            <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
              {data.keywords.length === 0 && (
                <li className="text-muted-foreground">Add keywords in content strategy</li>
              )}
              {data.keywords.map((k) => (
                <li key={k.id}>
                  {k.keyword}
                  {k.searchVolume != null ? ` · vol ${k.searchVolume}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border p-4 bg-card">
            <h2 className="font-semibold mb-2">Reviews &amp; chatbot</h2>
            <p className="text-sm">Review requests sent (this month): {data.reviewsSentThisMonth}</p>
            <p className="text-sm">Chatbot leads (7 days): {data.chatbotLeadsThisWeek}</p>
            <Link href="/reviews" className="text-primary text-sm inline-block mt-2">
              Review reactivation →
            </Link>
          </div>
          {geo && (
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="font-semibold mb-2">GEO artifacts</h2>
              <p className="text-xs text-muted-foreground mb-2">
                Copy suggested llms.txt and JSON-LD for your homepage.
              </p>
              <textarea
                readOnly
                className="w-full h-28 text-xs font-mono border rounded p-2 bg-muted"
                value={geo.llmsTxt}
              />
              <textarea
                readOnly
                className="w-full h-24 text-xs font-mono border rounded p-2 bg-muted mt-2"
                value={JSON.stringify(geo.jsonLd, null, 2)}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

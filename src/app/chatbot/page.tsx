"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Loader2, Copy, Check, Bot, ExternalLink } from "lucide-react";

type Site = { id: string; name: string; siteUrl: string };

export default function ChatbotPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin.replace(/\/$/, "")}`
      : "";

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/content/sites");
        const j = await r.json();
        if (j.success && Array.isArray(j.data)) {
          setSites(j.data);
          if (j.data[0]?.id) setSelectedId(j.data[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const snippet =
    selectedId && base
      ? `<script src="${base}/widget.js" data-site-id="${selectedId}" defer></script>`
      : "";

  const copy = async () => {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 pb-16 pt-8 dark:from-slate-950 dark:to-slate-900 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <Bot className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Site assistant</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Same widget as our hosted snippet—paste once in WordPress or any site footer.
              </p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            Included on the <strong>Complete</strong> plan. If you do not see the assistant live, confirm your
            plan, allowed domains in SeoRise, and that the script loads over <code className="rounded bg-black/10 px-1">https</code>.
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : sites.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-4 text-slate-600 dark:text-slate-400">
                Connect a WordPress site first, then pick it here to tie the assistant to your workspace.
              </p>
              <Link
                href="/"
                className="inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
              >
                Go to command center
              </Link>
            </div>
          ) : (
            <>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Connected site
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="mb-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.siteUrl}
                  </option>
                ))}
              </select>

              <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Embed code</h2>
              <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                In WordPress you can also enable <strong>SEO AutoFix → Settings → SeoRise Chatbot embed</strong> and
                paste the site ID <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{selectedId}</code>{" "}
                — or paste this script before <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">
                  &lt;/body&gt;
                </code>
                .
              </p>
              <div className="relative">
                <pre className="max-h-48 overflow-auto rounded-2xl border border-slate-200 bg-slate-900 p-4 text-xs text-slate-100 dark:border-slate-700">
                  {snippet}
                </pre>
                <button
                  type="button"
                  onClick={() => void copy()}
                  className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
                <Link href="/services" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                  What we offer
                </Link>
                <span className="mx-2">·</span>
                <a
                  href={`${base}/widget.js`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Open widget.js
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

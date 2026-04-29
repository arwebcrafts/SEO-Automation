"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Globe,
  Plug,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { useContentStrategy } from "@/contexts/ContentStrategyContext";

type Limits = {
  maxSites: number;
  maxPostsPerMonth: number;
  reviewsEnabled: boolean;
  chatbotEnabled: boolean;
  platformAiIncluded: boolean;
};

type UserCtx = {
  limits?: Limits;
  plan?: string;
};

const PLAN_LABEL: Record<string, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Growth",
  AGENCY: "Complete",
  WHITE_LABEL: "White-label",
};

function CardShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80 ${className}`}
    >
      {children}
    </div>
  );
}

export function AppCommandCenter() {
  const { activeWebsite, openWebsiteSwitcher } = useContentStrategy();
  const [ctx, setCtx] = useState<UserCtx | null>(null);

  useEffect(() => {
    void fetch("/api/user/context")
      .then((r) => r.json())
      .then((d) => setCtx(d && !d.error ? d : null))
      .catch(() => setCtx(null));
  }, []);

  const limits = ctx?.limits;
  const siteHref = activeWebsite?.id ? `/sites/${activeWebsite.id}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 pb-16 pt-8 dark:from-slate-950 dark:to-slate-900 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
              Command center
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Hi — here is what moves the needle today
            </h1>
            <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-400">
              Connect one site, then use reviews, your site assistant, and scheduled posts so visitors feel a
              real business behind the screen—not an empty dashboard.
            </p>
          </div>
          {activeWebsite && (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                <Globe className="h-4 w-4 text-indigo-500" />
                {activeWebsite.name}
              </span>
            </div>
          )}
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CardShell>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Plug className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">1 · Your website</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Add or switch the WordPress site you control. This unlocks publishing, stats, and the assistant.
            </p>
            <button
              type="button"
              onClick={() => openWebsiteSwitcher()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {activeWebsite ? "Switch site" : "Connect a site"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </CardShell>

          <CardShell>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2 · Posts & calendar</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Plan topics, write drafts, and queue what goes live—without living inside WordPress.
            </p>
            <Link
              href="/content-strategy?view=calendar"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
            >
              Open calendar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardShell>

          <CardShell className={limits && !limits.reviewsEnabled ? "opacity-90" : ""}>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <Star className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3 · Review requests</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Email past customers so new reviews show up where people decide.
            </p>
            {limits && !limits.reviewsEnabled ? (
              <Link
                href="/pricing"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
              >
                Unlock on Growth plan
              </Link>
            ) : (
              <Link
                href="/reviews"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
              >
                Open reviews
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </CardShell>

          <CardShell className={limits && !limits.chatbotEnabled ? "opacity-90" : ""}>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <Bot className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">4 · Site assistant</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              A small chat on your site that answers common questions and saves leads.
            </p>
            {limits && !limits.chatbotEnabled ? (
              <Link
                href="/pricing"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Unlock on Complete plan
              </Link>
            ) : (
              <Link
                href="/chatbot"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
              >
                Set up assistant
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </CardShell>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CardShell>
            <div className="flex items-start gap-3">
              <Search className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Optional website check</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  When you want a technical scorecard, run a check. It does not replace leads or content—it
                  supports them.
                </p>
                <Link
                  href="/scan"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Run a website check
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </CardShell>

          <CardShell>
            <div className="flex items-start gap-3">
              <Globe className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Site overview</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Health, posts, keywords, and GEO snippets in one place after you pick a site above.
                </p>
                {siteHref ? (
                  <Link
                    href={siteHref}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    Open site dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => openWebsiteSwitcher()}
                    className="mt-3 text-left text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    Connect a site first →
                  </button>
                )}
              </div>
            </div>
          </CardShell>
        </div>

        {limits && (
          <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Plan limits: up to {limits.maxSites} site{limits.maxSites === 1 ? "" : "s"}
            {limits.maxPostsPerMonth > 0
              ? ` · up to ${limits.maxPostsPerMonth} AI-assisted posts / month`
              : limits.maxPostsPerMonth < 0
                ? " · generous AI-assisted posts / month"
                : ""}
            {ctx?.plan ? ` · ${PLAN_LABEL[ctx.plan] ?? ctx.plan}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

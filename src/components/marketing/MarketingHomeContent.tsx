"use client";

import Link from "next/link";
import { AuditForm } from "@/components/audit/audit-form";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  Globe2,
  LineChart,
  MapPin,
  MessageCircle,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";

export function MarketingHomeContent() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-violet-600/25 blur-[120px]" />

        <div className="container relative mx-auto max-w-6xl px-4 pb-20 pt-16 lg:pb-28 lg:pt-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
            <LineChart className="h-3.5 w-3.5" />
            Pipeline · not vanity scores
          </div>
          <h1 className="max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
            Turn attention into{" "}
            <span className="bg-gradient-to-r from-indigo-200 via-white to-violet-200 bg-clip-text text-transparent">
              booked calls and revenue
            </span>
            —without a full marketing department.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
            SeoRise connects your WordPress site, your Google Business presence, and simple automation so you
            publish faster, re-engage happy customers for reviews, and capture leads with an on-site assistant.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-indigo-900/40 transition hover:bg-slate-100"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              View plans
            </Link>
          </div>

          <div className="relative mx-auto mt-16 max-w-3xl">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-indigo-500/50 via-violet-500/40 to-fuchsia-500/50 blur-lg" />
            <div className="relative rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl md:p-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-300">Free website check — no card</p>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Live preview
                </span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 md:p-6">
                <AuditForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-white/10 bg-slate-900/50 py-10">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-3 text-slate-300">
            <Shield className="h-8 w-8 shrink-0 text-indigo-400" />
            <div>
              <p className="text-sm font-semibold text-white">Built for WordPress first</p>
              <p className="text-xs text-slate-400">Plugin + cloud app — you stay in control of your domain.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Users className="h-8 w-8 shrink-0 text-violet-400" />
            <div>
              <p className="text-sm font-semibold text-white">Owners & agencies</p>
              <p className="text-xs text-slate-400">One calm workspace instead of ten disconnected tabs.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Sparkles className="h-8 w-8 shrink-0 text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-white">Upgrade when you earn it</p>
              <p className="text-xs text-slate-400">Start small; unlock reviews and assistant on higher tiers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento */}
      <section className="bg-white py-20 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-4 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
            Everything we ship points at one thing: more qualified conversations.
          </h2>
          <p className="mb-14 max-w-2xl text-slate-600 dark:text-slate-400">
            Search, maps, AI-generated answers, and your own website should tell the same story. We give you the
            levers—without drowning you in jargon.
          </p>

          <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 md:row-span-2 dark:border-slate-800 dark:bg-slate-900/60">
              <Globe2 className="mb-6 h-10 w-10 text-indigo-600 dark:text-indigo-400" />
              <h3 className="mb-3 text-xl font-bold">Visibility where decisions happen</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Technical checks when you need them—plus publishing workflows so the pages that sell your
                services actually earn traffic.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                {["Website check & fix list", "WordPress-friendly publishing", "History you can trust"].map(
                  (t) => (
                    <li key={t} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {t}
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/40">
              <MessageCircle className="mb-4 h-9 w-9 text-violet-600 dark:text-violet-400" />
              <h3 className="mb-2 text-lg font-bold">Answer-ready content</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Clear headings, FAQs, and structured facts so people—and AI summaries—can quote you accurately.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/40">
              <MapPin className="mb-4 h-9 w-9 text-rose-600 dark:text-rose-400" />
              <h3 className="mb-2 text-lg font-bold">Maps & local signals</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Keep your profile and site aligned so trust compounds instead of conflicting NAP or hours.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white md:col-span-2">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <Star className="mb-4 h-9 w-9 text-amber-200" />
                  <h3 className="mb-2 text-xl font-bold">Reviews + on-site assistant</h3>
                  <p className="max-w-xl text-sm text-indigo-100">
                    Reactivate happy customers with email campaigns, then let a small chat widget capture leads
                    24/7—on Complete and white-label plans.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Compare plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-white/10 bg-slate-950 py-20 text-white">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">Three steps. No MBA required.</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "See friction",
                body: "Run a check or connect WordPress. You get a prioritized list—not a wall of charts.",
                icon: BarChart3,
              },
              {
                step: "02",
                title: "Publish on-brand",
                body: "Plan topics, draft posts, and schedule what ships—without living inside wp-admin.",
                icon: Calendar,
              },
              {
                step: "03",
                title: "Capture demand",
                body: "Reviews, assistant, and consistent profiles so visitors feel a real team behind the brand.",
                icon: Rocket,
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8"
              >
                <span className="mb-4 block text-4xl font-black text-white/10">{s.step}</span>
                <s.icon className="mb-4 h-8 w-8 text-indigo-300" />
                <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WordPress strip */}
      <section className="border-t border-white/10 bg-slate-900 py-16">
        <div className="container mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 text-center lg:flex-row lg:text-left">
          <div className="flex-1">
            <h2 className="mb-4 text-3xl font-bold text-white">WordPress today. Open web tomorrow.</h2>
            <p className="text-slate-300">
              Our companion plugin powers remote fixes and scheduled publishing. The same assistant and review
              flows can travel with you as we add more platforms.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-200">
              {["Connect in minutes", "Agency-ready workspaces", "Optional white-label with your own AI keys"].map(
                (t) => (
                  <li key={t} className="flex items-center justify-center gap-2 lg:justify-start">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {t}
                  </li>
                )
              )}
            </ul>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-md">
            {[
              { icon: Zap, label: "One-click fixes" },
              { icon: Bot, label: "Lead assistant" },
              { icon: Star, label: "Review flows" },
              { icon: LineChart, label: "Clear reporting" },
            ].map((x) => (
              <div
                key={x.label}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
              >
                <x.icon className="h-6 w-6 text-indigo-300" />
                <span className="text-sm font-medium text-white">{x.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-900 py-20 text-center">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Ready when you are.</h2>
          <p className="mb-8 text-indigo-100">
            Create an account, connect your site, and upgrade only when you need reviews, the assistant, or more
            publishing power.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-50"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  BarChart3,
  Bot,
  Calendar,
  MapPin,
  PenLine,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";

export const metadata: Metadata = {
  title: "What we offer",
  description:
    "Website intelligence, AI-assisted content and scheduling, WordPress publishing, Google Business Profile insights, review reactivation, and an embeddable lead assistant.",
};

const live = [
  {
    icon: BarChart3,
    title: "Website intelligence",
    desc: "Full audits with clear priorities so you fix what actually moves traffic and conversions.",
    href: "/scan",
  },
  {
    icon: PenLine,
    title: "Content planning & drafts",
    desc: "Keyword-led plans, outlines, and long-form drafts tuned for local and answer-style queries.",
    href: "/content-strategy",
  },
  {
    icon: Calendar,
    title: "Scheduling & publishing",
    desc: "Calendar views and WordPress publishing so your pipeline does not live in spreadsheets.",
    href: "/content-strategy?view=calendar",
  },
  {
    icon: MapPin,
    title: "Business profile insights",
    desc: "Profile health signals and recommendations aligned with how people pick businesses near them.",
    href: "/gbp-audit",
  },
  {
    icon: Star,
    title: "Review reactivation",
    desc: "Email-first outreach to past customers with limits and unsubscribe built in (Growth+).",
    href: "/reviews",
  },
  {
    icon: Bot,
    title: "Site assistant & leads",
    desc: "Embeddable assistant for your domain—capture interest while you sleep (Complete plan).",
    href: "/chatbot",
  },
  {
    icon: Wrench,
    title: "WordPress companion plugin",
    desc: "One-click fixes, handshake connection, and safe publishing from the dashboard.",
    href: "/contact",
  },
];

const soon = [
  "SMS follow-ups for review campaigns (carrier registration in progress)",
  "Deeper non-WordPress CMS connectors (Shopify, Webflow, headless)",
  "Automated rank tracking and weekly client PDFs (advanced tiers)",
  "Custom domains for white-label partner dashboards",
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <MarketingNav />
      <main className="container mx-auto max-w-5xl px-4 py-16 lg:py-24">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-400">Services</p>
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
          Everything in one growth workspace
        </h1>
        <p className="mb-12 max-w-2xl text-lg text-slate-400">
          Pick what you need today. Each module is designed to connect—your audit informs content, your content
          supports maps and AI answers, and your assistant turns attention into leads.
        </p>

        <h2 className="mb-6 text-xl font-bold text-white">Available now</h2>
        <div className="mb-16 grid gap-6 sm:grid-cols-2">
          {live.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-indigo-500/40 hover:bg-white/[0.06]"
            >
              <item.icon className="mb-3 h-9 w-9 text-indigo-400" />
              <h3 className="mb-2 font-bold text-white group-hover:text-indigo-200">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-400">{item.desc}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-indigo-400">
                Open in app →
              </span>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-8">
          <div className="mb-4 flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold">Coming soon</h2>
          </div>
          <ul className="space-y-3 text-sm text-slate-400">
            {soon.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="text-indigo-500">○</span>
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-slate-500">
            Have a must-have? Tell us on the{" "}
            <Link href="/contact" className="font-semibold text-indigo-400 underline">
              contact page
            </Link>
            .
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

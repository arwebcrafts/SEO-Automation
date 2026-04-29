import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Heart, Target, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "SeoRise helps local businesses and agencies grow pipeline with visibility across Google, AI answers, and maps—plus content, reviews, and lead capture.",
  openGraph: {
    title: "About SeoRise",
    description:
      "We combine search visibility, answer-ready content, and consistent brand signals so more qualified leads find you and convert.",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <MarketingNav />
      <main className="container mx-auto max-w-3xl px-4 py-16 lg:py-24">
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white">
          We care about outcomes—not buzzwords
        </h1>
        <p className="mb-8 text-lg leading-relaxed text-slate-400">
          Most tools stop at a score or a checklist. SeoRise is built for owners who need{" "}
          <strong className="text-white">more calls, more form fills, and more booked jobs</strong>
          . That means helping you show up when people search, when they ask an AI for a recommendation, and when
          they compare you on the map—then giving you simple ways to publish content, refresh reviews, and capture
          leads on your own site.
        </p>
        <div className="mb-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <Target className="mb-3 h-8 w-8 text-indigo-400" />
            <h2 className="mb-2 font-bold text-white">Clarity</h2>
            <p className="text-sm text-slate-400">
              One prioritized roadmap instead of fifty random tasks.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <Users className="mb-3 h-8 w-8 text-violet-400" />
            <h2 className="mb-2 font-bold text-white">Agencies</h2>
            <p className="text-sm text-slate-400">
              Workspaces built for teams managing many clients and sites.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <Heart className="mb-3 h-8 w-8 text-rose-400" />
            <h2 className="mb-2 font-bold text-white">Honesty</h2>
            <p className="text-sm text-slate-400">
              No fake guarantees—just workflows that compound week over week.
            </p>
          </div>
        </div>
        <Link
          href="/sign-up"
          className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
        >
          Join SeoRise
        </Link>
      </main>
      <MarketingFooter />
    </div>
  );
}

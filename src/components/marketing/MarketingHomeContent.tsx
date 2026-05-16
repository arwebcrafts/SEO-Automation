"use client";
import React from "react";
import Link from "next/link";
import { BarChart3, Globe, Zap, Shield, Target, Star } from "lucide-react";

const features = [
  { icon: BarChart3, title: "SEO Audits", desc: "Comprehensive website analysis with 100+ checks." },
  { icon: Globe, title: "Local SEO", desc: "GBP optimization, location pages, and geo audits." },
  { icon: Zap, title: "AI Content", desc: "Generate SEO-optimized content automatically." },
  { icon: Shield, title: "Rank Tracking", desc: "Monitor keyword rankings across search engines." },
  { icon: Target, title: "Review Management", desc: "Automate review requests and track reputation." },
  { icon: Star, title: "Agency Tools", desc: "White-label reports, client management, and team collaboration." },
];

export default function MarketingHomeContent() {
  return (
    <div>
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6">
            🚀 All-in-one SEO Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
            Dominate Search<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Rankings</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            Audit your website, generate AI content, track rankings, manage reviews, and grow your online presence — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
              Start Free Trial
            </Link>
            <Link href="/pricing" className="px-8 py-4 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-4">Everything You Need</h2>
          <p className="text-center text-slate-500 mb-12 max-w-xl mx-auto">Powerful SEO tools built for agencies and businesses that want to grow.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800 transition-all hover:shadow-lg group">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Boost Your SEO?</h2>
          <p className="text-lg text-blue-100 mb-8">Join thousands of businesses using SEO Hub to grow their online presence.</p>
          <Link href="/sign-up" className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 shadow-lg transition-all">
            Get Started for Free
          </Link>
        </div>
      </section>
    </div>
  );
}

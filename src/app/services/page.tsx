import React from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { BarChart3, Globe, Zap, FileText, Star, Shield } from "lucide-react";

export const metadata = { title: "Services - SEO Hub", description: "Explore our comprehensive SEO services for businesses and agencies." };

const services = [
  { icon: BarChart3, title: "SEO Auditing", desc: "Comprehensive website analysis with 100+ technical and on-page checks.", features: ["Performance analysis", "Technical SEO", "Content quality scoring", "Mobile optimization"] },
  { icon: Globe, title: "Local SEO", desc: "Dominate local search results with GBP optimization and location pages.", features: ["GBP optimization", "Location page generation", "Local citation building", "GEO audit"] },
  { icon: Zap, title: "AI Content Generation", desc: "Create SEO-optimized content automatically with AI assistance.", features: ["Blog post generation", "Meta tag optimization", "Content calendar", "Annual planning"] },
  { icon: Shield, title: "Rank Tracking", desc: "Monitor your keyword positions across all search engines.", features: ["Daily tracking", "Competitor analysis", "SERP feature tracking", "Position history"] },
  { icon: Star, title: "Review Management", desc: "Build and manage your online reputation with automated review requests.", features: ["Automated requests", "Multi-platform", "Analytics dashboard", "Response templates"] },
  { icon: FileText, title: "Agency Tools", desc: "Everything agencies need to scale their SEO services.", features: ["Client management", "White-label reports", "Team collaboration", "Custom branding"] },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <MarketingNav />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Our Services</h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Everything you need to dominate search rankings and grow your online presence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s) => { const Icon = s.icon; return (
              <div key={s.title} className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4"><Icon className="w-6 h-6 text-blue-600" /></div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 mb-4">{s.desc}</p>
                <ul className="space-y-1">{s.features.map((f) => (<li key={f} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />{f}</li>))}</ul>
              </div>); })}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

import React from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { Users, Target, Award, Globe } from "lucide-react";

export const metadata = { title: "About - SEO Hub", description: "Learn about SEO Hub, our mission, and our team." };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <MarketingNav />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">About SEO Hub</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-12">We're building the most comprehensive SEO platform for agencies and businesses.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {[{ icon: Target, title: "Our Mission", desc: "Democratize SEO by making enterprise-grade tools accessible to every business." },
              { icon: Users, title: "Our Team", desc: "A passionate team of SEO experts and engineers building the future of search optimization." },
              { icon: Award, title: "Our Values", desc: "Transparency, innovation, and customer success drive everything we do." },
              { icon: Globe, title: "Our Reach", desc: "Trusted by thousands of businesses in over 50 countries worldwide." }].map((item) => {
              const Icon = item.icon; return (
              <div key={item.title} className="p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <Icon className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-slate-500">{item.desc}</p>
              </div>); })}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

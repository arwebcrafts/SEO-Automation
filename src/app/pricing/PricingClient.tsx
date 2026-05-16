"use client";
import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

const plans = [
  { id: "FREE", name: "Free", monthly: 0, yearly: 0, features: ["5 audits/month", "10 content pieces", "1 site", "Basic SEO tools", "Community support"] },
  { id: "PRO", name: "Pro", monthly: 29, yearly: 290, features: ["50 audits/month", "100 content pieces", "5 sites", "Rank tracking", "Review management", "GEO audit", "AI content", "Email support"], popular: true },
  { id: "AGENCY", name: "Agency", monthly: 99, yearly: 990, features: ["500 audits/month", "1000 content pieces", "50 sites", "50 client seats", "Team members", "White-label reports", "Drip campaigns", "Priority support"] },
  { id: "WHITE_LABEL", name: "White Label", monthly: 249, yearly: 2490, features: ["Unlimited everything", "Custom domain", "Full white-label", "API access", "Custom branding", "Dedicated account manager", "SLA guarantee"] },
];

export default function PricingClient() {
  const [annual, setAnnual] = useState(false);

  return (
    <main className="pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-500 mb-8">Choose the plan that fits your needs. Upgrade anytime.</p>
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1">
            <button onClick={() => setAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${!annual ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white" : "text-slate-500"}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${annual ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white" : "text-slate-500"}`}>Annual <span className="text-green-600 text-xs ml-1">Save 17%</span></button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative p-6 rounded-2xl flex flex-col ${plan.popular ? "bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-slate-800 border-2 border-blue-500 shadow-lg" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full">Most Popular</div>}
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{plan.name}</h3>
              <div className="mt-2 mb-6"><span className="text-4xl font-bold text-slate-900 dark:text-white">${annual ? plan.yearly : plan.monthly}</span><span className="text-slate-500">/{annual ? "year" : "mo"}</span></div>
              <ul className="space-y-2 flex-1 mb-6">{plan.features.map((f) => (<li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{f}</li>))}</ul>
              <Link href="/sign-up" className={`w-full py-3 rounded-lg text-center font-medium text-sm block ${plan.popular ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800"}`}>
                {plan.id === "FREE" ? "Get Started" : `Start with ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

"use client";
import React, { useState } from "react";
import { CreditCard, CheckCircle, Sparkles, ArrowRight, Loader2 } from "lucide-react";

const plans = [
  { id: "FREE", name: "Free", price: 0, features: ["5 audits/month", "10 content pieces", "1 site", "Basic SEO tools"], cta: "Current Plan" },
  { id: "PRO", name: "Pro", price: 29, features: ["50 audits/month", "100 content pieces", "5 sites", "Rank tracking", "Review management", "GEO audit", "Email support"], cta: "Upgrade to Pro", popular: true },
  { id: "AGENCY", name: "Agency", price: 99, features: ["500 audits/month", "1000 content pieces", "50 sites", "50 clients", "Team members", "White-label (basic)", "Priority support"], cta: "Upgrade to Agency" },
  { id: "WHITE_LABEL", name: "White Label", price: 249, features: ["Unlimited everything", "Custom domain", "Full white-label", "API access", "Dedicated support"], cta: "Contact Sales" },
];

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan] = useState("FREE");

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planId }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { } finally { setLoading(null); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Billing & Plans</h1>
        <p className="text-slate-500 mb-8">Choose the plan that fits your needs</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 ${plan.popular ? "border-blue-500 shadow-lg shadow-blue-500/10" : "border-slate-200 dark:border-slate-700"} flex flex-col`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-full">Most Popular</div>}
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{plan.name}</h3>
              <div className="mt-2 mb-4"><span className="text-4xl font-bold text-slate-900 dark:text-white">${plan.price}</span><span className="text-slate-500">/mo</span></div>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <button onClick={() => plan.id !== currentPlan && plan.id !== "FREE" && handleUpgrade(plan.id)} disabled={plan.id === currentPlan || loading === plan.id} className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 ${plan.id === currentPlan ? "bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-default" : plan.popular ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800"}`}>
                {loading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : plan.id === currentPlan ? "Current Plan" : <>{plan.cta} <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

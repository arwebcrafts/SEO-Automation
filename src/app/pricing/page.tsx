"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Check, Sparkles } from "lucide-react";

function TierCard({
  title,
  price,
  tier,
  highlight,
  isSignedIn,
  features,
  footnote,
}: {
  title: string;
  price: string;
  tier: string;
  highlight?: boolean;
  isSignedIn: boolean;
  features: string[];
  footnote?: string;
}) {
  async function checkout() {
    if (!isSignedIn) {
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent("/pricing")}`;
      return;
    }
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error || "Checkout is not configured yet. Add Stripe price IDs to your environment.");
  }

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-6 ${
        highlight
          ? "border-indigo-500/50 bg-gradient-to-b from-indigo-950/80 to-slate-900/90 shadow-xl shadow-indigo-900/20"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-white">{price}</p>
        {footnote && <p className="mt-2 text-xs text-slate-500">{footnote}</p>}
      </div>
      <ul className="flex flex-1 flex-col gap-2.5 text-sm text-slate-300">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => void checkout()}
        className={`mt-auto w-full rounded-xl py-3 text-sm font-semibold transition ${
          highlight
            ? "bg-indigo-500 text-white hover:bg-indigo-400"
            : "bg-white text-slate-900 hover:bg-slate-100"
        }`}
      >
        {isSignedIn ? "Subscribe" : "Create account & subscribe"}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const { isSignedIn } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <MarketingNav />
      <main className="container mx-auto max-w-6xl px-4 py-16 lg:py-24">
        <div className="mb-14 text-center">
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-indigo-400">
            <Sparkles className="h-4 w-4" />
            Pricing
          </p>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Pay for outcomes, not noise
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Each tier adds real leverage: more sites, review outreach, the on-site assistant, and higher
            limits for AI-assisted publishing. Upgrade when your pipeline needs it.
          </p>
        </div>

        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-slate-500">
          Retail plans
        </h2>
        <div className="mb-16 grid gap-8 lg:grid-cols-3">
          <TierCard
            title="Starter"
            price="$19/mo"
            tier="STARTER"
            isSignedIn={!!isSignedIn}
            footnote="One WordPress site. Best when you are proving the workflow."
            features={[
              "1 connected site",
              "Command center + content studio",
              "Up to 5 AI-assisted posts / month (platform AI)",
              "Website checks & history",
              "No review email campaigns",
              "No site assistant (chatbot)",
            ]}
          />
          <TierCard
            title="Growth"
            price="$49/mo"
            tier="PRO"
            highlight
            isSignedIn={!!isSignedIn}
            footnote="Up to 3 sites. For teams that want reviews + more publishing."
            features={[
              "Up to 3 connected sites",
              "Everything in Starter",
              "Review reactivation (email campaigns)",
              "Up to 15 AI-assisted posts / month",
              "Higher platform AI allowance",
              "Site assistant not included — upgrade to Complete",
            ]}
          />
          <TierCard
            title="Complete"
            price="$99/mo"
            tier="AGENCY"
            isSignedIn={!!isSignedIn}
            footnote="Up to 15 sites. Full stack for serious pipeline."
            features={[
              "Up to 15 connected sites",
              "Review reactivation",
              "Site assistant + lead capture (widget + WordPress embed)",
              "Up to 30 AI-assisted posts / month",
              "Highest platform AI pool on retail plans",
              "Best for agencies and multi-location brands",
            ]}
          />
        </div>

        <h2 className="mb-2 text-lg font-bold text-white">White-label partners (BYOK)</h2>
        <p className="mb-6 text-sm text-slate-400">
          Unchanged for now—you bring API keys; we host the platform at a low fee.
        </p>
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <TierCard
            title="WL · 3 sites"
            price="$29/mo"
            tier="WL_3"
            isSignedIn={!!isSignedIn}
            features={["3 sites", "BYOK OpenAI", "Reviews + assistant included", "Chatbot + domains"]}
          />
          <TierCard
            title="WL · 10 sites"
            price="$99/mo"
            tier="WL_10"
            highlight
            isSignedIn={!!isSignedIn}
            features={["10 sites", "BYOK", "Same feature set as WL · 3 at scale"]}
          />
          <TierCard
            title="WL · 50 sites"
            price="$199/mo"
            tier="WL_50"
            isSignedIn={!!isSignedIn}
            features={["50 sites", "BYOK", "Built for larger reseller desks"]}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h3 className="mb-4 font-bold text-white">Billing notes</h3>
          <ul className="grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
            {[
              "Stripe Checkout for cards; manage invoices in the customer portal",
              "Upgrade or downgrade anytime",
              "Connect checkout: set STRIPE_PRICE_* and STRIPE_SECRET_KEY in your environment",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {t}
              </li>
            ))}
          </ul>
          <Link href="/contact" className="mt-6 inline-block text-sm font-semibold text-indigo-600 hover:underline">
            Questions before you buy? Contact us
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

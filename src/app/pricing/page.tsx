import React from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import PricingClient from "./PricingClient";

export const metadata = { title: "Pricing - SEO Hub", description: "Simple, transparent pricing for businesses and agencies of all sizes." };

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <MarketingNav />
      <PricingClient />
      <MarketingFooter />
    </div>
  );
}

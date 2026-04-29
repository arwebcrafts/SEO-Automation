import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pricing — SeoRise",
  description:
    "Starter, Growth, and Complete plans with clear site and feature limits—plus white-label BYOK options for partners.",
  openGraph: {
    title: "SeoRise pricing",
    description: "Pick Starter, Growth, or Complete. Upgrade when you need reviews, the site assistant, and more sites.",
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}

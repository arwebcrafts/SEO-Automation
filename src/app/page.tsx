import type { Metadata } from "next";
import { HomeClient } from "./HomeClient";

export const metadata: Metadata = {
  title: "SeoRise — More visibility, more leads",
  description:
    "Grow pipeline with website intelligence, AI-assisted content, WordPress publishing, maps and profile alignment, review reactivation, and an on-site lead assistant. Built for local businesses and agencies.",
  keywords: [
    "local business marketing",
    "lead generation software",
    "website visibility",
    "Google Business Profile",
    "content scheduling",
    "WordPress marketing automation",
    "review requests email",
    "AI search visibility",
    "agency client dashboard",
  ],
  openGraph: {
    title: "SeoRise — More visibility, more leads",
    description:
      "Show up in search and AI answers, publish faster, and capture leads—without a full marketing department.",
    type: "website",
  },
};

export default function HomePage() {
  return <HomeClient />;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the SeoRise team for demos, partnerships, or product questions.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

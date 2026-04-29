import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL &&
  /^https?:\/\//i.test(process.env.NEXT_PUBLIC_APP_URL)
    ? process.env.NEXT_PUBLIC_APP_URL
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SeoRise — More visibility, more leads",
    template: "%s | SeoRise",
  },
  description:
    "Grow pipeline with website intelligence, AI-assisted content, WordPress publishing, maps alignment, review reactivation, and on-site lead capture—for local businesses and agencies.",
  keywords: [
    "lead generation",
    "local business growth",
    "website visibility",
    "content scheduling",
    "WordPress automation",
    "Google Business Profile",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

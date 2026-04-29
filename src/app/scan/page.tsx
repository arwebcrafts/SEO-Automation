"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AuditForm } from "@/components/audit/audit-form";
import { ArrowLeft } from "lucide-react";

export default function ScanPage() {
  const { isSignedIn } = useAuth();

  const inner = (
    <div className={isSignedIn ? "min-h-screen bg-slate-50 dark:bg-slate-900" : "min-h-screen bg-slate-950"}>
      {!isSignedIn && <MarketingNav />}
      <main className="container mx-auto max-w-3xl px-4 py-10 lg:py-16">
        {isSignedIn && (
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to command center
          </Link>
        )}
        <h1
          className={`mb-2 text-2xl font-bold md:text-3xl ${
            isSignedIn ? "text-slate-900 dark:text-white" : "text-white"
          }`}
        >
          Website check
        </h1>
        <p className={`mb-8 ${isSignedIn ? "text-slate-600 dark:text-slate-400" : "text-slate-400"}`}>
          Enter a URL to see a scorecard of technical and content signals. Use it when you want clarity—not as a
          substitute for publishing and lead capture.
        </p>
        <div
          className={`rounded-2xl border p-6 shadow-sm ${
            isSignedIn
              ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              : "border-white/10 bg-white/[0.03]"
          }`}
        >
          <AuditForm />
        </div>
      </main>
      {!isSignedIn && <MarketingFooter />}
    </div>
  );

  if (isSignedIn) {
    return <SidebarLayout>{inner}</SidebarLayout>;
  }
  return inner;
}

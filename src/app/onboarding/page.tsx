"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  User,
  Building2,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

type AccountType = "INDIVIDUAL" | "AGENCY";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [agencyName, setAgencyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFinish = async () => {
    if (!selectedType) {
      setError("Pick one option above.");
      return;
    }
    if (selectedType === "AGENCY" && agencyName.trim().length < 2) {
      setError("Type your company or agency name (at least 2 letters).");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: selectedType,
          agencyName: selectedType === "AGENCY" ? agencyName.trim() : undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong. Try again.");
      }
      if (selectedType === "AGENCY") {
        router.push("/agency");
      } else {
        router.push("/content-strategy");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className={step >= 1 ? "text-indigo-600" : ""}>1. Learn</span>
            <span>→</span>
            <span className={step >= 2 ? "text-indigo-600" : ""}>2. Your setup</span>
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            Home
          </Link>
        </div>

        {step === 1 && (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
                <Sparkles className="h-7 w-7" />
              </div>
              <h1 className="mb-3 text-3xl font-bold text-slate-900 dark:text-white">
                Hi {user?.firstName || "there"}—welcome to SeoRise
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                We help you get <strong>more people finding you</strong> (on Google and in AI answers) and{" "}
                <strong>more of them asking for a quote or a call</strong>. No jargon required.
              </p>
            </div>

            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">You will be able to:</h2>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  See what is slowing your website down—and fix many issues in one click on WordPress.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  Plan and publish posts so your site always has something fresh to show visitors and search.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  (Optional, on paid plans) Ask happy customers for reviews and add a small chat box that collects leads.
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mb-6 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Who is this account for?</h1>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Choose one. You can change details later in settings.
            </p>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSelectedType("INDIVIDUAL")}
                className={`rounded-2xl border-2 p-6 text-left transition-all ${
                  selectedType === "INDIVIDUAL"
                    ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                }`}
              >
                <User className="mb-3 h-8 w-8 text-indigo-600" />
                <h3 className="mb-1 font-bold text-slate-900 dark:text-white">Just me or one business</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  I manage my own site (or one company I work for).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("AGENCY")}
                className={`rounded-2xl border-2 p-6 text-left transition-all ${
                  selectedType === "AGENCY"
                    ? "border-violet-600 bg-violet-50/80 dark:bg-violet-950/40"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                }`}
              >
                <Building2 className="mb-3 h-8 w-8 text-violet-600" />
                <h3 className="mb-1 font-bold text-slate-900 dark:text-white">A team or agency</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  We work with several clients or brands.
                </p>
              </button>
            </div>

            {selectedType === "AGENCY" && (
              <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  What should we call your team?
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Example: Northside Digital"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              <strong>Next after this screen:</strong> you will go straight to your workspace. Add your website when
              you are ready. Paid plans unlock more sites and automation—see{" "}
              <Link href="/pricing" className="font-semibold underline">
                Pricing
              </Link>
              .
            </div>

            <button
              type="button"
              onClick={() => void handleFinish()}
              disabled={!selectedType || isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 py-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Go to my workspace
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

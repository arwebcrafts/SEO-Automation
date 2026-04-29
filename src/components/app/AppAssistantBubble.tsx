"use client";

import Link from "next/link";
import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

const steps = [
  { title: "Connect your site", href: "/", hint: "Command center → Connect a site" },
  { title: "Plan posts", href: "/content-strategy?view=calendar", hint: "Content studio → calendar" },
  { title: "Turn on reviews (Growth+)", href: "/reviews", hint: "Email past customers" },
  { title: "Add the assistant (Complete)", href: "/chatbot", hint: "One script in your footer" },
];

export function AppAssistantBubble() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2 lg:bottom-6 lg:right-6">
      {open && (
        <div className="pointer-events-auto w-[min(100vw-2rem,22rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Simple checklist</p>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            {steps.map((s, i) => (
              <li key={s.title}>
                <Link
                  href={s.href}
                  className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  onClick={() => setOpen(false)}
                >
                  {i + 1}. {s.title}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">{s.hint}</p>
              </li>
            ))}
          </ol>
          <Link
            href="/scan"
            className="mt-4 block text-center text-xs font-medium text-slate-500 underline hover:text-slate-700 dark:hover:text-slate-300"
            onClick={() => setOpen(false)}
          >
            Optional: run a website check
          </Link>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 dark:border-slate-600 dark:bg-indigo-600 dark:hover:bg-indigo-500"
      >
        <HelpCircle className="h-4 w-4" />
        What should I do?
      </button>
    </div>
  );
}

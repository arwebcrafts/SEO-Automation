"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/services", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-900/50">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="hidden text-lg tracking-tight sm:inline">SeoRise</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-slate-300 hover:text-white sm:inline"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-md hover:bg-slate-100"
            >
              Start free
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/"
              className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Open app
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-300 md:hidden"
            aria-label="Menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <SignedOut>
              <Link href="/sign-in" className="rounded-xl px-3 py-2 text-sm text-slate-400" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
}

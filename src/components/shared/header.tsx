"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  Search,
  Zap,
  FileText,
  Calendar,
  Edit3,
  MapPin,
  Menu,
  CreditCard,
  Building2,
  Sparkles,
  Globe,
} from "lucide-react";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/about", label: "Why SeoRise", icon: Sparkles },
    { href: "/services", label: "Services", icon: Globe },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
    { href: "/agency", label: "Agency", icon: Building2 },
    { href: "/reviews", label: "Reviews", icon: FileText },
    { href: "/history", label: "History", icon: FileText },
    { href: "/content-strategy", label: "Content Strategy", icon: Zap },
    { href: "/auto-content", label: "Auto-Content", icon: Zap, highlight: true },
    { href: "/drafts", label: "Drafts", icon: Edit3 },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/editor", label: "Editor", icon: Edit3 },
    { href: "/gbp-audit", label: "GBP Audit", icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-900 dark:text-white leading-tight">SEO</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">Audit Tool</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <SignedIn>
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  item.highlight
                    ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 hover:from-blue-500/20 hover:to-indigo-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SignedIn>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/sign-up"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 text-sm font-medium"
            >
              Sign Up Free
            </Link>
          </SignedOut>
          <SignedIn>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <UserButton 
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 ring-2 ring-slate-200 dark:ring-slate-700"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>

      {/* Mobile Navigation */}
      <SignedIn>
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2">
            <nav className="container mx-auto px-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    item.highlight
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </SignedIn>
    </header>
  );
}

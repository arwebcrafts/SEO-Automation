"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Globe, Menu, X } from "lucide-react";

export default function MarketingNav() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Globe className="w-7 h-7 text-blue-600" />
          <span className="font-bold text-xl text-slate-900 dark:text-white">SEO Hub</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">{l.label}</Link>
          ))}
          <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-blue-600">Sign In</Link>
          <Link href="/sign-up" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md">Get Started</Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2 text-slate-600 dark:text-slate-300 hover:text-blue-600">{l.label}</Link>
          ))}
          <Link href="/sign-in" className="block py-2 text-slate-600">Sign In</Link>
          <Link href="/sign-up" className="block py-2 px-4 bg-blue-600 text-white rounded-lg text-center font-medium">Get Started</Link>
        </div>
      )}
    </nav>
  );
}

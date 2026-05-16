import React from "react";
import Link from "next/link";
import { Globe } from "lucide-react";

export default function MarketingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <div className="flex items-center gap-2 mb-4"><Globe className="w-6 h-6 text-blue-500" /><span className="font-bold text-lg text-white">SEO Hub</span></div>
          <p className="text-sm">All-in-one SEO platform for agencies and businesses. Audit, optimize, and grow.</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Product</h4>
          <div className="space-y-2 text-sm">
            <Link href="/pricing" className="block hover:text-white transition-colors">Pricing</Link>
            <Link href="/services" className="block hover:text-white transition-colors">Services</Link>
            <Link href="/plugin" className="block hover:text-white transition-colors">WordPress Plugin</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Company</h4>
          <div className="space-y-2 text-sm">
            <Link href="/about" className="block hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="block hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Legal</h4>
          <div className="space-y-2 text-sm">
            <Link href="/privacy" className="block hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="block hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} SEO Hub. All rights reserved.</p>
      </div>
    </footer>
  );
}

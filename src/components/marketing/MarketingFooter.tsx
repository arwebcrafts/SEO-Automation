import Link from "next/link";
import { Sparkles } from "lucide-react";

export function MarketingFooter() {
  const y = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-slate-950 text-slate-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2.5 font-semibold text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              SeoRise
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              One workspace for visibility, publishing, reviews, and on-site lead capture—built for owners who
              need pipeline, not another scorecard toy.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Product</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/services" className="hover:text-white">
                  What we offer
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/scan" className="hover:text-white">
                  Free website check
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Privacy & terms — coming soon</li>
              <li className="text-xs leading-relaxed">Prefer email? Use the contact form.</li>
            </ul>
          </div>
        </div>
        <p className="mt-14 border-t border-white/10 pt-8 text-center text-xs text-slate-600">
          © {y} SeoRise. Built for measurable growth.
        </p>
      </div>
    </footer>
  );
}

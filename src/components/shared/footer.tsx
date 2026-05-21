import Link from "next/link";
import { Globe, Zap, FileText, Calendar, Edit3, MapPin, Mail, Shield, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Product",
      icon: Globe,
      links: [
        { href: "/", label: "SEO Audit" },
        { href: "/content-strategy", label: "Content Strategy" },
        { href: "/auto-content", label: "Auto-Content" },
        { href: "/history", label: "History" },
      ],
    },
    {
      title: "Tools",
      icon: Zap,
      links: [
        { href: "/gbp-audit", label: "GBP Audit" },
        { href: "/drafts", label: "Drafts" },
        { href: "/calendar", label: "Calendar" },
        { href: "/editor", label: "Editor" },
      ],
    },
    {
      title: "Account",
      icon: Shield,
      links: [
        { href: "/", label: "Home" },
        { href: "/sign-in", label: "Sign In" },
        { href: "/sign-up", label: "Sign Up" },
      ],
    },
    {
      title: "Legal",
      icon: FileText,
      links: [
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Service" },
        { href: "#", label: "Cookie Policy" },
      ],
    },
  ];

  return (
    <footer className="bg-slate-900 text-white">
      {/* Gradient top border */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
      
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">SEO</span>
                <span className="text-xs text-slate-400 -mt-0.5">Hub</span>
              </div>
            </Link>
            <p className="text-slate-400 text-sm mb-4">
              Professional SEO analysis and content automation for modern websites.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
                <section.icon className="w-4 h-4 text-blue-400" />
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-white text-sm transition-colors hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              &copy; {currentYear} SEO Hub. All rights reserved.
            </p>
            <p className="text-slate-500 text-sm flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500" /> for SEO professionals
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

import React from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata = { title: "Contact - SEO Hub", description: "Get in touch with the SEO Hub team." };

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <MarketingNav />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 text-center">Contact Us</h1>
          <p className="text-center text-slate-500 mb-12">Have a question? We'd love to hear from you.</p>
          <form className="space-y-6 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name</label><input className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label><input className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" /></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label><input type="email" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" /></div>
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label><textarea rows={5} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" /></div>
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md">Send Message</button>
          </form>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

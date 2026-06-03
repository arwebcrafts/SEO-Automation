"use client";

import React from "react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { 
  BookOpen, 
  Search, 
  FileText, 
  Zap, 
  Globe, 
  Calendar, 
  Settings, 
  ChevronRight,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Help & Documentation
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Learn how to use SEO Audit Tool to improve your website's performance
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quick Start Guide */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Quick Start Guide
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Run Your First Audit</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Navigate to the Dashboard and enter your website URL. Choose between Quick Audit (free, instant) or Deep Crawl (comprehensive).
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Review Your Results</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    View your SEO score, identify critical issues, and get actionable recommendations to improve your ranking.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Analyze Content Strategy</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Use the Content Strategy tools to identify content gaps, generate AI-powered topics, and plan your content calendar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Guides */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Link href="/dashboard" className="block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">SEO Audits</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Learn how to run comprehensive SEO audits and interpret the results
                  </p>
                  <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                    Learn more <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/content-strategy?view=analysis" className="block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Content Strategy</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Discover content gaps and generate AI-powered content ideas
                  </p>
                  <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                    Learn more <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/content-strategy?view=auto-pilot" className="block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Auto Pilot</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Automate content generation and scheduling with AI
                  </p>
                  <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                    Learn more <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/content-strategy?view=calendar" className="block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Content Calendar</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Plan and schedule your content publishing strategy
                  </p>
                  <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                    Learn more <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* FAQ Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                  What's the difference between Quick Audit and Deep Crawl?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Quick Audit is free and analyzes a single page instantly without sign-up. Deep Crawl analyzes all pages on your website for comprehensive insights, requires authentication, and takes 1-2 minutes.
                </p>
              </div>
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                  How do I connect WordPress for publishing?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Go to Settings &gt; API Keys to add your WordPress credentials, then use the Connect WordPress button in the Quick Writer section. Download the SEO AutoFix plugin for seamless integration.
                </p>
              </div>
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                  What is the Content Strategy feature?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Content Strategy analyzes your website to identify content gaps, discover keyword opportunities, and generate AI-powered content suggestions based on your brand voice and target audience.
                </p>
              </div>
              <div className="pb-4">
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                  How does Auto Pilot work?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Auto Pilot uses AI to generate a full month of content automatically based on your content strategy. It creates articles, schedules them, and can even publish directly to WordPress if connected.
                </p>
              </div>
            </div>
          </div>

          {/* Getting Started Checklist */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Getting Started Checklist
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-white/30 bg-white/20" />
                <span>Run your first Quick Audit</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-white/30 bg-white/20" />
                <span>Review audit results and recommendations</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-white/30 bg-white/20" />
                <span>Set up Content Strategy for your domain</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-white/30 bg-white/20" />
                <span>Generate your first AI article</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-white/30 bg-white/20" />
                <span>Connect WordPress for publishing (optional)</span>
              </label>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-6 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Still have questions? We're here to help.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

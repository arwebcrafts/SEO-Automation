"use client";

import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { 
  Search, 
  BarChart3, 
  Zap, 
  Shield, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Globe,
  Target,
  FileText,
  Calendar,
  Lightbulb,
  Layers
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 px-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/30 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-radial from-blue-500/5 via-transparent to-transparent rounded-full"></div>
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:44px_44px]"></div>
          </div>
          
          <div className="container mx-auto max-w-6xl relative">
            <div className="text-center mb-14">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-full mb-8 shadow-lg shadow-blue-500/10">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI-Powered SEO Platform</span>
              </div>
              
              {/* Main heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
                <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                  Supercharge Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                  SEO Performance
                </span>
              </h1>
              
              {/* Subheading */}
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Get instant SEO audits, AI-powered content suggestions, and one-click WordPress fixes. 
                <span className="font-semibold text-slate-900 dark:text-slate-200"> Everything you need to rank higher.</span>
              </p>
              
              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                >
                  <Layers className="w-5 h-5" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold text-slate-900 dark:text-slate-100 shadow-lg hover:-translate-y-0.5"
                >
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Free Forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Instant Results</span>
                </div>
              </div>
            </div>

            {/* Audit Form Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-20 -z-10"></div>
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-slate-200/50 dark:border-slate-700/50">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Try a Free Audit
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Enter your website URL to get started
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="https://example.com"
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => window.location.href = '/sign-up'}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold"
                  >
                    Analyze
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Access Cards */}
        <section className="py-20 px-4 bg-white dark:bg-slate-900 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full mb-4">
                All-in-One Platform
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Your Content Command Center
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Everything you need to create, optimize, and publish winning content that ranks
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/sign-up" className="group">
                <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:shadow-blue-500/10 transition-all h-full hover:-translate-y-1 overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full"></div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Strategy Hub</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Analyze your site and discover content opportunities</p>
                  <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>

              <Link href="/sign-up" className="group relative">
                <div className="absolute -top-3 -right-3 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-full z-10 shadow-lg animate-pulse">NEW</div>
                <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:shadow-purple-500/10 transition-all h-full hover:-translate-y-1 overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full"></div>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                    <Lightbulb className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Content Wizard</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">6-step guided AI content generation</p>
                  <div className="mt-4 flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>

              <Link href="/sign-up" className="group">
                <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:shadow-amber-500/10 transition-all h-full hover:-translate-y-1 overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full"></div>
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/30">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Drafts</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Manage and edit your content drafts</p>
                  <div className="mt-4 flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium group-hover:gap-2 transition-all">
                    <span>View Drafts</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>

              <Link href="/sign-up" className="group">
                <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:shadow-green-500/10 transition-all h-full hover:-translate-y-1 overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full"></div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/30">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Calendar</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Schedule and track content publishing</p>
                  <div className="mt-4 flex items-center text-green-600 dark:text-green-400 text-sm font-medium group-hover:gap-2 transition-all">
                    <span>Open Calendar</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          
          <div className="container mx-auto max-w-6xl relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">💯</span>
                </div>
                <div className="text-4xl font-extrabold text-white mb-2">100%</div>
                <div className="text-blue-200">Free Forever</div>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🔍</span>
                </div>
                <div className="text-4xl font-extrabold text-white mb-2">50+</div>
                <div className="text-blue-200">SEO Checks</div>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📊</span>
                </div>
                <div className="text-4xl font-extrabold text-white mb-2">10+</div>
                <div className="text-blue-200">Categories</div>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🤖</span>
                </div>
                <div className="text-4xl font-extrabold text-white mb-2">AI</div>
                <div className="text-blue-200">Powered Analysis</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-background to-slate-50 dark:to-slate-900">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                Everything You Need to Rank Higher
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Comprehensive analysis across all critical SEO factors
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
                  <Search className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  On-Page SEO
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Analyze meta tags, headings, content structure, and keyword optimization to ensure your pages are perfectly optimized.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  Performance
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Check page speed, Core Web Vitals, and optimization opportunities to improve user experience and rankings.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  E-E-A-T Analysis
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Evaluate expertise, authoritativeness, and trustworthiness signals that Google uses to rank content.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-6">
                  <Globe className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  Local SEO
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Optimize for local search with Google Business Profile integration, NAP consistency, and local keywords.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  Content Strategy
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  AI-powered content analysis to identify gaps, optimize keywords, and generate content ideas.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  Actionable Insights
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Get prioritized recommendations with clear steps to improve your SEO performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WordPress Auto-Fix Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">WordPress Plugin</span>
                </div>
                <h2 className="text-4xl font-bold mb-6 text-slate-900 dark:text-slate-100">
                  Auto-Fix SEO Issues with One Click
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                  Install our WordPress plugin to automatically fix SEO issues detected in your audit. No coding required.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Auto-fix meta descriptions, alt text, and schema</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Enable security headers and performance optimizations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Auto-submit new posts to Google and Bing for indexing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">One-click connection with OAuth handshake</span>
                  </li>
                </ul>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold shadow-lg shadow-green-500/25"
                >
                  <Zap className="w-5 h-5" />
                  Download Free Plugin
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <span className="text-red-700 dark:text-red-300">Missing Alt Text (6 images)</span>
                    <button className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600">Fix</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <span className="text-yellow-700 dark:text-yellow-300">No Schema Markup</span>
                    <button className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600">Fix</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <span className="text-yellow-700 dark:text-yellow-300">Security Headers Missing</span>
                    <button className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600">Fix</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-green-700 dark:text-green-300">✓ All issues fixed!</span>
                    <span className="text-green-600 text-sm font-medium">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary to-blue-600">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold mb-4 text-white">
              Ready to Improve Your SEO?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Start analyzing your website today and get actionable insights to boost your rankings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-lg hover:bg-slate-100 transition-colors font-medium"
              >
                <Search className="w-5 h-5" />
                Start Free Audit
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white border-2 border-white/30 rounded-lg hover:bg-white/20 transition-colors font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />

      </div>
    );
}

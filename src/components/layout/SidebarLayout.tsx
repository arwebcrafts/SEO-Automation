"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TopHeader } from "./TopHeader";
import Sidebar from "./Sidebar";
import OnboardingWalkthrough from "@/components/onboarding/OnboardingWalkthrough";
import WebsiteSwitcher from "@/components/content/WebsiteSwitcher";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useContentStrategy, Website } from "@/contexts/ContentStrategyContext";
import { Globe, Menu, X } from "lucide-react";

interface SidebarLayoutProps {
  children: React.ReactNode;
  currentDomain?: string;
  healthScore?: number;
  contentGapsCount?: number;
}

export default function SidebarLayout({
  children,
  currentDomain,
  healthScore,
  contentGapsCount
}: SidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();

  const {
    activeWebsite,
    setActiveWebsite,
    isWebsiteSwitcherOpen,
    openWebsiteSwitcher,
    closeWebsiteSwitcher,
    resetStrategy
  } = useContentStrategy();

  const handleWebsiteSelect = (website: Website) => {
    setActiveWebsite(website);
    closeWebsiteSwitcher();
    resetStrategy();
    router.push('/content/analysis');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg">SEO Hub</span>
          </div>
        </div>
      </div>

      {/* Sidebar Component */}
      <Sidebar
        isCollapsed={isCollapsed}
        onCollapse={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        currentDomain={currentDomain}
        healthScore={healthScore}
        contentGapsCount={contentGapsCount}
      />

      {/* Main Content */}
      <main
        id="main-content"
        className={`transition-all duration-300 ${
          isCollapsed ? "lg:pl-16" : "lg:pl-64"
        } pt-16 lg:pt-0`}
      >
        {/* Top Header */}
        <div className="hidden lg:block sticky top-0 z-40">
          <TopHeader />
        </div>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {/* Onboarding Walkthrough */}
      <OnboardingWalkthrough />

      {/* Website Switcher Modal */}
      <WebsiteSwitcher
        isOpen={isWebsiteSwitcherOpen}
        onClose={closeWebsiteSwitcher}
        onWebsiteSelect={handleWebsiteSelect}
        currentWebsiteId={activeWebsite?.id}
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Zap,
  Calendar,
  History,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Globe,
  Menu,
  X,
  Home,
  Target,
  Settings,
  Archive,
  FileText,
  Plus,
  RefreshCw,
  Download,
  Share2,
  Wand2,
  CalendarDays,
  Rocket,
  TrendingUp,
  Search,
  ClipboardCheck,
  FileEdit,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { TopHeader } from "./TopHeader";
import OnboardingWalkthrough from "@/components/onboarding/OnboardingWalkthrough";
import WebsiteSwitcher, { WebsiteSelector } from "@/components/content/WebsiteSwitcher";
import { useContentStrategy, Website } from "@/contexts/ContentStrategyContext";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  hidden?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

// Organized navigation with Audit and Content main sections
const navSections: NavSection[] = [
  {
    id: "audit",
    label: "Audit",
    icon: ClipboardCheck,
    items: [
      { id: "home", label: "New Audit", icon: Plus, href: "/" },
      { id: "audit-history", label: "History", icon: History, href: "/history?tab=audits" },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: FileEdit,
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/content-strategy?view=dashboard" },
      { id: "strategy", label: "Strategy Hub", icon: BarChart3, href: "/content-strategy?view=analysis" },
      { id: "production", label: "Quick Writer", icon: Zap, href: "/content-strategy?view=production" },
      { id: "auto-pilot", label: "Auto Pilot", icon: Rocket, href: "/content-strategy?view=auto-pilot", badge: "New" },
      { id: "progress", label: "Progress", icon: TrendingUp, href: "/content-strategy?view=progress" },
      { id: "drafts", label: "Drafts", icon: FileText, href: "/content-strategy?view=drafts" },
      { id: "calendar", label: "Calendar", icon: CalendarDays, href: "/content-strategy?view=calendar" },
      { id: "content-history", label: "History", icon: History, href: "/history?tab=content" },
    ],
  },
];

// Flatten for backward compatibility
const navItems: NavItem[] = navSections.flatMap(section => section.items);

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onNewStrategy?: () => void;
  currentDomain?: string;
  healthScore?: number;
  contentGapsCount?: number;
}

export default function SidebarLayout({ 
  children, 
  activeView, 
  onViewChange,
  onNewStrategy,
  currentDomain,
  healthScore,
  contentGapsCount 
}: SidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["audit", "content"]);
  const pathname = usePathname();
  const router = useRouter();
  
  // Get website context
  const { 
    activeWebsite, 
    setActiveWebsite, 
    isWebsiteSwitcherOpen, 
    openWebsiteSwitcher, 
    closeWebsiteSwitcher,
    resetStrategy 
  } = useContentStrategy();

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleNewStrategy = () => {
    // Open the website switcher modal instead of just resetting
    openWebsiteSwitcher();
  };

  const handleWebsiteSelect = (website: Website) => {
    setActiveWebsite(website);
    closeWebsiteSwitcher();
    // Reset strategy data when switching websites
    resetStrategy();
    // Navigate to analysis view for the new website
    router.push('/content-strategy?view=analysis');
  };

  const handleNavClick = (item: NavItem) => {
    if (onViewChange && item.href.includes("view=")) {
      const view = new URL(item.href, "http://localhost").searchParams.get("view");
      if (view) {
        onViewChange(view);
      }
    }
    setIsMobileOpen(false);
  };

  const isActive = (item: NavItem) => {
    if (activeView) {
      const view = new URL(item.href, "http://localhost").searchParams.get("view");
      return view === activeView;
    }
    return pathname === item.href.split("?")[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
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

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Globe className="w-7 h-7 text-blue-600" />
              <span className="font-bold text-xl text-slate-900 dark:text-slate-100">SEO Hub</span>
            </div>
          )}
          {isCollapsed && <Globe className="w-7 h-7 text-blue-600 mx-auto" />}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Website Selector */}
        {!isCollapsed && (
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <WebsiteSelector
              currentWebsite={activeWebsite}
              onOpenSwitcher={openWebsiteSwitcher}
            />
          </div>
        )}

        {/* New Strategy CTA Button */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={handleNewStrategy}
            data-onboarding="new-strategy"
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${
              isCollapsed ? "px-2" : ""
            }`}
            title={isCollapsed ? "New Strategy" : undefined}
          >
            <Plus className="w-5 h-5" />
            {!isCollapsed && <span>New Strategy</span>}
          </button>
        </div>

        {/* Navigation with Sections */}
        <nav className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {navSections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections.includes(section.id);
            const hasActiveItem = section.items.some(item => isActive(item));
            
            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                <button
                  onClick={() => !isCollapsed && toggleSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    hasActiveItem
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? section.label : undefined}
                >
                  <SectionIcon className={`w-5 h-5 flex-shrink-0 ${hasActiveItem ? "text-blue-600 dark:text-blue-400" : ""}`} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 font-semibold text-sm">{section.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </>
                  )}
                </button>
                
                {/* Section Items */}
                {!isCollapsed && isExpanded && (
                  <div className="ml-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-1">
                    {section.items.filter(item => !item.hidden).map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item);
                      
                      const onboardingId = {
                        "strategy": "strategy-hub",
                        "production": "quick-writer",
                        "auto-pilot": "auto-pilot",
                        "calendar": "calendar",
                        "audit-history": "history",
                        "content-history": "history",
                      }[item.id];

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => handleNavClick(item)}
                          data-onboarding={onboardingId}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                            active
                              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : ""}`} />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
                
                {/* Collapsed mode - show only section icon */}
                {isCollapsed && (
                  <div className="space-y-1">
                    {isCollapsed ? (
                      <div className="flex flex-col gap-1 px-2 py-4">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              isActive(item)
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                            title={item.label}
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span>{item.label}</span>}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      section.items.filter(item => !item.hidden).slice(0, 1).map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item);
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => handleNavClick(item)}
                            className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                              active
                                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                            }`}
                            title={item.label}
                          >
                            <Icon className="w-4 h-4" />
                          </Link>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Quick Stats (Only when expanded) */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Quick Stats</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Health Score</p>
                  <p className="font-bold text-blue-600">{healthScore ?? '--'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Content Gaps</p>
                  <p className="font-bold text-amber-600">{contentGapsCount ?? '--'}</p>
                </div>
              </div>
              {currentDomain && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 text-xs truncate" title={currentDomain}>
                    {currentDomain}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          isCollapsed ? "lg:pl-16" : "lg:pl-64"
        } pt-16 lg:pt-0`}
      >
        {/* Top Header with Agency Tab & Client Switcher */}
        <div className="hidden lg:block sticky top-0 z-40">
          <TopHeader />
        </div>
        {children}
      </main>

      {/* Onboarding Walkthrough for new users */}
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

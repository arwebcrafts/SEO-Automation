"use client";

import React, { useState, useEffect, useRef } from "react";
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
  FileText,
  Plus,
  Rocket,
  TrendingUp,
  Search,
  ClipboardCheck,
  FileEdit,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useContentStrategy, Website } from "@/contexts/ContentStrategyContext";
import { cn } from "@/lib/utils";

// Tooltip component for collapsed sidebar
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <div className="group relative inline-block">
    {children}
    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
      {content}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 rotate-45" />
    </div>
  </div>
);

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
  collapsible?: boolean;
}

// New navigation structure per IA
const navSections: NavSection[] = [
  {
    id: "primary",
    label: "Primary",
    icon: LayoutDashboard,
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
    collapsible: false,
  },
  {
    id: "audits",
    label: "Audits",
    icon: Search,
    items: [
      { id: "audit-new", label: "New Audit", icon: Search, href: "/audits/new" },
      { id: "audit-history", label: "History", icon: History, href: "/audits" },
    ],
    collapsible: true,
  },
  {
    id: "content",
    label: "Content",
    icon: FileEdit,
    items: [
      { id: "content-dashboard", label: "Content Overview", icon: LayoutDashboard, href: "/content/dashboard" },
      { id: "strategy", label: "Strategy Hub", icon: BarChart3, href: "/content/analysis" },
      { id: "production", label: "Quick Writer", icon: Zap, href: "/content/production" },
      { id: "auto-pilot", label: "Auto Pilot", icon: Rocket, href: "/content/auto-pilot", badge: "New" },
      { id: "progress", label: "Progress", icon: TrendingUp, href: "/content/progress" },
      { id: "drafts", label: "Drafts", icon: FileText, href: "/content/drafts" },
      { id: "calendar", label: "Calendar", icon: Calendar, href: "/content/calendar" },
    ],
    collapsible: true,
  },
  {
    id: "secondary",
    label: "Secondary",
    icon: Settings,
    items: [
      { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
      { id: "help", label: "Help & Docs", icon: HelpCircle, href: "/help" },
    ],
    collapsible: false,
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  currentDomain?: string;
  healthScore?: number;
  contentGapsCount?: number;
}

export default function Sidebar({
  isCollapsed = false,
  onCollapse,
  isMobileOpen = false,
  onMobileClose,
  currentDomain,
  healthScore,
  contentGapsCount,
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["content", "audits"]);
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc closes mobile drawer
      if (e.key === 'Escape' && isMobileOpen && onMobileClose) {
        onMobileClose();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onMobileClose]);
  
  const { 
    activeWebsite, 
    setActiveWebsite, 
    isWebsiteSwitcherOpen, 
    openWebsiteSwitcher, 
    closeWebsiteSwitcher,
    resetStrategy 
  } = useContentStrategy();

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null && onCollapse) {
      onCollapse(saved === "true");
    }
  }, [onCollapse]);

  const handleCollapseToggle = () => {
    const newState = !isCollapsed;
    onCollapse?.(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleNewStrategy = () => {
    openWebsiteSwitcher();
  };

  const handleWebsiteSelect = (website: Website) => {
    setActiveWebsite(website);
    closeWebsiteSwitcher();
    resetStrategy();
    router.push('/content/analysis');
  };

  const isActive = (item: NavItem) => {
    // For exact matches
    if (pathname === item.href) return true;
    // For parent routes
    if (pathname.startsWith(item.href + '/')) return true;
    // For content routes with query params (backward compatibility during migration)
    if (item.href.includes('/content/') && pathname.includes('/content-strategy')) {
      const view = new URL(item.href, "http://localhost").pathname.split('/').pop();
      const currentView = new URLSearchParams(window.location.search).get('view');
      return view === currentView;
    }
    return false;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transition-all duration-300 flex flex-col",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Globe className="w-7 h-7 text-blue-600" />
              <span className="font-bold text-xl text-slate-900 dark:text-slate-100">SEO Hub</span>
            </div>
          )}
          {isCollapsed && <Globe className="w-7 h-7 text-blue-600 mx-auto" />}
          <button
            onClick={handleCollapseToggle}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Domain Switcher */}
        {!isCollapsed && (
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <button
              onClick={handleNewStrategy}
              className="w-full flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Globe className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {currentDomain || activeWebsite?.name || "Select Domain"}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500 ml-auto" />
            </button>
          </div>
        )}

        {/* New Strategy CTA */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button
            onClick={handleNewStrategy}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg",
              isCollapsed && "px-2"
            )}
            title={isCollapsed ? "New Strategy" : undefined}
          >
            <Plus className="w-5 h-5" />
            {!isCollapsed && <span>New Strategy</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navSections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections.includes(section.id);
            const hasActiveItem = section.items.some(item => isActive(item));
            
            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                {section.collapsible ? (
                  <button
                    onClick={() => !isCollapsed && toggleSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                      hasActiveItem
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-l-2 border-indigo-600"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700",
                      isCollapsed && "justify-center"
                    )}
                    title={isCollapsed ? section.label : undefined}
                  >
                    <SectionIcon className={cn("w-5 h-5 flex-shrink-0", hasActiveItem && "text-indigo-600 dark:text-indigo-400")} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 font-semibold text-sm">{section.label}</span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                      </>
                    )}
                  </button>
                ) : !isCollapsed ? (
                  <div className={cn(
                    "px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider",
                    hasActiveItem && "text-indigo-600 dark:text-indigo-400"
                  )}>
                    {section.label}
                  </div>
                ) : null}
                
                {/* Section Items */}
                {(!section.collapsible || isExpanded) && (
                  <div className={cn(
                    "space-y-1",
                    section.collapsible && !isCollapsed && "ml-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700"
                  )}>
                    {section.items.filter(item => !item.hidden).map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item);

                      const navItem = (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                            active
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 font-medium border-l-2 border-indigo-600"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100",
                            isCollapsed && "justify-center"
                          )}
                        >
                          <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-indigo-600 dark:text-indigo-400")} />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1">{item.label}</span>
                              {item.badge && (
                                <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </Link>
                      );

                      return isCollapsed ? (
                        <Tooltip key={item.id} content={item.label}>
                          {navItem}
                        </Tooltip>
                      ) : navItem;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Menu (Bottom) */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          {!isCollapsed && currentDomain ? (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Quick Stats</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Health Score</p>
                  <p className="font-bold text-indigo-600">{healthScore ?? '--'}</p>
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
          ) : (
            <div className="flex flex-col gap-1">
              <Link
                href="/settings"
                className="flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <Link
                href="/help"
                className="flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

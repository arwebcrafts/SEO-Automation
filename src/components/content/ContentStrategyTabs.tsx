"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  PenTool,
  Bot,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  view: string;
}

const tabs: TabConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    view: "dashboard",
  },
  {
    id: "analysis",
    label: "Analysis",
    icon: <Search className="w-4 h-4" />,
    view: "analysis",
  },
  {
    id: "production",
    label: "Production",
    icon: <PenTool className="w-4 h-4" />,
    view: "production",
  },
  {
    id: "auto-pilot",
    label: "Auto Pilot",
    icon: <Bot className="w-4 h-4" />,
    view: "auto-pilot",
  },
  {
    id: "progress",
    label: "Progress",
    icon: <TrendingUp className="w-4 h-4" />,
    view: "progress",
  },
];

interface ContentStrategyTabsProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function ContentStrategyTabs({
  activeView,
  onViewChange,
}: ContentStrategyTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleTabClick = (view: string) => {
    onViewChange(view);
    // Update URL param for shareability
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex space-x-1 overflow-x-auto" role="navigation" aria-label="Content strategy views">
          {tabs.map((tab) => {
            const isActive = activeView === tab.view;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.view)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

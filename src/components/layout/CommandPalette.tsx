"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  LayoutDashboard,
  BarChart3,
  Zap,
  Calendar,
  History,
  Settings,
  FileText,
  Rocket,
  TrendingUp,
  ClipboardCheck,
  FileEdit,
  HelpCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const commands: CommandItem[] = [
    // Pages
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      shortcut: "G D",
      action: () => {
        router.push("/dashboard");
        onClose();
      },
      category: "Pages",
    },
    {
      id: "new-audit",
      label: "New Audit",
      icon: ClipboardCheck,
      shortcut: "G A",
      action: () => {
        router.push("/audits/new");
        onClose();
      },
      category: "Pages",
    },
    {
      id: "audits-history",
      label: "Audit History",
      icon: History,
      action: () => {
        router.push("/audits");
        onClose();
      },
      category: "Pages",
    },
    {
      id: "content-dashboard",
      label: "Content Dashboard",
      icon: LayoutDashboard,
      action: () => {
        router.push("/content/dashboard");
        onClose();
      },
      category: "Content",
    },
    {
      id: "content-analysis",
      label: "Strategy Analysis",
      icon: BarChart3,
      action: () => {
        router.push("/content/analysis");
        onClose();
      },
      category: "Content",
    },
    {
      id: "quick-writer",
      label: "Quick Writer",
      icon: Zap,
      action: () => {
        router.push("/content/production");
        onClose();
      },
      category: "Content",
    },
    {
      id: "auto-pilot",
      label: "Auto Pilot",
      icon: Rocket,
      action: () => {
        router.push("/content/auto-pilot");
        onClose();
      },
      category: "Content",
    },
    {
      id: "content-progress",
      label: "Content Progress",
      icon: TrendingUp,
      action: () => {
        router.push("/content/progress");
        onClose();
      },
      category: "Content",
    },
    {
      id: "drafts",
      label: "Drafts",
      icon: FileText,
      action: () => {
        router.push("/content/drafts");
        onClose();
      },
      category: "Content",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: Calendar,
      action: () => {
        router.push("/content/calendar");
        onClose();
      },
      category: "Content",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      shortcut: "G S",
      action: () => {
        router.push("/settings");
        onClose();
      },
      category: "Pages",
    },
    {
      id: "help",
      label: "Help & Documentation",
      icon: HelpCircle,
      action: () => {
        router.push("/help");
        onClose();
      },
      category: "Pages",
    },
  ];

  const filteredCommands = commands.filter((command) =>
    command.label.toLowerCase().includes(search.toLowerCase()) ||
    command.category.toLowerCase().includes(search.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Command className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-500" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Search pages, commands..."
            className="flex-1 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
          />
          <kbd className="px-2 py-1 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 rounded">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          {search === "" && (
            <Command.Empty className="py-6 text-center text-sm text-slate-500">
              Type to search...
            </Command.Empty>
          )}

          {search !== "" && Object.keys(groupedCommands).length === 0 && (
            <Command.Empty className="py-6 text-center text-sm text-slate-500">
              No results found
            </Command.Empty>
          )}

          {Object.entries(groupedCommands).map(([category, items]) => (
            <Command.Group key={category} heading={category}>
              {items.map((command) => {
                const Icon = command.icon;
                return (
                  <Command.Item
                    key={command.id}
                    onSelect={command.action}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="flex-1">{command.label}</span>
                    {command.shortcut && (
                      <kbd className="px-2 py-0.5 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 rounded">
                        {command.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                );
              })}
            </Command.Group>
          ))}
        </Command.List>

        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↵</kbd>
              Select
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
      </Command>
    </div>
  );
}

"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Sheet({
  isOpen,
  onClose,
  title,
  children,
  side = "right",
  className,
}: SheetProps) {
  if (!isOpen) return null;

  const sideClasses = {
    top: "inset-x-0 top-0 h-auto max-h-[80vh] rounded-b-2xl",
    bottom: "inset-x-0 bottom-0 h-auto max-h-[80vh] rounded-t-2xl",
    left: "inset-y-0 left-0 w-full max-w-md rounded-r-2xl",
    right: "inset-y-0 right-0 w-full max-w-md rounded-l-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "relative bg-white dark:bg-slate-800 shadow-xl",
          sideClasses[side],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">{children}</div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Lock, Sparkles, ArrowUpRight } from "lucide-react";
import { type PlanType } from "@/lib/plan-limits";

interface PlanGateProps {
  requiredPlan: PlanType;
  currentPlan: PlanType;
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PLAN_ORDER: PlanType[] = ["FREE", "PRO", "AGENCY", "WHITE_LABEL"];
const PLAN_LABELS: Record<PlanType, string> = { FREE: "Free", PRO: "Pro", AGENCY: "Agency", WHITE_LABEL: "White Label" };

export default function PlanGate({ requiredPlan, currentPlan, feature, children, fallback }: PlanGateProps) {
  const currentIndex = PLAN_ORDER.indexOf(currentPlan);
  const requiredIndex = PLAN_ORDER.indexOf(requiredPlan);

  if (currentIndex >= requiredIndex) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <div className="relative rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-8">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
          <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {feature}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            This feature requires the <span className="font-medium text-blue-600">{PLAN_LABELS[requiredPlan]}</span> plan or higher.
          </p>
        </div>
        <a
          href="/billing"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          Upgrade to {PLAN_LABELS[requiredPlan]}
          <ArrowUpRight className="w-4 h-4" />
        </a>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Currently on {PLAN_LABELS[currentPlan]} plan
        </p>
      </div>
    </div>
  );
}

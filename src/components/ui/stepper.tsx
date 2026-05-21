import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  label: string;
  description?: string;
  status: "pending" | "current" | "completed";
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && isCompleted;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold transition-all",
                    isCompleted
                      ? "bg-brand-600 border-brand-600 text-white"
                      : isCurrent
                      ? "bg-white dark:bg-slate-800 border-brand-600 text-brand-600"
                      : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400",
                    isClickable && "cursor-pointer hover:border-brand-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent
                        ? "text-slate-900 dark:text-slate-100"
                        : isCompleted
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && isCurrent && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[120px]">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors",
                    isCompleted ? "bg-brand-600" : "bg-slate-200 dark:bg-slate-700"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

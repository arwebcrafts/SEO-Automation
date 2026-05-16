"use client";

import React, { useState } from "react";
import { Globe, BarChart3, FileText, Zap, CheckCircle, ChevronRight, ChevronLeft, X } from "lucide-react";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

interface OnboardingWizardProps {
  onComplete: (data: Record<string, any>) => void;
  onSkip: () => void;
}

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({ websiteUrl: "", businessType: "", goals: [] });

  const steps: WizardStep[] = [
    {
      id: "welcome", title: "Welcome to SEO Hub", description: "Let's set up your account in a few simple steps.",
      icon: Globe,
      content: (
        <div className="space-y-4">
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome aboard! 🚀</h2>
            <p className="text-slate-500 mt-2">We'll help you get the most out of SEO Hub.</p>
          </div>
        </div>
      ),
    },
    {
      id: "website", title: "Your Website", description: "Enter your website to start analyzing.",
      icon: BarChart3,
      content: (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Website URL</label>
          <input
            type="url" placeholder="https://yourwebsite.com" value={formData.websiteUrl}
            onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mt-4">Business Type</label>
          <select
            value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">Select type...</option>
            <option value="local">Local Business</option>
            <option value="ecommerce">E-Commerce</option>
            <option value="saas">SaaS / Software</option>
            <option value="blog">Blog / Content</option>
            <option value="agency">Agency</option>
            <option value="other">Other</option>
          </select>
        </div>
      ),
    },
    {
      id: "goals", title: "Your Goals", description: "What do you want to achieve?",
      icon: FileText,
      content: (
        <div className="space-y-3">
          {["Improve search rankings", "Generate content", "Track competitors", "Manage reviews", "Local SEO", "Build backlinks"].map((goal) => (
            <button key={goal} onClick={() => {
              const goals = formData.goals.includes(goal) ? formData.goals.filter((g: string) => g !== goal) : [...formData.goals, goal];
              setFormData({ ...formData, goals });
            }}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${formData.goals.includes(goal)
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {formData.goals.includes(goal) ? <CheckCircle className="w-5 h-5 text-blue-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
                <span className="font-medium text-sm">{goal}</span>
              </div>
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "complete", title: "All Set!", description: "You're ready to start.",
      icon: Zap,
      content: (
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">You're all set! 🎉</h2>
          <p className="text-slate-500 mt-2">Let's start optimizing your SEO.</p>
        </div>
      ),
    },
  ];

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-700">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-slate-400">Step {currentStep + 1} of {steps.length}</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="text-sm text-slate-500">{step.description}</p>
            </div>
            <button onClick={onSkip} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="min-h-[250px]">{step.content}</div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex gap-2">
              <button onClick={onSkip} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Skip</button>
              <button
                onClick={() => isLast ? onComplete(formData) : setCurrentStep(currentStep + 1)}
                className="flex items-center gap-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium text-sm shadow-md"
              >
                {isLast ? "Get Started" : "Next"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

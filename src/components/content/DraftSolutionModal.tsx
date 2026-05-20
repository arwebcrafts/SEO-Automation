"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  Target,
  FileText,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Settings,
} from "lucide-react";

interface DraftSolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gapTopic: string;
  targetPersona?: string;
  suggestedTone?: string;
  suggestedKeywords?: string[];
  onGenerate: (config: {
    topic: string;
    tone: string;
    keywords: string[];
    targetPersona: string;
  }) => void;
}

const toneOptions = [
  { value: "professional", label: "Professional", desc: "Formal and business-focused" },
  { value: "conversational", label: "Conversational", desc: "Friendly and approachable" },
  { value: "authoritative", label: "Authoritative", desc: "Expert and confident" },
  { value: "educational", label: "Educational", desc: "Informative and helpful" },
];

export default function DraftSolutionModal({
  isOpen,
  onClose,
  gapTopic,
  targetPersona = "General Audience",
  suggestedTone = "professional",
  suggestedKeywords = [],
  onGenerate,
}: DraftSolutionModalProps) {
  const [topic, setTopic] = useState(gapTopic);
  const [tone, setTone] = useState(suggestedTone);
  const [keywords, setKeywords] = useState<string[]>(suggestedKeywords);
  const [customKeyword, setCustomKeyword] = useState("");
  const [persona, setPersona] = useState(targetPersona);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (isOpen) {
      setTopic(gapTopic);
      setTone(suggestedTone);
      setKeywords(suggestedKeywords);
      setPersona(targetPersona);
      setStep(1);
    }
  }, [isOpen, gapTopic, suggestedTone, suggestedKeywords, targetPersona]);

  const handleAddKeyword = () => {
    if (customKeyword.trim() && !keywords.includes(customKeyword.trim())) {
      setKeywords([...keywords, customKeyword.trim()]);
      setCustomKeyword("");
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate({ topic, tone, keywords, targetPersona: persona });
      onClose();
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Draft Solution
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Generate content to fill this gap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                }`}
              >
                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : "1"}
              </div>
              <span
                className={`text-sm font-medium ${
                  step >= 1 ? "text-slate-900 dark:text-slate-100" : "text-slate-500"
                }`}
              >
                Configure
              </span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full bg-blue-600 transition-all ${
                  step >= 2 ? "w-full" : "w-0"
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                }`}
              >
                2
              </div>
              <span
                className={`text-sm font-medium ${
                  step >= 2 ? "text-slate-900 dark:text-slate-100" : "text-slate-500"
                }`}
              >
                Generate
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {step === 1 && (
            <div className="space-y-6">
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Content Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Enter your topic..."
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Auto-filled from the content gap. Modify if needed.
                </p>
              </div>

              {/* Target Persona */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  Target Persona
                </label>
                <input
                  type="text"
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Who is this content for?"
                />
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Writing Tone
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {toneOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTone(option.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        tone === option.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                        {option.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {option.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Target Keywords
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Add a keyword..."
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                    >
                      {kw}
                      <button
                        onClick={() => handleRemoveKeyword(kw)}
                        className="hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {keywords.length === 0 && (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      No keywords added yet
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-8">
              {isGenerating ? (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Generating Your Content...
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    This may take a moment. We're crafting high-quality content.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-8 h-8 text-blue-600" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Content Brief
                    </h3>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Review the content brief below before generating
                  </p>

                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 rounded-xl p-6 text-left max-w-lg mx-auto border border-slate-200 dark:border-slate-700">
                    {/* Topic Section */}
                    <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Topic</span>
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{topic}</p>
                    </div>

                    {/* Target Persona */}
                    <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Target Persona</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{persona}</p>
                    </div>

                    {/* Tone */}
                    <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Writing Tone</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">{tone}</p>
                    </div>

                    {/* Keywords */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Target Keywords ({keywords.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((kw, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                          >
                            {kw}
                          </span>
                        ))}
                        {keywords.length === 0 && (
                          <span className="text-sm text-slate-500 dark:text-slate-400 italic">
                            No keywords specified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>AI will generate SEO-optimized content with featured image</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!topic.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                disabled={isGenerating}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Content
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

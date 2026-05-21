"use client";

import React from "react";
import {
  User,
  Briefcase,
  MessageSquare,
  Target,
  Sparkles,
  Edit2,
} from "lucide-react";

interface PersonaCardProps {
  audiencePersona?: string;
  tone?: string;
  writingStyle?: {
    dominantTone?: string;
    averageFormality?: string;
    commonPerspective?: string;
    brandVoiceSummary?: string;
  };
  painPoints?: string[];
  goals?: string[];
}

export default function PersonaCard({
  audiencePersona = "General Audience",
  tone = "Professional",
  writingStyle,
  painPoints = [],
  goals = [],
}: PersonaCardProps) {
  const getAvatarGradient = (persona: string) => {
    const hash = persona.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    const gradients = [
      "from-blue-500 to-indigo-600",
      "from-purple-500 to-pink-600",
      "from-green-500 to-teal-600",
      "from-amber-500 to-orange-600",
      "from-cyan-500 to-blue-600",
    ];
    return gradients[Math.abs(hash) % gradients.length];
  };

  const getPersonaInitials = (persona: string) => {
    const words = persona.split(" ").filter((w) => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return persona.substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Trading Card Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Target Audience
            </span>
          </div>
          <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 hover:opacity-100 transition-opacity">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-24 h-24 rounded-full bg-gradient-to-br ${getAvatarGradient(
              audiencePersona
            )} flex items-center justify-center shadow-lg`}
          >
            <span className="text-3xl font-bold text-white">
              {getPersonaInitials(audiencePersona)}
            </span>
          </div>
        </div>

        {/* Persona Name */}
        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-slate-100 mb-4">
          {audiencePersona}
        </h3>

        {/* Stats Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Preferred Tone</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{tone}</p>
            </div>
          </div>

          {writingStyle?.averageFormality && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Formality Level</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {writingStyle.averageFormality}
                </p>
              </div>
            </div>
          )}

          {writingStyle?.commonPerspective && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Writing Perspective</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {writingStyle.commonPerspective}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pain Points & Goals Tags */}
        {(painPoints.length > 0 || goals.length > 0) && (
          <div className="mt-4 space-y-3">
            {painPoints.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  Pain Points
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {painPoints.slice(0, 4).map((point, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-full"
                    >
                      {point}
                    </span>
                  ))}
                  {painPoints.length > 4 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1">
                      +{painPoints.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {goals.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  Goals
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {goals.slice(0, 4).map((goal, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full"
                    >
                      {goal}
                    </span>
                  ))}
                  {goals.length > 4 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1">
                      +{goals.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Brand Voice Summary */}
        {writingStyle?.brandVoiceSummary && (
          <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                Brand Voice
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {writingStyle.brandVoiceSummary}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
          AI-generated persona based on content analysis
        </p>
      </div>
    </div>
  );
}

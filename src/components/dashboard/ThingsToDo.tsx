import { Check, ChevronRight, Globe, FileSearch, Plug, PenTool, Calendar } from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  label: string;
  completed: boolean;
  action?: string;
}

interface ThingsToDoProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export function ThingsToDo({ tasks, onTaskClick }: ThingsToDoProps) {
  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  const getIcon = (taskId: string) => {
    switch (taskId) {
      case "add-website":
        return Globe;
      case "run-audit":
        return FileSearch;
      case "connect-wordpress":
        return Plug;
      case "generate-article":
        return PenTool;
      case "schedule-post":
        return Calendar;
      default:
        return Check;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Things to do
          </h2>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {completedCount} of {tasks.length} complete
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const Icon = getIcon(task.id);
          return (
            <button
              key={task.id}
              onClick={() => onTaskClick(task.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  task.completed
                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                    : "bg-slate-100 dark:bg-slate-700"
                }`}
              >
                {task.completed ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <div className="w-3 h-3 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    task.completed
                      ? "text-slate-400 dark:text-slate-500 line-through"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {task.label}
                </p>
              </div>
              {!task.completed && task.action && (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

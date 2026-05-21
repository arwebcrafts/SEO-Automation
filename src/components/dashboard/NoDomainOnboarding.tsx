import { useState } from "react";
import { Globe, Loader2, AlertCircle } from "lucide-react";

interface NoDomainOnboardingProps {
  onAddDomain: (domain: string) => void;
}

export function NoDomainOnboarding({ onAddDomain }: NoDomainOnboardingProps) {
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeDomain = (input: string): string => {
    let normalized = input.trim();
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      normalized = `https://${normalized}`;
    }
    return normalized;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const normalized = normalizeDomain(domain);
      // Validate the URL format
      new URL(normalized);
      onAddDomain(normalized);
    } catch {
      setError("Please enter a valid website URL (e.g., https://yourdomain.com)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Let's analyze your website
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Enter your domain to unlock content gaps, keyword opportunities, and AI-powered suggestions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="domain-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Your website URL
              </label>
              <input
                id="domain-input"
                type="text"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  setError(null);
                }}
                placeholder="yourdomain.com or https://yourdomain.com"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 transition-colors ${
                  error
                    ? "border-red-300 dark:border-red-700 focus:ring-red-500"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                disabled={isLoading}
                required
              />
              {error && (
                <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !domain.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Start Analysis"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-center text-xs text-slate-400 mb-4">— or get started another way —</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => (window.location.href = '/settings?tab=wordpress')}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Connect WordPress
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = '/audits/new')}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Run First Audit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

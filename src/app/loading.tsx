export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse mx-auto" />
          <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">404</div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Page Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all">
            Go Home
          </Link>
          <Link href="/contact" className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

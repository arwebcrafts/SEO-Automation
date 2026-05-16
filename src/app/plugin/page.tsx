import React from "react";
import Link from "next/link";
import { Download, CheckCircle, Globe, Settings, Code } from "lucide-react";

export default function PluginPage() {
  const features = ["Automatic SEO fixes", "Meta tag optimization", "Schema markup injection", "Image alt text generation", "Internal link suggestions", "Content API integration"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"><Globe className="w-10 h-10 text-white" /></div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">SEO AutoFix WordPress Plugin</h1>
          <p className="text-slate-500">Automatically optimize your WordPress site's SEO with AI-powered fixes.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
          <h2 className="font-semibold text-xl text-slate-900 dark:text-white mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f) => (<div key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm text-slate-700 dark:text-slate-300">{f}</span></div>))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
          <h2 className="font-semibold text-xl text-slate-900 dark:text-white mb-4">Installation</h2>
          <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>Download the plugin zip file below</li>
            <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>Go to WordPress Admin → Plugins → Add New → Upload Plugin</li>
            <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>Upload the zip file and click "Install Now"</li>
            <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">4</span>Activate the plugin and configure your API key</li>
          </ol>
        </div>
        <div className="text-center">
          <a href="/downloads/seo-auto-fix.zip" download className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
            <Download className="w-5 h-5" /> Download Plugin
          </a>
        </div>
      </div>
    </div>
  );
}

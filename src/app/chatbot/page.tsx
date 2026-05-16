"use client";
import React, { useState } from "react";
import { MessageCircle, Settings, Code, Copy, CheckCircle } from "lucide-react";

export default function ChatbotPage() {
  const [siteId] = useState("site_" + Date.now());
  const [copied, setCopied] = useState(false);
  const embedCode = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js" data-site-id="${siteId}"></script>`;

  const copyEmbed = () => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Chatbot Widget</h1>
        <p className="text-slate-500 mb-8">Configure and deploy your AI chatbot</p>
        <div className="grid gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4"><MessageCircle className="w-5 h-5 text-blue-600" /><h2 className="font-semibold text-slate-900 dark:text-white">Configuration</h2></div>
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Welcome Message</label><input defaultValue="Hi! How can I help you today?" className="w-full mt-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" /></div>
              <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Primary Color</label><input type="color" defaultValue="#3b82f6" className="mt-1 h-10 w-20 rounded border border-slate-300" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded" /><label className="text-sm text-slate-700 dark:text-slate-300">Collect email from visitors</label></div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4"><Code className="w-5 h-5 text-blue-600" /><h2 className="font-semibold text-slate-900 dark:text-white">Embed Code</h2></div>
            <p className="text-sm text-slate-500 mb-3">Add this script to your website's HTML to enable the chatbot.</p>
            <div className="relative"><pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm overflow-x-auto font-mono text-slate-700 dark:text-slate-300">{embedCode}</pre><button onClick={copyEmbed} className="absolute top-2 right-2 p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border">{copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}

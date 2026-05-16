"use client";
import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Key, User, Shield, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [keys, setKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState({ provider: "openai", apiKey: "", label: "" });

  useEffect(() => { fetch("/api/user/keys").then((r) => r.json()).then((d) => setKeys(d.keys || [])).catch(() => {}); }, []);

  const saveKey = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newKey) });
      const r = await fetch("/api/user/keys"); const d = await r.json(); setKeys(d.keys || []);
      setNewKey({ provider: "openai", apiKey: "", label: "" });
    } catch { } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Settings</h1>
        <div className="flex gap-6">
          <div className="w-48 space-y-1">
            {[{ id: "profile", icon: User, label: "Profile" }, { id: "api-keys", icon: Key, label: "API Keys" }, { id: "security", icon: Shield, label: "Security" }].map((t) => {
              const Icon = t.icon; return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            ); })}
          </div>
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            {tab === "profile" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-slate-900 dark:text-white">Profile Settings</h2>
                <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label><input className="w-full mt-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" /></div>
                <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label><input type="email" className="w-full mt-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" /></div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"><Save className="w-4 h-4" />Save Changes</button>
              </div>
            )}
            {tab === "api-keys" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-slate-900 dark:text-white">API Keys (BYOK)</h2>
                <p className="text-sm text-slate-500">Bring your own API keys for AI providers.</p>
                <div className="space-y-3">
                  <select value={newKey.provider} onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
                    <option value="openai">OpenAI</option><option value="anthropic">Anthropic</option><option value="openrouter">OpenRouter</option>
                  </select>
                  <input value={newKey.apiKey} onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })} placeholder="API Key" type="password" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                  <button onClick={saveKey} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}Save Key</button>
                </div>
                {keys.length > 0 && (
                  <div className="mt-4 space-y-2">{keys.map((k: any) => (
                    <div key={k.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <div><span className="font-medium text-sm capitalize">{k.provider}</span><span className="text-xs text-slate-400 ml-2">{k.maskedKey}</span></div>
                      <span className={`text-xs ${k.isActive ? "text-green-600" : "text-slate-400"}`}>{k.isActive ? "Active" : "Inactive"}</span>
                    </div>
                  ))}</div>
                )}
              </div>
            )}
            {tab === "security" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-slate-900 dark:text-white">Security</h2>
                <p className="text-sm text-slate-500">Manage your account security settings. Authentication is handled by Clerk.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

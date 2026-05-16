"use client";
import React, { useState, useEffect } from "react";
import { Plus, Settings, Trash2, Globe, ArrowRight } from "lucide-react";

interface Workspace { id: string; name: string; slug: string; description?: string; createdAt: string; }

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    // Mock data
    setWorkspaces([
      { id: "1", name: "My Business", slug: "my-business", description: "Main business workspace", createdAt: new Date().toISOString() },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Workspaces</h1>
            <p className="text-slate-500 mt-1">Manage your SEO projects and environments</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> New Workspace
          </button>
        </div>

        {showCreate && (
          <div className="mb-6 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Create Workspace</h3>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Workspace name" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { setWorkspaces([...workspaces, { id: Date.now().toString(), name: newName, slug: newName.toLowerCase().replace(/\s+/g, "-"), createdAt: new Date().toISOString() }]); setNewName(""); setShowCreate(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {workspaces.map((ws) => (
            <div key={ws.id} className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{ws.name}</h3>
                    <p className="text-sm text-slate-500">{ws.description || ws.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><Settings className="w-4 h-4 text-slate-400" /></button>
                  <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg text-sm font-medium">Open <ArrowRight className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

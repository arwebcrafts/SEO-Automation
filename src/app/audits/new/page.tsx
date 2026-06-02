"use client";
import React from "react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { AuditForm } from "@/components/audit/audit-form";

export default function NewAuditPage() {
  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">New Audit</h1>
            <p className="text-slate-500">Run a comprehensive SEO analysis for your website.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <AuditForm />
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

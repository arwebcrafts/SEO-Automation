# SEO Hub — 3-Developer Parallel Implementation Plan

> **Source:** `SAAS-PRODUCT-AUDIT-REPORT.md`  
> **Total Issues:** 23  
> **Target:** All 3 developers work **simultaneously** with zero blocking dependencies between tracks  
> **Stack:** Next.js 14, Clerk Auth, Tailwind CSS, TypeScript, Prisma

---

## How to Read This Document

Each developer has their own **Track**. All tracks run **in parallel**. Each task inside a track is **sequential** (must be done in order). No developer needs to wait for another to start.

- 🔴 = Critical (must ship first)
- 🟡 = High Priority
- 🟢 = Polish / Nice-to-have
- **Est.** = estimated time
- **File:** = exact file to edit

---

## Track Summary

| Developer | Track Name | Focus | Total Est. |
|-----------|-----------|-------|-----------|
| **Dev 1** | Auth, Security & Landing Page | Fix redirect bugs, auth-aware UI, error handling | ~6–8 hrs |
| **Dev 2** | Navigation, Sidebar & Visual Polish | IA restructure, UX polish, dark mode, mobile | ~7–9 hrs |
| **Dev 3** | Dashboard Data, State & Empty States | Real data fetching, loading states, onboarding tasks | ~7–9 hrs |

---

---

# DEVELOPER 1 — Auth, Security & Landing Page

> **Focus:** Everything related to authentication flow, route protection, landing page behavior, and error boundaries.  
> **Works in:** `middleware.ts`, `src/app/page.tsx`, `src/components/shared/header.tsx`, `src/components/providers.tsx`

---

## TASK 1.1 — Fix Auth Redirect on Homepage (Middleware)

🔴 **Critical** | **Est: 30 min**

### Problem
When a logged-in user visits `https://seo-try.vercel.app/`, they see the public landing page instead of being redirected to `/dashboard`. The middleware marks `/` as a public route but does not check auth state for redirect.

### File to Edit
`middleware.ts` (root of project)

### Current Code (full file)
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  // ...
]);

export default clerkMiddleware((auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }
  auth.protect();
});
```

### Step-by-Step Instructions

**Step 1:** Add `NextResponse` import at the top:
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
```

**Step 2:** Replace the middleware function body so it checks auth state before letting `/` pass:
```typescript
export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const url = new URL(request.url);

  // If authenticated user visits homepage, redirect to dashboard
  if (userId && url.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublicRoute(request)) {
    return;
  }

  // Protect all private routes
  await auth.protect();
});
```

### Verification
1. Log in to the app in browser
2. Visit `https://seo-try.vercel.app/`
3. Should immediately redirect to `/dashboard` without showing landing page
4. Log out, visit `/` → landing page shows correctly

---

## TASK 1.2 — Add Client-Side Auth Guard on Homepage (Defense Layer)

🔴 **Critical** | **Est: 30 min**

### Problem
The middleware fix (Task 1.1) handles server-side redirect, but the homepage is a `"use client"` component — there's no client-side guard. If middleware is bypassed or cached, users still see the wrong page.

### File to Edit
`src/app/page.tsx`

### Step-by-Step Instructions

**Step 1:** Import Clerk auth hooks and router at the very top of the file (after existing imports):
```typescript
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
```

**Step 2:** Inside `HomePage()` function, before the `return` statement, add:
```typescript
export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  // Prevent flash of landing page for authenticated users
  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ... rest of existing landing page JSX unchanged ... */}
```

### Verification
1. In browser dev tools → Application → Cookies → delete session cookie
2. Sign in → navigate to `/` → should show spinner then redirect to `/dashboard`
3. Clear site data → visit `/` → landing page shows (unauthenticated)

---

## TASK 1.3 — Fix Landing Page CTAs for Authenticated Users

🟡 **High Priority** | **Est: 45 min**

### Problem
The landing page hero section shows "Get Started Free" and "Sign In" buttons even when the user is already signed in. This is confusing and unprofessional.

### File to Edit
`src/app/page.tsx`

### Step-by-Step Instructions

**Step 1:** The `useAuth` hook is already imported from Task 1.2. Now find this block in the hero section (around line 67–83) — the CTA buttons:

```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
  <Link href="/sign-up" className="group inline-flex ...">
    ...Get Started Free
  </Link>
  <Link href="/sign-in" className="inline-flex ...">
    Sign In
  </Link>
</div>
```

**Step 2:** Replace it with a conditional block:
```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
  {isSignedIn ? (
    <Link
      href="/dashboard"
      className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
    >
      <LayoutDashboard className="w-5 h-5" />
      Go to Dashboard
      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
    </Link>
  ) : (
    <>
      <Link
        href="/sign-up"
        className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
      >
        <Layers className="w-5 h-5" />
        Get Started Free
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Link>
      <Link
        href="/sign-in"
        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold text-slate-900 dark:text-slate-100 shadow-lg hover:-translate-y-0.5"
      >
        Sign In
        <ArrowRight className="w-5 h-5" />
      </Link>
    </>
  )}
</div>
```

**Step 3:** Add `LayoutDashboard` to the imports at the top of the file (it's already in the lucide-react import line, just add it):
```typescript
import { 
  Search, BarChart3, Zap, Shield, TrendingUp, CheckCircle2,
  ArrowRight, Sparkles, Globe, Target, FileText, Calendar,
  Lightbulb, Layers, LayoutDashboard  // <-- add LayoutDashboard
} from "lucide-react";
```

**Step 4:** Also find the bottom CTA section (around line 417–431) and apply same conditional:
```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  {isSignedIn ? (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-lg hover:bg-slate-100 transition-colors font-medium"
    >
      <LayoutDashboard className="w-5 h-5" />
      Go to Dashboard
    </Link>
  ) : (
    <>
      <Link href="/sign-up" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-lg hover:bg-slate-100 transition-colors font-medium">
        <Search className="w-5 h-5" />
        Start Free Audit
      </Link>
      <Link href="/sign-in" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white border-2 border-white/30 rounded-lg hover:bg-white/20 transition-colors font-medium">
        Sign In
      </Link>
    </>
  )}
</div>
```

**Step 5:** Also update the feature cards section. The 4 quick-access cards all link to `/sign-up` for everyone. Change them to dynamic hrefs:
```tsx
// Replace all instances of href="/sign-up" in the feature cards with:
href={isSignedIn ? "/content/analysis" : "/sign-up"}  // Strategy Hub
href={isSignedIn ? "/content/production" : "/sign-up"} // Content Wizard  
href={isSignedIn ? "/content/drafts" : "/sign-up"}     // Drafts
href={isSignedIn ? "/content/calendar" : "/sign-up"}   // Calendar
```

Also update the "Download Free Plugin" link:
```tsx
href={isSignedIn ? "/settings" : "/sign-up"}
```

### Verification
- Log in → visit `/` (or use a cached version) → all CTAs show "Go to Dashboard"
- Log out → CTAs show "Get Started Free" and "Sign In"

---

## TASK 1.4 — Fix Homepage Audit Form "Analyze" Button

🟡 **High Priority** | **Est: 20 min**

### Problem
The "Analyze" button in the homepage hero always redirects to `/sign-up`. Authenticated users should be redirected to the audit creation page with the URL pre-filled.

### File to Edit
`src/app/page.tsx`

### Step-by-Step Instructions

**Step 1:** Find the hero audit form section (around line 114–127):
```tsx
<div className="flex flex-col sm:flex-row gap-3">
  <input
    type="text"
    placeholder="https://example.com"
    className="flex-1 px-4 py-3 ..."
  />
  <button
    onClick={() => window.location.href = '/sign-up'}
    className="px-6 py-3 bg-gradient-to-r ..."
  >
    Analyze
  </button>
</div>
```

**Step 2:** Add `useState` for input tracking and update the button logic. First add `useState` to the existing React import (it's already imported from `"react"` via useEffect/useAuth, just add `useState`):
```typescript
import { useState, useEffect } from "react";
```

**Step 3:** Add state for the URL input at the top of `HomePage()`:
```typescript
const [auditUrl, setAuditUrl] = useState("");
```

**Step 4:** Replace the form section:
```tsx
<div className="flex flex-col sm:flex-row gap-3">
  <input
    type="text"
    value={auditUrl}
    onChange={(e) => setAuditUrl(e.target.value)}
    placeholder="https://example.com"
    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        const target = isSignedIn
          ? `/audits/new${auditUrl ? `?url=${encodeURIComponent(auditUrl)}` : ""}`
          : "/sign-up";
        router.push(target);
      }
    }}
  />
  <button
    onClick={() => {
      const target = isSignedIn
        ? `/audits/new${auditUrl ? `?url=${encodeURIComponent(auditUrl)}` : ""}`
        : "/sign-up";
      router.push(target);
    }}
    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold"
  >
    Analyze
  </button>
</div>
```

**Step 5:** Add `useRouter` import (already there from Task 1.2):
```typescript
import { useRouter } from "next/navigation";
```

### Verification
- Logged in: Type a URL → click Analyze → goes to `/audits/new?url=https://...`
- Logged out: Click Analyze → goes to `/sign-up`
- Press Enter in input → same behavior

---

## TASK 1.5 — Fix SidebarLayout Website Switcher Redirect

🟡 **High Priority** | **Est: 15 min**

### Problem
In `SidebarLayout.tsx` line 42, when a user selects a website via the switcher, it navigates to the old URL `/content-strategy?view=analysis` instead of the new route `/content/analysis`.

### File to Edit
`src/components/layout/SidebarLayout.tsx`

### Step-by-Step Instructions

**Step 1:** Find line 42:
```typescript
window.location.href = '/content-strategy?view=analysis';
```

**Step 2:** Replace with proper Next.js router navigation using the correct new route:
```typescript
const handleWebsiteSelect = (website: Website) => {
  setActiveWebsite(website);
  closeWebsiteSwitcher();
  resetStrategy();
  router.push('/content/analysis');
};
```

**Step 3:** Add `useRouter` import at top of `SidebarLayout.tsx`:
```typescript
import { useRouter } from "next/navigation";
```

**Step 4:** Instantiate it in the component body (above `useState` declarations):
```typescript
const router = useRouter();
```

### Verification
- Click "New Strategy" in sidebar → select a website → should navigate to `/content/analysis` cleanly (not full page reload)

---

## TASK 1.6 — Implement React Error Boundaries

🟢 **Polish** | **Est: 1.5 hrs**

### Problem
No error boundaries exist in the component tree. A single failing component (e.g., bad API response in StatCard) can crash the entire page.

### Files to Create / Edit
- Create: `src/components/ErrorBoundary.tsx` (new file)
- Edit: `src/app/dashboard/page.tsx`
- Edit: `src/components/layout/SidebarLayout.tsx`

### Step-by-Step Instructions

**Step 1:** Create new file `src/components/ErrorBoundary.tsx`:
```tsx
"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  section?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.section ? `:${this.props.section}` : ""}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 gap-3">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div className="text-center">
            <p className="font-medium text-slate-900 dark:text-slate-100">
              Something went wrong{this.props.section ? ` in ${this.props.section}` : ""}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Step 2:** Wrap the main content in `src/app/dashboard/page.tsx`. Find the return statement and wrap sections:
```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Wrap the stat cards grid:
<ErrorBoundary section="Stats">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    <StatCard ... />
    <StatCard ... />
    <StatCard ... />
    <StatCard ... />
  </div>
</ErrorBoundary>

// Wrap the audit form:
<ErrorBoundary section="Audit Form">
  <div className="lg:col-span-2">
    ...
  </div>
</ErrorBoundary>

// Wrap Recent Activity:
<ErrorBoundary section="Recent Activity">
  <RecentActivity audits={recentAudits} loading={loading} />
</ErrorBoundary>

// Wrap ThingsToDo:
<ErrorBoundary section="Things To Do">
  <ThingsToDo tasks={thingsToDoTasks} onTaskClick={handleTaskClick} />
</ErrorBoundary>
```

**Step 3:** Wrap the entire `<main>` content in `SidebarLayout.tsx`:
```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

<main id="main-content" className={...}>
  <div className="hidden lg:block sticky top-0 z-40">
    <TopHeader />
  </div>
  <ErrorBoundary section="Page Content">
    {children}
  </ErrorBoundary>
</main>
```

### Verification
- Temporarily throw an error in one component
- Error boundary should show "Something went wrong in [Section]" message
- "Try Again" button should reset the error state
- Other sections of the page should still work

---

## TASK 1.7 — Remove Inconsistent Client-Side Route Protection

🟢 **Polish** | **Est: 45 min**

### Problem
Some pages do their own auth check in addition to middleware, causing inconsistent behavior. The middleware should be the single source of truth.

### Files to Audit
Run this grep to find all instances: look for `isSignedIn` checks that gate entire page renders:
```
src/app/editor/page.tsx
src/app/settings/page.tsx
src/app/admin/page.tsx
```

### Step-by-Step Instructions

**Step 1:** For each page file found, look for patterns like:
```tsx
const { isSignedIn } = useAuth();
if (!isSignedIn) return <Redirect to="/sign-in" />;
```
or
```tsx
if (!isSignedIn) {
  router.push("/sign-in");
  return null;
}
```

**Step 2:** Remove these checks from page files. The middleware already handles protection. Keeping them causes double-redirect waterfalls.

**Step 3:** However, keep auth checks in API route handlers — those are necessary for server-side protection:
```typescript
// KEEP THIS in API routes:
const { userId } = auth();
if (!userId) return new Response("Unauthorized", { status: 401 });
```

**Step 4:** Add a comment at the top of middleware.ts to document the protection strategy:
```typescript
/**
 * Route Protection Strategy:
 * - Middleware handles ALL route protection server-side
 * - Public routes defined in isPublicRoute matcher
 * - Authenticated users visiting "/" are redirected to "/dashboard"
 * - Individual page components should NOT do their own redirect logic
 * - API routes should still check userId via auth() for data access control
 */
```

### Verification
- Test that protected pages redirect to `/sign-in` when not logged in
- Confirm no double-redirect flicker occurs

---

---

# DEVELOPER 2 — Navigation, Sidebar & Visual Polish

> **Focus:** Everything visible in the sidebar — labels, structure, mobile UX, theme toggle, domain switcher, badges, accessibility, and keyboard shortcuts.  
> **Works in:** `src/components/layout/Sidebar.tsx`, `src/components/layout/SidebarLayout.tsx`, `src/components/shared/header.tsx`

---

## TASK 2.1 — Rename Duplicate "Dashboard" in Content Section

🔴 **Critical** | **Est: 15 min**

### Problem
The sidebar has two items both labeled "Dashboard" — one in Primary (`/dashboard`) and one in Content (`/content/dashboard`). Users cannot tell them apart.

### File to Edit
`src/components/layout/Sidebar.tsx`

### Step-by-Step Instructions

**Step 1:** Find the `navSections` array (around line 66). Locate this item in the `content` section:
```typescript
{ id: "content-dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/content/dashboard" },
```

**Step 2:** Rename the label from `"Dashboard"` to `"Content Overview"`:
```typescript
{ id: "content-dashboard", label: "Content Overview", icon: LayoutDashboard, href: "/content/dashboard" },
```

**Step 3:** While in this file, also update the `content` section's display label from `"Content"` to give more context. Find line 79:
```typescript
{
  id: "content",
  label: "Content",
  icon: FileEdit,
```
This label is fine as-is — keep it. The fix is only renaming the sub-item.

### Verification
- Open the sidebar in browser
- Verify Content section shows: **Content Overview**, Strategy Hub, Quick Writer, Auto Pilot, Progress, Drafts, Calendar
- Primary section still shows: **Dashboard**, New Audit

---

## TASK 2.2 — Restructure Navigation Information Architecture

🟡 **High Priority** | **Est: 1.5 hrs**

### Problem
- Content section has 7 items (too many) with no sub-grouping
- History (Secondary) only covers audits, not content history
- No Audits group under Primary to house both "New Audit" and "History"
- Poor scalability for future items

### File to Edit
`src/components/layout/Sidebar.tsx`

### Step-by-Step Instructions

**Step 1:** Replace the entire `navSections` array (lines 66–102) with the restructured version:

```typescript
const navSections: NavSection[] = [
  {
    id: "primary",
    label: "Primary",
    icon: LayoutDashboard,
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
    collapsible: false,
  },
  {
    id: "audits",
    label: "Audits",
    icon: Search,
    items: [
      { id: "audit-new", label: "New Audit", icon: Search, href: "/audits/new" },
      { id: "audit-history", label: "History", icon: History, href: "/audits" },
    ],
    collapsible: true,
  },
  {
    id: "content",
    label: "Content",
    icon: FileEdit,
    items: [
      { id: "content-dashboard", label: "Content Overview", icon: LayoutDashboard, href: "/content/dashboard" },
      { id: "strategy", label: "Strategy Hub", icon: BarChart3, href: "/content/analysis" },
      { id: "production", label: "Quick Writer", icon: Zap, href: "/content/production" },
      { id: "auto-pilot", label: "Auto Pilot", icon: Rocket, href: "/content/auto-pilot", badge: "New" },
      { id: "progress", label: "Progress", icon: TrendingUp, href: "/content/progress" },
      { id: "drafts", label: "Drafts", icon: FileText, href: "/content/drafts" },
      { id: "calendar", label: "Calendar", icon: Calendar, href: "/content/calendar" },
    ],
    collapsible: true,
  },
  {
    id: "secondary",
    label: "Secondary",
    icon: Settings,
    items: [
      { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
      { id: "help", label: "Help & Docs", icon: HelpCircle, href: "/help" },
    ],
    collapsible: false,
  },
];
```

**Step 2:** Update `expandedSections` initial state to include both collapsible sections:
```typescript
const [expandedSections, setExpandedSections] = useState<string[]>(["content", "audits"]);
```

**Step 3:** Verify `HelpCircle` is in the imports at the top — it's already imported on line 28. No change needed.

**Step 4:** Remove History from the old Secondary section (it now lives under Audits). The old entry in secondary was:
```typescript
{ id: "history", label: "History", icon: History, href: "/audits" },
```
This is already replaced in Step 1 above.

### Verification
- Sidebar shows: Dashboard → Audits (New Audit, History) → Content (7 items) → Secondary (Settings, Help)
- Clicking "History" under Audits → navigates to `/audits`
- Clicking "History" label no longer appears in Secondary section

---

## TASK 2.3 — Add Dark Mode Toggle to Sidebar

🟡 **High Priority** | **Est: 1 hr**

### Problem
Users cannot toggle dark/light mode. It only uses system preference. No toggle exists in the UI.

### Files to Edit
- `src/components/layout/Sidebar.tsx`
- `src/components/providers.tsx` (verify `next-themes` is configured)

### Step-by-Step Instructions

**Step 1:** Check `src/components/providers.tsx` to see if `next-themes` `ThemeProvider` is already used:
```typescript
// If ThemeProvider is already imported and wrapping children — proceed to Step 3
// If NOT present, add it:
import { ThemeProvider } from "next-themes";

// Wrap children:
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

**Step 2:** Check `package.json` for `next-themes`. If missing, it needs to be installed:
```bash
npm install next-themes
```
(Flag this to the project lead — only needed if not already present)

**Step 3:** In `Sidebar.tsx`, add `useTheme` import from `next-themes` at the top:
```typescript
import { useTheme } from "next-themes";
```

**Step 4:** Add the `useTheme` hook inside the `Sidebar` component function body:
```typescript
const { theme, setTheme } = useTheme();
```

**Step 5:** Add `Sun` and `Moon` icons to the existing lucide-react import (they're already imported — line 30–31 shows `Moon, Sun`). ✅ Already imported.

**Step 6:** In the bottom User Menu section of the sidebar (around line 358–401), add a theme toggle button in the `<div className="flex flex-col gap-1">` section. After the existing Settings and Help links:

```tsx
{/* Theme Toggle */}
<button
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  className="flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
>
  {theme === "dark" ? (
    <Sun className="w-5 h-5" />
  ) : (
    <Moon className="w-5 h-5" />
  )}
</button>
```

**Step 7:** When the sidebar is NOT collapsed, also show a label next to the toggle. Find the non-collapsed bottom section and update:
```tsx
{!isCollapsed && (
  <button
    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
    title="Toggle theme"
  >
    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
  </button>
)}
```

### Verification
- Click the sun/moon icon in sidebar bottom area
- Page should switch between light and dark mode
- Preference should persist on page reload (via next-themes localStorage)

---

## TASK 2.4 — Improve Domain Switcher Empty State

🟡 **High Priority** | **Est: 45 min**

### Problem
When no domain is selected, the button shows "Select Domain" with no guidance. Users don't know what to do. The button opens `openWebsiteSwitcher()` but the switcher modal may show an empty list with no add option.

### File to Edit
`src/components/layout/Sidebar.tsx`

### Step-by-Step Instructions

**Step 1:** Find the Domain Switcher section (around line 239–253):
```tsx
{!isCollapsed && (
  <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
    <button
      onClick={handleNewStrategy}
      className="w-full flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
    >
      <Globe className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
        {currentDomain || activeWebsite?.name || "Select Domain"}
      </span>
      <ChevronDown className="w-4 h-4 text-slate-500 ml-auto" />
    </button>
  </div>
)}
```

**Step 2:** Replace with an enhanced version that shows different UI based on whether a domain is selected:
```tsx
{!isCollapsed && (
  <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
    {currentDomain || activeWebsite?.name ? (
      // Domain is selected — show switcher
      <button
        onClick={handleNewStrategy}
        className="w-full flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
        title="Switch domain"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {(currentDomain || activeWebsite?.name || "?")[0].toUpperCase()}
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1 text-left">
          {currentDomain || activeWebsite?.name}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
      </button>
    ) : (
      // No domain — show "Add website" CTA
      <button
        onClick={handleNewStrategy}
        className="w-full flex items-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors group"
        title="Add your first website"
      >
        <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
        <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          Add your website
        </span>
      </button>
    )}
  </div>
)}
```

**Step 3:** Verify `Plus` is in the lucide-react imports at the top (it's already there on line 22). ✅ No change needed.

### Verification
- New user (no domain) sees dashed "Add your website" button
- Existing user sees domain avatar + name + chevron
- Clicking either opens the website switcher modal

---

## TASK 2.5 — Animate Auto Pilot "New" Badge

🟢 **Polish** | **Est: 30 min**

### Problem
The "New" badge on Auto Pilot is static and easy to miss. It should draw attention to guide users to try the feature.

### File to Edit
`src/components/layout/Sidebar.tsx`

### Step-by-Step Instructions

**Step 1:** Find the badge rendering section (around line 335–339):
```tsx
{item.badge && (
  <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
    {item.badge}
  </span>
)}
```

**Step 2:** Replace with an animated gradient badge that uses Tailwind's animate-pulse and a gradient background:
```tsx
{item.badge && (
  <span className="relative inline-flex items-center">
    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-75 animate-ping" style={{ animationDuration: '2s' }} />
    <span className="relative px-2 py-0.5 text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold">
      {item.badge}
    </span>
  </span>
)}
```

**Step 3:** Add a `dismissedBadges` state to allow power users to dismiss it after seeing it once:
```typescript
const [dismissedBadges, setDismissedBadges] = useState<string[]>(() => {
  try {
    return JSON.parse(localStorage.getItem("dismissed-badges") || "[]");
  } catch {
    return [];
  }
});
```

**Step 4:** Update the badge render condition to check dismissed state:
```tsx
{item.badge && !dismissedBadges.includes(item.id) && (
  <span
    className="relative inline-flex items-center cursor-pointer"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      const updated = [...dismissedBadges, item.id];
      setDismissedBadges(updated);
      localStorage.setItem("dismissed-badges", JSON.stringify(updated));
    }}
    title="Click to dismiss"
  >
    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-60 animate-ping" style={{ animationDuration: '2s' }} />
    <span className="relative px-2 py-0.5 text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold">
      {item.badge}
    </span>
  </span>
)}
```

### Verification
- Auto Pilot item shows an animated pulsing "New" badge
- Clicking the badge dismisses it (stored in localStorage)
- Dismissed state persists after page reload

---

## TASK 2.6 — Improve ARIA Accessibility in Sidebar

🟢 **Polish** | **Est: 1 hr**

### Problem
Collapsible sections lack `aria-expanded` and `aria-controls` attributes. Navigation landmarks need improvement.

### File to Edit
`src/components/layout/Sidebar.tsx`

### Step-by-Step Instructions

**Step 1:** Find the collapsible section button (around line 281–299):
```tsx
<button
  onClick={() => !isCollapsed && toggleSection(section.id)}
  className={cn(...)}
  title={isCollapsed ? section.label : undefined}
>
```

**Step 2:** Add ARIA attributes:
```tsx
<button
  onClick={() => !isCollapsed && toggleSection(section.id)}
  className={cn(...)}
  title={isCollapsed ? section.label : undefined}
  aria-expanded={isExpanded}
  aria-controls={`nav-section-${section.id}`}
  aria-label={`${section.label} navigation section`}
>
```

**Step 3:** Add matching `id` to the items container (around line 311):
```tsx
<div
  id={`nav-section-${section.id}`}
  className={cn(...)}
>
```

**Step 4:** Add `role="navigation"` and `aria-label` to the `<nav>` element (around line 271):
```tsx
<nav
  className="flex-1 p-3 space-y-2 overflow-y-auto"
  aria-label="Main application navigation"
>
```

**Step 5:** Add `aria-current="page"` to active nav items:
```tsx
<Link
  key={item.id}
  href={item.href}
  aria-current={active ? "page" : undefined}
  className={cn(...)}
>
```

**Step 6:** Add `role="complementary"` and `aria-label` to the `<aside>` element (around line 209):
```tsx
<aside
  ref={sidebarRef}
  role="complementary"
  aria-label="Site navigation sidebar"
  className={cn(...)}
>
```

### Verification
- Open browser dev tools → Accessibility panel
- Sidebar `<aside>` should show role="complementary"
- Navigation `<nav>` should have accessible name
- Collapsible sections should show aria-expanded state changes
- Tab through sidebar → active link should show aria-current="page"

---

## TASK 2.7 — Add Microcopy Tooltip for "New Strategy" Button

🟢 **Polish** | **Est: 30 min**

### Problem
The "New Strategy" button is prominent but users don't understand the difference between "New Strategy" and "New Audit". Microcopy would clarify intent.

### File to Edit
`src/components/layout/Sidebar.tsx`

### Step-by-Step Instructions

**Step 1:** Find the "New Strategy CTA" button section (around line 255–268):
```tsx
<div className="p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
  <button
    onClick={handleNewStrategy}
    className={cn(
      "w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 ...",
      isCollapsed && "px-2"
    )}
    title={isCollapsed ? "New Strategy" : undefined}
  >
    <Plus className="w-5 h-5" />
    {!isCollapsed && <span>New Strategy</span>}
  </button>
</div>
```

**Step 2:** Add a subtitle line below the button when not collapsed:
```tsx
<div className="p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
  <button
    onClick={handleNewStrategy}
    className={cn(
      "w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg",
      isCollapsed && "px-2"
    )}
    title="Start a new content strategy for a domain"
    aria-label="Create new content strategy"
  >
    <Plus className="w-5 h-5" />
    {!isCollapsed && <span>New Strategy</span>}
  </button>
  {!isCollapsed && (
    <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1.5 px-1">
      AI content plan for your domain
    </p>
  )}
</div>
```

### Verification
- Expanded sidebar shows "New Strategy" button with subtitle "AI content plan for your domain"
- Collapsed sidebar shows just the + icon with tooltip on hover
- Hover tooltip says "Start a new content strategy for a domain"

---

---

# DEVELOPER 3 — Dashboard Data, State & Empty States

> **Focus:** Making the dashboard data-driven — real loading states, proper error handling, connected task tracking, and polished empty states.  
> **Works in:** `src/app/dashboard/page.tsx`, `src/components/dashboard/StatCard.tsx`, `src/components/dashboard/ThingsToDo.tsx`, `src/components/dashboard/NoDomainOnboarding.tsx`, `src/components/dashboard/RecentActivity.tsx`

---

## TASK 3.1 — Add Skeleton Loaders to StatCards

🔴 **Critical** | **Est: 45 min**

### Problem
While data loads, the dashboard shows "0" for everything, including "0 Content Drafts" and "0 Scheduled Posts". There's no loading state — users think they have no data.

### Files to Edit
- `src/components/dashboard/StatCard.tsx`

### Step-by-Step Instructions

**Step 1:** Open `src/components/dashboard/StatCard.tsx`. Add a `loading` prop to the interface:
```typescript
interface StatCardProps {
  label: string;
  value: number | string;
  delta?: Delta;
  icon: LucideIcon;
  href?: string;
  loading?: boolean;   // <-- add this
}
```

**Step 2:** Update the function signature:
```typescript
export function StatCard({ label, value, delta, icon: Icon, href, loading }: StatCardProps) {
```

**Step 3:** Add a skeleton render before the existing `content` variable:
```tsx
if (loading) {
  const skeleton = (
    <div className="animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
      <div className="w-28 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  );

  const cardClassName = "bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700";
  return <div className={cardClassName}>{skeleton}</div>;
}
```

**Step 4:** Open `src/app/dashboard/page.tsx`. Pass `loading={loading}` to each StatCard:
```tsx
<StatCard
  label="Total Audits"
  value={recentAudits.length}
  delta={{ ... }}
  icon={TrendingUp}
  href="/history?tab=audits"
  loading={loading}  // <-- add
/>
<StatCard
  label="SEO Score"
  value={...}
  delta={...}
  icon={BarChart3}
  href="/history?tab=audits"
  loading={loading}  // <-- add
/>
<StatCard
  label="Content Drafts"
  value={0}
  delta={{ ... }}
  icon={FileText}
  href="/content-strategy?view=drafts"
  loading={loading}  // <-- add
/>
<StatCard
  label="Scheduled Posts"
  value={0}
  delta={{ ... }}
  icon={Calendar}
  href="/content-strategy?view=calendar"
  loading={loading}  // <-- add
/>
```

### Verification
- Reload the dashboard page
- During the ~500ms load time, stat cards show animated grey skeletons
- After load, real numbers appear with smooth transition

---

## TASK 3.2 — Fetch Real Content Drafts & Scheduled Posts Data

🔴 **Critical** | **Est: 1.5 hrs**

### Problem
Content Drafts and Scheduled Posts stats on the dashboard are hardcoded to `0`. They never fetch real data from the APIs.

### File to Edit
`src/app/dashboard/page.tsx`

### Step-by-Step Instructions

**Step 1:** Add new state variables for content data at the top of the `DashboardPage` component:
```typescript
const [contentDraftsCount, setContentDraftsCount] = useState(0);
const [scheduledPostsCount, setScheduledPostsCount] = useState(0);
```

**Step 2:** Add a new `fetchContentStats` function alongside `fetchRecentAudits` in the `useEffect`:
```typescript
const fetchContentStats = async () => {
  try {
    // Fetch draft count
    const draftsRes = await fetch("/api/content/history?status=draft&limit=1");
    if (draftsRes.ok) {
      const draftsData = await draftsRes.json();
      setContentDraftsCount(draftsData.total || draftsData.count || 0);
    }
  } catch (error) {
    console.error("Error fetching content drafts:", error);
  }

  try {
    // Fetch scheduled posts count
    const scheduledRes = await fetch("/api/scheduled-posts?status=scheduled&limit=1");
    if (scheduledRes.ok) {
      const scheduledData = await scheduledRes.json();
      setScheduledPostsCount(scheduledData.total || scheduledData.count || 0);
    }
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
  }
};
```

**Step 3:** Add the call to `fetchContentStats` inside the `useEffect` alongside the audit fetch:
```typescript
useEffect(() => {
  if (isSignedIn) {
    fetchRecentAudits();
    fetchContentStats();  // <-- add this
  }
}, [isSignedIn]);
```

**Step 4:** Update the StatCard components to use real data:
```tsx
<StatCard
  label="Content Drafts"
  value={contentDraftsCount}
  delta={{
    value: contentDraftsCount > 0 ? `${contentDraftsCount}` : "0",
    trend: contentDraftsCount > 0 ? "up" : "neutral",
    period: "active"
  }}
  icon={FileText}
  href="/content/drafts"   // also fix this old URL
  loading={loading}
/>
<StatCard
  label="Scheduled Posts"
  value={scheduledPostsCount}
  delta={{
    value: scheduledPostsCount > 0 ? `${scheduledPostsCount}` : "0",
    trend: scheduledPostsCount > 0 ? "up" : "neutral",
    period: "upcoming"
  }}
  icon={Calendar}
  href="/content/calendar"   // also fix this old URL
  loading={loading}
/>
```

> **Note:** Also fix the old URLs: `href="/content-strategy?view=drafts"` → `href="/content/drafts"` and `href="/content-strategy?view=calendar"` → `href="/content/calendar"`. These are leftover from the old routing system.

**Step 5:** Add visible error state fallback. If the API fetch fails, show a small error indicator on the stat card. Update `StatCard.tsx` to accept an optional `error` prop:
```typescript
interface StatCardProps {
  // ... existing props
  loading?: boolean;
  error?: boolean;
}

// In the render, if error:
if (error) {
  return (
    <div className={`${cardClassName} opacity-60`}>
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="w-5 h-5" />
        <span className="text-sm">--</span>
      </div>
      <div className="text-sm text-slate-400 mt-2">{label}</div>
      <div className="text-xs text-rose-400 mt-1">Failed to load</div>
    </div>
  );
}
```

### Verification
- Dashboard loads → Content Drafts shows real draft count
- Dashboard loads → Scheduled Posts shows real scheduled count
- If API down → shows "--" with "Failed to load" in small text
- Both cards link to correct new routes

---

## TASK 3.3 — Fix Dashboard Error Handling (Show Errors to Users)

🟡 **High Priority** | **Est: 45 min**

### Problem
Data fetch errors are only logged to console. Users see no feedback when something fails — they just see "0" and wonder if the product works.

### File to Edit
`src/app/dashboard/page.tsx`

### Step-by-Step Instructions

**Step 1:** Add a `fetchError` state:
```typescript
const [fetchError, setFetchError] = useState<string | null>(null);
```

**Step 2:** Update `fetchRecentAudits` to set the error state:
```typescript
const fetchRecentAudits = async () => {
  try {
    const res = await fetch("/api/audit/history");
    if (res.ok) {
      const data = await res.json();
      setRecentAudits(data.audits?.slice(0, 5) || []);
      setHasDomain(data.audits?.length > 0);
      setFetchError(null);  // clear any previous error
    } else {
      throw new Error(`Failed to load audit history (${res.status})`);
    }
  } catch (error) {
    console.error("Error fetching recent audits:", error);
    setFetchError("Could not load your dashboard data. Please refresh.");
  } finally {
    setLoading(false);
  }
};
```

**Step 3:** Add an error banner at the top of the dashboard content, after the welcome section:
```tsx
{/* Error Banner */}
{fetchError && (
  <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
    <AlertCircle className="w-4 h-4 flex-shrink-0" />
    <span>{fetchError}</span>
    <button
      onClick={() => {
        setLoading(true);
        setFetchError(null);
        fetchRecentAudits();
      }}
      className="ml-auto flex items-center gap-1.5 text-red-600 hover:text-red-800 font-medium"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      Retry
    </button>
  </div>
)}
```

**Step 4:** Import `AlertCircle` and `RefreshCw` from lucide-react:
```typescript
import {
  FileText,
  Calendar,
  TrendingUp,
  BarChart3,
  AlertCircle,    // <-- add
  RefreshCw,      // <-- add
} from "lucide-react";
```

### Verification
- Temporarily break the API URL (e.g., fetch `/api/audit/history-broken`)
- Dashboard should show red error banner with "Retry" button
- Clicking Retry should re-attempt the fetch
- On success, banner disappears

---

## TASK 3.4 — Connect "Things to Do" Tasks to Real Navigation

🟡 **High Priority** | **Est: 1.5 hrs**

### Problem
`handleTaskClick` in `dashboard/page.tsx` only does `console.log`. Clicking a task does nothing useful. Tasks 3–5 are always `completed: false` because they're never tracked.

### Files to Edit
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/ThingsToDo.tsx`

### Step-by-Step Instructions

**Step 1:** Import `useRouter` in `dashboard/page.tsx`:
```typescript
import { useRouter } from "next/navigation";
```

**Step 2:** Instantiate it:
```typescript
const router = useRouter();
```

**Step 3:** Replace `handleTaskClick` with real navigation:
```typescript
const handleTaskClick = (taskId: string) => {
  switch (taskId) {
    case "add-website":
      router.push("/settings?tab=sites");
      break;
    case "run-audit":
      router.push("/audits/new");
      break;
    case "connect-wordpress":
      router.push("/settings?tab=wordpress");
      break;
    case "generate-article":
      router.push("/content/production");
      break;
    case "schedule-post":
      router.push("/content/calendar");
      break;
    default:
      break;
  }
};
```

**Step 4:** Add a fetch for WordPress connection status and content generation history. Add new state variables:
```typescript
const [isWordPressConnected, setIsWordPressConnected] = useState(false);
const [hasGeneratedArticle, setHasGeneratedArticle] = useState(false);
const [hasScheduledPost, setHasScheduledPost] = useState(false);
```

**Step 5:** Add fetches for these in the `useEffect`:
```typescript
const fetchOnboardingStatus = async () => {
  try {
    const wpRes = await fetch("/api/wordpress");
    if (wpRes.ok) {
      const wpData = await wpRes.json();
      setIsWordPressConnected(!!(wpData.siteUrl || wpData.connected));
    }
  } catch { /* silent — non-critical */ }

  try {
    const historyRes = await fetch("/api/content/history?limit=1");
    if (historyRes.ok) {
      const historyData = await historyRes.json();
      const items = historyData.items || historyData.articles || [];
      setHasGeneratedArticle(items.length > 0);
    }
  } catch { /* silent */ }

  try {
    const scheduledRes = await fetch("/api/scheduled-posts?limit=1");
    if (scheduledRes.ok) {
      const scheduledData = await scheduledRes.json();
      const items = scheduledData.posts || scheduledData.items || [];
      setHasScheduledPost(items.length > 0);
    }
  } catch { /* silent */ }
};
```

**Step 6:** Add the call in `useEffect`:
```typescript
if (isSignedIn) {
  fetchRecentAudits();
  fetchContentStats();
  fetchOnboardingStatus();  // <-- add
}
```

**Step 7:** Update `thingsToDoTasks` to use real state:
```typescript
const thingsToDoTasks = [
  { 
    id: "add-website", 
    label: "Add your first website", 
    completed: hasDomain,
    action: "/settings?tab=sites"
  },
  { 
    id: "run-audit", 
    label: "Run your first audit", 
    completed: recentAudits.length > 0,
    action: "/audits/new"
  },
  { 
    id: "connect-wordpress", 
    label: "Connect WordPress", 
    completed: isWordPressConnected,
    action: "/settings?tab=wordpress"
  },
  { 
    id: "generate-article", 
    label: "Generate your first AI article", 
    completed: hasGeneratedArticle,
    action: "/content/production"
  },
  { 
    id: "schedule-post", 
    label: "Schedule your first post", 
    completed: hasScheduledPost,
    action: "/content/calendar"
  },
];
```

**Step 8:** Update `ThingsToDo.tsx` to show a chevron arrow on ALL incomplete items (not just those with `action`). Find line 89:
```tsx
{!task.completed && task.action && (
  <ChevronRight className="w-4 h-4 text-slate-400" />
)}
```
Change to:
```tsx
{!task.completed && (
  <ChevronRight className="w-4 h-4 text-slate-400" />
)}
```

**Step 9:** Add hover animation on task items in `ThingsToDo.tsx`:
```tsx
className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group"
```
And on the ChevronRight:
```tsx
<ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
```

### Verification
- Click "Add your first website" → navigates to settings
- Click "Run your first audit" → navigates to `/audits/new`
- Click "Connect WordPress" → navigates to settings WordPress tab
- Click "Generate your first AI article" → navigates to `/content/production`
- Click "Schedule your first post" → navigates to `/content/calendar`
- WordPress connected state correctly reflects actual connection

---

## TASK 3.5 — Add Completion Celebration Animation

🟢 **Polish** | **Est: 1 hr**

### Problem
When all 5 tasks are complete, there's no celebration or feedback. Users deserve positive reinforcement.

### Files to Edit
- `src/components/dashboard/ThingsToDo.tsx`

### Step-by-Step Instructions

**Step 1:** Add a `completed` state tracker to know when all items finish:
```tsx
const allComplete = tasks.every((t) => t.completed);
```

**Step 2:** Add a celebration banner that appears when `allComplete` is true:
```tsx
{allComplete && (
  <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
    <div className="text-2xl mb-2">🎉</div>
    <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
      You're all set up!
    </p>
    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
      Your SEO Hub is fully configured and ready to use.
    </p>
  </div>
)}
```

**Step 3:** Add a smooth entrance animation for the completed state. In `globals.css` or as an inline Tailwind class:
```tsx
<div className={`transition-all duration-500 ${allComplete ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none h-0 overflow-hidden"}`}>
  {/* celebration content */}
</div>
```

### Verification
- Manually set all tasks to `completed: true` in browser
- Celebration banner animates in
- Banner shows congratulatory message

---

## TASK 3.6 — Improve NoDomainOnboarding Component

🟡 **High Priority** | **Est: 1 hr**

### Problem
The `NoDomainOnboarding` component appears when no audits exist, but the `handleAddDomain` function only does `console.log` and sets a local state flag — it doesn't actually save anything to the backend.

### Files to Edit
- `src/components/dashboard/NoDomainOnboarding.tsx`
- `src/app/dashboard/page.tsx`

### Step-by-Step Instructions

**Step 1:** Update `NoDomainOnboarding.tsx` to have proper loading and error states:
```tsx
"use client";

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
                onClick={() => window.location.href = '/settings?tab=wordpress'}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Connect WordPress
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/audits/new'}
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
```

**Step 2:** In `dashboard/page.tsx`, update `handleAddDomain` to navigate to the audit form after domain is entered:
```typescript
const handleAddDomain = (domain: string) => {
  setHasDomain(true);
  // Navigate to audit form with the domain pre-filled
  router.push(`/audits/new?url=${encodeURIComponent(domain)}`);
};
```

### Verification
- Log in with a fresh account (no audits)
- Dashboard shows the improved onboarding form
- Enter invalid URL → shows validation error
- Enter valid URL → navigates to `/audits/new?url=...`
- "Connect WordPress" → goes to settings
- "Run First Audit" → goes to `/audits/new`

---

## TASK 3.7 — Add Loading Skeleton for Recent Activity

🟢 **Polish** | **Est: 30 min**

### Problem
The Recent Activity panel has a `loading` prop but may not show a good skeleton state.

### File to Edit
`src/components/dashboard/RecentActivity.tsx`

### Step-by-Step Instructions

**Step 1:** Open `src/components/dashboard/RecentActivity.tsx` and check the current loading state. If it shows a spinner:
```tsx
if (loading) return <div className="..."><Spinner /></div>
```

**Step 2:** Replace the loading state with a proper skeleton that matches the real content layout:
```tsx
if (loading) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="w-3/4 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3:** Add an empty state when `audits.length === 0` and `!loading`:
```tsx
if (!loading && audits.length === 0) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Activity</h2>
      <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No audits yet</p>
          <p className="text-xs text-slate-400 mt-1">Run your first audit to see results here</p>
        </div>
        <a
          href="/audits/new"
          className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Run First Audit
        </a>
      </div>
    </div>
  );
}
```

### Verification
- Reload dashboard → Recent Activity shows 3 skeleton rows while loading
- After load with no audits → shows empty state with "Run First Audit" button
- After load with audits → shows real audit list

---

---

# Cross-Developer Notes

## Shared Utility: URL Routing Fixes

**All 3 developers** should be aware of these deprecated URLs still in code. If you encounter them during your tasks, fix them:

| Old URL | New URL | Where Found |
|---------|---------|------------|
| `/content-strategy` | `/content/analysis` | Various pages |
| `/content-strategy?view=drafts` | `/content/drafts` | StatCard href |
| `/content-strategy?view=calendar` | `/content/calendar` | StatCard href |
| `/auto-content` | `/content/auto-pilot` | header.tsx nav items |
| `/drafts` | `/content/drafts` | header.tsx nav items |
| `/calendar` | `/content/calendar` | header.tsx nav items |
| `/editor` | `/content/production` | header.tsx nav items |

> **Dev 2:** While doing sidebar work, also update `src/components/shared/header.tsx` nav items to point to the correct `/content/*` routes.

---

## Integration Points (No Conflicts)

These files are owned by ONE developer and should not be edited by others:

| File | Owned By |
|------|---------|
| `middleware.ts` | Dev 1 |
| `src/app/page.tsx` | Dev 1 |
| `src/components/ErrorBoundary.tsx` | Dev 1 |
| `src/components/layout/Sidebar.tsx` | Dev 2 |
| `src/components/layout/SidebarLayout.tsx` | Dev 1 (Task 1.5 only), Dev 2 (hands off after) |
| `src/components/shared/header.tsx` | Dev 2 |
| `src/app/dashboard/page.tsx` | Dev 3 |
| `src/components/dashboard/StatCard.tsx` | Dev 3 |
| `src/components/dashboard/ThingsToDo.tsx` | Dev 3 |
| `src/components/dashboard/NoDomainOnboarding.tsx` | Dev 3 |
| `src/components/dashboard/RecentActivity.tsx` | Dev 3 |

> ⚠️ `SidebarLayout.tsx` — Dev 1 finishes Task 1.5 first (router fix), then Dev 2 may read but not edit it. Communicate via PR before touching.

---

## Pull Request Checklist (All Devs)

Before submitting your PR:

- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All links/hrefs point to correct routes
- [ ] Tested on mobile viewport (375px wide)
- [ ] Tested in both light and dark mode
- [ ] No `console.log` left in production code (or marked with `// TODO`)
- [ ] Auth states tested: signed-in + signed-out
- [ ] No hardcoded `0` values where real data should appear

---

## Estimated Timeline

| Phase | Tasks | Duration |
|-------|-------|---------|
| **Phase 1 (Day 1 AM)** | Tasks 1.1, 1.2, 2.1, 3.1 | ~2 hrs each |
| **Phase 2 (Day 1 PM)** | Tasks 1.3, 1.4, 2.2, 3.2, 3.3 | ~2–3 hrs each |
| **Phase 3 (Day 2 AM)** | Tasks 1.5, 1.6, 2.3, 2.4, 3.4 | ~1.5–2 hrs each |
| **Phase 4 (Day 2 PM)** | Tasks 1.7, 2.5, 2.6, 2.7, 3.5, 3.6, 3.7 | ~1 hr each |
| **QA & Integration** | All devs review each other's work | ~2 hrs |

**Total: ~2 business days to complete all 23 issues**

---

*Document created: May 22, 2026 | SEO Hub Implementation Plan v1.0*

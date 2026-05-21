# SEO Hub — Parallel Implementation Plan (5 Developers)

**Date:** May 2026  
**Goal:** Complete all UI/UX improvements identified in `SAAS-UI-DETAILED-IMPROVEMENTS.md` in parallel across 5 developers with minimal merge conflicts.  
**Estimated Duration:** 3 sprints (6 weeks).  
**Source of Truth:** Design tokens defined by Developer 1 in Sprint 1, Day 1.

---

## Table of Contents

1. Team Structure & Ownership Map
2. Branching Strategy & Coordination Rules
3. Sprint Overview (3 Sprints × 5 Devs)
4. Developer 1 — Design System & Component Library
5. Developer 2 — Navigation, Layout & Routing
6. Developer 3 — Dashboard & History
7. Developer 4 — Content Strategy (Dashboard, Analysis, Quick Writer)
8. Developer 5 — Auto Pilot, Progress, Drafts, Calendar
9. Daily Sync & Integration Checkpoints
10. Definition of Done (Per Page)
11. Risk Register & Conflict Mitigation
12. Final Integration & QA Checklist

---

## 1. Team Structure & Ownership Map

| Dev | Primary Domain | Files / Folders Owned |
|---|---|---|
| **Dev 1** | Design System | `src/components/ui/**`, `tailwind.config.ts`, `src/lib/design-tokens.ts`, Storybook setup |
| **Dev 2** | Layout & Routing | `src/components/layout/**`, `middleware.ts`, `src/app/layout.tsx`, sidebar, topbar |
| **Dev 3** | Dashboard & History | `src/app/dashboard/**`, `src/app/history/**`, dashboard widgets |
| **Dev 4** | Content Strategy Core | `src/app/content-strategy/**` (dashboard/analysis/production sub-views), `src/components/content/ContentStrategyDashboardV2.tsx`, wizard components |
| **Dev 5** | Auto Pilot, Progress, Drafts, Calendar | `src/components/content/{AutoPilot,Progress,DraftsPanel,Calendar}*.tsx` |

### File-Level Conflict Avoidance
- **No two devs may edit the same file in the same sprint.** Coordinate via Slack/PR labels.
- Shared concerns (e.g., `globals.css`, `tailwind.config.ts`, root `layout.tsx`) are **owned by Dev 1 and Dev 2 only**.
- All other devs **import** from these but never edit them. If a change is needed → file a request issue → owner picks up.

---

## 2. Branching Strategy & Coordination Rules

### Branch Naming
```
feature/dev-1/design-system-foundation
feature/dev-2/sidebar-redesign
feature/dev-3/dashboard-empty-states
feature/dev-4/strategy-analysis-stepper
feature/dev-5/autopilot-custom-inputs
```

### Daily Workflow
1. Pull `main` every morning.
2. Rebase your feature branch on `main` before pushing.
3. Open draft PR within 24h of starting work (transparency).
4. Code review: minimum 1 approval from another dev.
5. **Dev 1 must approve any PR touching `src/components/ui/**`** to enforce design system consistency.

### Communication Channels
- `#seo-hub-frontend` — async standups, PR links
- Daily 15-min sync at 10:00 — blockers + handoffs only
- Weekly 30-min design review every Friday

### Blocking Rules
- Dev 3, 4, 5 **cannot start polishing pages** until Dev 1 has shipped the **Sprint 1 Day 3 deliverable** (core primitives: Button, Input, Alert, EmptyState, Skeleton).
- Dev 1 ships in **two waves** so others aren't blocked: Wave 1 (primitives) Day 3, Wave 2 (complex) Day 8.

---

## 3. Sprint Overview

### Sprint 1 — Foundations (Week 1–2)
| Dev | Focus |
|---|---|
| 1 | Tailwind tokens, primitives (Button, Input, Alert, EmptyState, Skeleton), Storybook |
| 2 | Sidebar redesign, topbar with breadcrumbs, mobile drawer, route consolidation |
| 3 | Dashboard skeleton + real `/dashboard` route polish (waits for Dev 1 primitives Day 3) |
| 4 | Remove duplicate horizontal sub-nav from Content Strategy, content audit |
| 5 | Progress page skeleton fix, Auto Pilot native-input replacement (after Dev 1 DatePicker) |

**Sprint 1 Goal:** P0 critical fixes shipped. App no longer feels broken.

### Sprint 2 — Polish & Empty States (Week 3–4)
| Dev | Focus |
|---|---|
| 1 | DataTable, DatePicker, NumberStepper, Stepper (horizontal), Tooltip, Toast |
| 2 | Domain switcher dropdown, command palette (`⌘K`), Sidebar active states polish |
| 3 | Dashboard empty states with illustrations, History data table with filters |
| 4 | Strategy Analysis horizontal stepper, Quick Writer alert banners, Brand Context inline edit |
| 5 | Drafts grid + bulk actions polish, Calendar grid view (FullCalendar), Auto Pilot stepper labels |

**Sprint 2 Goal:** P1 work complete. Premium look-and-feel established.

### Sprint 3 — Refinement & Hardening (Week 5–6)
| Dev | Focus |
|---|---|
| 1 | Dark mode parity, accessibility audit (axe), Storybook docs |
| 2 | Mobile responsive sweep, keyboard nav, skip links |
| 3 | "Things to do" activation widget, personalization (firstName, domain greeting) |
| 4 | Content Wizard onboarding flow, stat card delta indicators |
| 5 | Calendar drag-and-drop reschedule, Drafts list view toggle, Sync to Google Calendar |

**Sprint 3 Goal:** P2 work, performance, accessibility. Ship-ready.

---

## 4. Developer 1 — Design System & Component Library

### Mission
Build the visual foundation that every other dev depends on. **You are unblocking the team — speed and clarity matter more than feature breadth.**

### Sprint 1 (Week 1–2)

#### Day 1 — Design Tokens
- [ ] Create `src/lib/design-tokens.ts` exporting brand, semantic, neutral palettes.
- [ ] Update `tailwind.config.ts` with extended `colors`, `boxShadow`, `borderRadius` per audit appendix.
- [ ] Document tokens in `docs/design-tokens.md`.
- [ ] Open PR: `feature/dev-1/design-tokens`. **Merge by EOD.**

#### Day 2 — Storybook Setup
- [ ] `pnpm dlx storybook@latest init`
- [ ] Configure Tailwind in `.storybook/preview.tsx`.
- [ ] Add a "Tokens" story page rendering color swatches, type scale, shadows.
- [ ] CI: add `storybook:build` to GitHub Actions.

#### Day 3 — Primitives Wave 1 ⚠ **BLOCKING DELIVERABLE**
Build and ship in `src/components/ui/`:
- [ ] `Button.tsx` — variants: `primary`, `secondary`, `ghost`, `destructive`, `link`. Sizes: `sm`, `md`, `lg`. Supports loading state, icon, icon-only.
- [ ] `Input.tsx` + `FormField.tsx` wrapper (label, hint, error).
- [ ] `Alert.tsx` — variants: `info`, `success`, `warning`, `error`. Slots for title, description, actions.
- [ ] `Skeleton.tsx` — `<Skeleton className="h-4 w-32" />` primitive.
- [ ] `EmptyState.tsx` — illustration slot, title, description, primary/secondary action.
- [ ] `Badge.tsx` — variants: `default`, `success`, `warning`, `danger`, `muted`.

**Each component must:**
- Have a Storybook story.
- Use only design tokens (no hardcoded hex).
- Support `className` prop merging via `clsx` or `cn` utility.
- Include `forwardRef`.
- Pass keyboard + screen reader checks.

**Announce in `#seo-hub-frontend` when merged. Other devs unblock.**

#### Day 4–5 — Loading & Feedback
- [ ] `Spinner.tsx`
- [ ] `ProgressBar.tsx` (determinate + indeterminate)
- [ ] `Toast` — integrate `sonner`, wrap with brand styling. Document `toast.success/error/info`.
- [ ] Skeleton compositions: `<SkeletonCard />`, `<SkeletonTable />`, `<SkeletonStat />`.

#### Day 6–8 — Form Primitives Wave 2
- [ ] `Select.tsx` (Radix-based, with search).
- [ ] `Textarea.tsx`.
- [ ] `Checkbox.tsx`, `Switch.tsx`, `RadioGroup.tsx`.
- [ ] `DatePicker.tsx` — built on `react-day-picker`. Supports min/max, single/range.
- [ ] `TimePicker.tsx`.
- [ ] `NumberStepper.tsx` — `−` / `+` buttons, min/max, step, suffix.

#### Day 9–10 — Sprint 1 Wrap
- [ ] `Tooltip.tsx` (Radix).
- [ ] `Tabs.tsx` (Radix) with badge slot.
- [ ] Document migration guide: `docs/migrating-to-design-system.md` — show `before/after` snippets.
- [ ] Audit existing usage: grep for raw `<button>`, `<input>` and add to backlog for Devs 2–5.

### Sprint 2 (Week 3–4)
- [ ] `DataTable.tsx` — TanStack Table integration. Sort, filter, paginate, row selection.
- [ ] `Modal.tsx`, `Drawer.tsx`, `Sheet.tsx` (Radix Dialog).
- [ ] `Stepper.tsx` (horizontal, with labels, click-to-jump for completed steps).
- [ ] `StatCard.tsx` — value, label, delta, icon, trend.
- [ ] `FilterToolbar.tsx` — composable filter chips.
- [ ] `Combobox.tsx` (search + select).
- [ ] **Pair with Dev 5** on Calendar primitives if needed.

### Sprint 3 (Week 5–6)
- [ ] **Dark mode parity** — audit every component.
- [ ] **Accessibility audit** — run axe on Storybook. Fix all violations.
- [ ] **Visual regression** — Chromatic or Percy integration.
- [ ] **Documentation** — public Storybook deployed to `design.seohub.com`.
- [ ] **Bundle size audit** — tree-shake unused Radix.

### Definition of Done — Dev 1
- ✅ Every shipped component has a Storybook story.
- ✅ Zero hardcoded colors in `src/components/ui/`.
- ✅ All primitives pass axe + keyboard nav.
- ✅ Tokens documented and frozen by end of Sprint 1.

---

## 5. Developer 2 — Navigation, Layout & Routing

### Mission
Eliminate the navigation duplication. Build a sidebar + topbar that scales to mobile. Own the app's spatial structure.

### Sprint 1 (Week 1–2)

#### Day 1–2 — Audit & Plan
- [ ] Document all current sidebar entries with screenshots.
- [ ] Identify duplicate routes: two "History" entries, horizontal sub-nav inside `?view=` pages.
- [ ] Diagram new IA in `docs/information-architecture.md`:
   ```
   /dashboard
   /audits/new
   /audits (was /history?tab=audits)
   /content
     /dashboard
     /analysis
     /production
     /auto-pilot
     /progress
     /drafts
     /calendar
   /content/history (was /history?tab=content)
   /gbp-audit
   /settings
   ```

#### Day 3 — Sidebar Component
- [ ] Refactor `src/components/layout/SidebarLayout.tsx`.
- [ ] New `Sidebar.tsx` with sections:
   - Domain switcher (top)
   - Primary nav (Dashboard, Audit, Content)
   - Secondary nav (Settings, Help)
   - User menu (bottom)
- [ ] **Merge two History entries** into one top-level "History" route (Dev 3 will build the page).
- [ ] **Group Content sub-nav** with collapsible sections: Planning / Creation / Management.
- [ ] Hide "Quick Stats" widget when no domain selected (no more `--`).
- [ ] Active state styling per design system: `bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600`.

#### Day 4–5 — Topbar
- [ ] Build `Topbar.tsx`:
   - Breadcrumbs (auto-derived from route)
   - Global search button (opens command palette — wire-up in Sprint 2)
   - Notifications bell (placeholder)
   - Help icon → docs / Intercom
   - User avatar with menu
- [ ] Sticky positioning, blur backdrop on scroll.

#### Day 6–7 — Route Restructuring
- [ ] **Coordinate with Dev 4** before this work.
- [ ] Convert `/content-strategy?view=X` to proper Next.js routes `/content/[view]`.
- [ ] Update `middleware.ts`:
   - Authenticated users hitting `/` → redirect to `/dashboard`.
   - Public routes: `/`, `/sign-in`, `/sign-up`, `/audits/free` (public audit form).
- [ ] Update Clerk env vars: `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard`.

#### Day 8 — Mobile Drawer
- [ ] Sidebar collapses to hamburger menu < 768px.
- [ ] Slide-out drawer using Radix Sheet.
- [ ] Optional: bottom tab bar for top 4 actions on mobile.

#### Day 9–10 — Polish
- [ ] Sidebar collapse/expand animation.
- [ ] Keyboard nav: arrow keys move between items, Enter activates, Esc closes mobile drawer.
- [ ] Skip-to-content link.

### Sprint 2 (Week 3–4)

#### Command Palette
- [ ] Install `cmdk`.
- [ ] `<CommandPalette />` triggered by `⌘K` / `Ctrl+K`.
- [ ] Searchable: pages, recent audits, drafts, settings.
- [ ] Keyboard-first navigation.

#### Domain Switcher
- [ ] Replace text-stacked button with proper dropdown:
   - Selected domain shown with favicon
   - List of all user's domains
   - "Add new domain" action at bottom
   - Search if > 5 domains

#### Sidebar Polish
- [ ] Tooltips on collapsed sidebar items.
- [ ] Smooth color transitions.
- [ ] Persist collapsed state in `localStorage`.

### Sprint 3 (Week 5–6)
- [ ] Onboarding tour overlay (uses `react-joyride` or `intro.js`).
- [ ] Notifications panel (slide-out from bell icon).
- [ ] User menu enhancements: theme toggle, account settings, sign out.
- [ ] Final mobile QA across iOS Safari, Chrome Android.

### Definition of Done — Dev 2
- ✅ Single source of routing truth (no duplicate sub-nav).
- ✅ Sidebar fully keyboard accessible.
- ✅ Mobile drawer works flawlessly.
- ✅ Command palette surfaces all key actions.

---

## 6. Developer 3 — Dashboard & History

### Mission
Make the Dashboard the most useful page in the app. Turn History into a powerful data tool.

### Dependencies
- ⚠ **Blocked until Dev 1 ships primitives Day 3** (Button, Input, EmptyState, Skeleton).
- ⚠ **Blocked until Dev 2 ships new sidebar Day 3** (route changes).

### Sprint 1 (Week 1–2)

#### Day 1–2 — Read & Plan
- [ ] Read full audit (`SAAS-UI-DETAILED-IMPROVEMENTS.md` §4.1, §4.2, §4.3).
- [ ] Sketch new Dashboard layout in Figma / Excalidraw.
- [ ] List all data dependencies (API endpoints, hooks).

#### Day 3–4 — Dashboard Refactor
File: `src/app/dashboard/page.tsx`

- [ ] Personalize welcome: `Welcome back, {user.firstName}`.
- [ ] If no domain → render `<NoDomainOnboarding />` (full-screen card with domain input).
- [ ] If domain present:
   - Hero: large Quick Audit input at top with `Quick / Deep` toggle.
   - Stat row: 4 `<StatCard />` (Audits, SEO Score, Drafts, Scheduled) with deltas.
   - Two columns: `<RecentActivity />` + `<ThingsToDo />` widget.

#### Day 5 — Recent Activity
- [ ] `<RecentActivity />` component.
- [ ] Empty state with illustration + "Run your first audit" CTA.
- [ ] List view: last 5 audits with score badge, domain, date, action.

#### Day 6–7 — History Page (Audits)
File: `src/app/history/page.tsx` (or new `/audits` route per Dev 2).

- [ ] Remove duplicate top stat row (counts already in tabs).
- [ ] Tabs with badge counts: `<Tabs>All <Badge>{n}</Badge></Tabs>`.
- [ ] `<FilterToolbar />`: search, status, date range, domain.
- [ ] `<DataTable />` integration (waits on Dev 1 Sprint 2 component → use temporary table in Sprint 1).
- [ ] Empty state: contextual per active tab.

#### Day 8 — History Page (Content)
- [ ] Same DataTable, different columns: Pages Analyzed, Gaps Found, Topics.
- [ ] Tab-specific empty state.

#### Day 9–10 — Polish
- [ ] Sticky table headers.
- [ ] Row hover actions: View, Re-run, Delete (with confirm modal).
- [ ] CSV export button.
- [ ] Pagination at bottom.

### Sprint 2 (Week 3–4)

#### Empty States with Illustrations
- [ ] Source / commission line-art illustrations (unDraw, indigo accent).
- [ ] `<DashboardEmptyState />`, `<HistoryEmptyState />`, `<NoDomainEmptyState />`.
- [ ] Consistent visual treatment across all empty states.

#### Stat Cards with Deltas
- [ ] Use Dev 1's `<StatCard />` once shipped.
- [ ] API: fetch current period + previous period, calculate delta.
- [ ] Trend indicators (▲ green, ▼ red, → gray).
- [ ] Click → navigate to filtered History.

#### "Things to Do" Activation Widget
- [ ] List of activation milestones:
   - Add a website
   - Run first audit
   - Connect WordPress
   - Generate first AI article
   - Schedule first post
- [ ] Progress bar at top.
- [ ] Each item: checkbox (completed) or arrow (start now).
- [ ] Persist completion in DB (or derive from data).

### Sprint 3 (Week 5–6)
- [ ] Dashboard customization (drag-to-reorder widgets).
- [ ] Real-time stat updates via polling or websocket.
- [ ] History saved views ("Recent failed audits", "Top scoring pages").
- [ ] Bulk delete with confirm modal.

### Files Owned by Dev 3
```
src/app/dashboard/page.tsx
src/app/dashboard/components/*
src/app/history/page.tsx          (or src/app/audits/page.tsx after Dev 2's restructure)
src/components/dashboard/*
```

### Definition of Done — Dev 3
- ✅ No dashboard widget shows `--` ever.
- ✅ Empty states have illustrations + clear CTAs.
- ✅ History supports filter, search, sort, pagination.
- ✅ Personalization (firstName, domain) works.

---

## 7. Developer 4 — Content Strategy (Dashboard, Analysis, Quick Writer)

### Mission
Eliminate the duplicate sub-navigation. Make the Strategy Hub feel like a focused, modern wizard. Fix Quick Writer's broken alert UX.

### Dependencies
- ⚠ **Coordinate with Dev 2** on route restructuring (Day 6–7).
- ⚠ **Blocked until Dev 1 ships Alert + Stepper components.**

### Sprint 1 (Week 1–2)

#### Day 1–2 — Audit Existing Code
- [ ] Map every `?view=` query handler in `src/app/content-strategy/page.tsx`.
- [ ] Identify shared layout (gradient hero) — agree with Dev 2 on which is layout vs page-specific.
- [ ] List all components in `src/components/content/` that need refactor.

#### Day 3 — Remove Horizontal Sub-Navigation 🚨 **CRITICAL P0**
- [ ] Identify the duplicate horizontal tabs (`Dashboard | Analysis | Production | Auto Pilot | Progress`).
- [ ] Remove from every Content Strategy page.
- [ ] Verify sidebar is only nav source.
- [ ] **Single PR. Ship by EOD Day 3.**

#### Day 4 — Remove Marketing Hero Inside App
- [ ] Strip the gradient kicker (`✨ AI-Powered Content Strategy Platform`) from in-app pages.
- [ ] Strip the duplicated tagline (`Transform your website content with...`).
- [ ] Replace with simple page header: `<h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>`.
- [ ] Add domain context line: `Strategy for {domain}`.

#### Day 5–6 — Content Strategy Dashboard
File: `src/app/content-strategy/dashboard/page.tsx` (or post-Dev 2: `src/app/content/dashboard/page.tsx`).

- [ ] If no domain → render `<NoDomainOnboarding />` (reuse Dev 3's component).
- [ ] If domain → render:
   - Compact header (title + domain)
   - Stat cards: Pages Analyzed, Content Gaps, Drafts, Published.
   - Action cards: "Run analysis", "Generate content".
- [ ] Establish primary/secondary button hierarchy.

#### Day 7–8 — Quick Writer Alerts
File: `src/components/content/QuickWriter*.tsx`.

- [ ] Replace "WordPress Not Connected" heading with `<Alert variant="warning" />`.
- [ ] Replace "Failed to load discovery data" red text with `<Alert variant="error" />` containing recovery action.
- [ ] Convert "Target Locations" input + Add button into input group.
- [ ] Add tooltips to Auto/Manual toggle.
- [ ] Disabled "Generate AI Topics" should look disabled (gray, no gradient).

#### Day 9–10 — Brand Context Polish
- [ ] Reduce uppercase labels to `text-xs uppercase tracking-wide text-slate-500`.
- [ ] Add inline edit affordance (✏ icon on hover).
- [ ] Replace pastel-bordered cards with clean Slate-bordered cards.

### Sprint 2 (Week 3–4)

#### Strategy Analysis Stepper
- [ ] Convert vertical 6-step list into horizontal `<Stepper />` (Dev 1 component).
- [ ] Hide non-active step descriptions; only show current step's content.
- [ ] Show stat strip (Services, Locations, Pages) **only after** real analysis runs. Label cached data with timestamp.
- [ ] Tooltip on disabled "Start Analysis": "Enter a valid URL to begin".
- [ ] Move "How Our Content Wizard Works" marketing strip to a `?` help icon.

#### Brand Context Editing
- [ ] Build `<EditableField />` — click to edit, Tab/Esc to save/cancel.
- [ ] Persist edits via existing API.
- [ ] Toast on save success/error.

### Sprint 3 (Week 5–6)
- [ ] Content Wizard onboarding tour.
- [ ] Save & resume wizard state across sessions.
- [ ] AI streaming UI for topic generation.
- [ ] "Re-run analysis" button with confirmation.

### Files Owned by Dev 4
```
src/app/content-strategy/**
src/components/content/ContentStrategyDashboardV2.tsx
src/components/content/QuickWriter*.tsx
src/components/content/StrategyAnalysis*.tsx
src/components/content/BrandContext*.tsx
src/components/content/Wizard*.tsx
```

### Definition of Done — Dev 4
- ✅ No duplicate horizontal sub-nav anywhere.
- ✅ All errors/warnings use the `<Alert />` component.
- ✅ Strategy Analysis is a horizontal stepper.
- ✅ Brand Context is editable inline.

---

## 8. Developer 5 — Auto Pilot, Progress, Drafts, Calendar

### Mission
Replace native HTML inputs with branded components. Fix the Progress page's "Loading..." problem. Build a real Calendar grid view.

### Dependencies
- ⚠ **Auto Pilot work blocked on Dev 1's DatePicker, TimePicker, NumberStepper (Sprint 1 Day 8).**
- ⚠ **Calendar work coordinates with Dev 1 on FullCalendar styling tokens.**

### Sprint 1 (Week 1–2)

#### Day 1–2 — Progress Page Skeleton 🚨 **CRITICAL P0**
File: `src/app/content-strategy/progress/page.tsx` or current view handler.

- [ ] Replace `Loading...` text with structured skeleton matching final layout.
- [ ] Add error boundary: if API fails → show retry CTA.
- [ ] Add timeout: if > 10s → show "Taking longer than usual" message.
- [ ] **Ship by EOD Day 2.**

#### Day 3–4 — Auto Pilot Layout Cleanup
File: `src/components/content/AutoPilot*.tsx`.

- [ ] Improve 3-step plugin install card: distinct rows, clear CTAs.
- [ ] Label the top stepper (1️⃣ Conn, 2️⃣ Sched, 3️⃣ Topics, 4️⃣ Loc, 5️⃣ Review, 6️⃣ Launch).
- [ ] Pair Back/Continue properly with `border-t pt-6 mt-8`.

#### Day 5–7 — Replace Native Inputs (after Dev 1 Day 8)
- [ ] Native `<input type="date">` → Dev 1's `<DatePicker />`.
- [ ] Native `<input type="time">` → Dev 1's `<TimePicker />`.
- [ ] Native number spinbuttons → Dev 1's `<NumberStepper />`.
- [ ] Auto-calc: setting "Total Posts" derives "Posts Per Day" and vice versa.

#### Day 8–9 — Drafts Empty State + Bulk Actions
File: `src/components/content/DraftsPanel.tsx`.

- [ ] Replace generic empty state with rich version:
   - Blurred ghost grid behind overlay
   - "Pick a website to see drafts, or create your first one →"
- [ ] Verify existing bulk actions implementation (selection, select all, bulk delete) per design system.
- [ ] Add bulk schedule, bulk publish actions.
- [ ] Sticky bulk action toolbar.

#### Day 10 — Calendar Empty State
File: `src/components/content/CalendarView*.tsx`.

- [ ] Same blurred preview pattern.
- [ ] "Select a website to see scheduled and published content."

### Sprint 2 (Week 3–4)

#### Real Calendar Grid (FullCalendar)
- [ ] Install `@fullcalendar/react` + `@fullcalendar/daygrid` + `@fullcalendar/timegrid`.
- [ ] Build `<ContentCalendar />`:
   - Month / Week / Day toggle in top-right
   - Color-coded events:
     - Slate: Draft
     - Indigo: Scheduled
     - Emerald: Published
     - Red: Failed
   - Click event → opens detail drawer
   - Click empty date → quick-add modal
- [ ] Theme FullCalendar to match design tokens (override CSS vars).

#### Drafts Grid Polish
- [ ] Card structure: cover image, title (2-line truncate), status badge, word count, est. read time, created date.
- [ ] Hover actions: Edit, Schedule, Delete.
- [ ] List view toggle: grid ⇄ list.
- [ ] Search + status filter.

#### Auto Pilot Final Polish
- [ ] Visual schedule preview (mini calendar showing posting days).
- [ ] Validation: prevent end date before start date.
- [ ] Save draft schedule (resume later).

### Sprint 3 (Week 5–6)

#### Calendar Drag-and-Drop
- [ ] Enable FullCalendar's `editable: true`.
- [ ] On drop: confirm modal "Reschedule from X to Y?"
- [ ] API call to update post's scheduled date.
- [ ] Optimistic UI with rollback on error.

#### Calendar Sync
- [ ] "Sync to Google Calendar" / "Sync to Outlook" — generate `.ics` feed URL.
- [ ] Settings: choose which event types to sync.

#### Drafts Advanced
- [ ] Tag system for drafts.
- [ ] Folders / collections.
- [ ] Sort: by date, by title, by status, by word count.

### Files Owned by Dev 5
```
src/app/content-strategy/progress/page.tsx
src/components/content/AutoPilot*.tsx
src/components/content/Progress*.tsx
src/components/content/DraftsPanel.tsx
src/components/content/CalendarView*.tsx
src/components/content/CalendarEvent*.tsx
```

### Definition of Done — Dev 5
- ✅ No native HTML date/time/number inputs in Auto Pilot.
- ✅ Progress page never shows raw "Loading..." text.
- ✅ Calendar is a real grid with drag-and-drop.
- ✅ Drafts has bulk actions + grid/list toggle.

---

## 9. Daily Sync & Integration Checkpoints

### Daily Standup (15 min, 10:00)
Format per dev:
1. **Yesterday:** PRs merged, work shipped.
2. **Today:** Goal.
3. **Blockers:** Especially component dependencies.
4. **Handoffs:** "I shipped X, Dev Y can now proceed."

### Integration Checkpoints

| Day | Checkpoint | Owner |
|---|---|---|
| Sprint 1 Day 3 | Dev 1 ships primitives Wave 1 | Dev 1 → unblocks 3, 4, 5 |
| Sprint 1 Day 3 | Dev 4 removes duplicate sub-nav | Dev 4 → unblocks visual cohesion |
| Sprint 1 Day 3 | Dev 2 ships new Sidebar | Dev 2 → unblocks Dev 3 |
| Sprint 1 Day 8 | Dev 1 ships DatePicker, NumberStepper | Dev 1 → unblocks Dev 5 |
| Sprint 1 Day 10 | Sprint 1 demo | All |
| Sprint 2 Day 5 | Dev 1 ships DataTable, Stepper | Dev 1 → unblocks Devs 3, 4 |
| Sprint 2 Day 10 | Sprint 2 demo | All |
| Sprint 3 Day 10 | Final integration & QA | All |

### Friday Design Review (30 min)
- Show & tell: each dev demos their week's work.
- Design alignment check.
- Prioritize next week.

---

## 10. Definition of Done — Per Page

A page is "Done" when:

- [ ] Uses only design system components (no raw HTML inputs/buttons).
- [ ] Has appropriate empty states with illustrations + CTAs.
- [ ] Has skeleton loaders matching final layout.
- [ ] Has error states for failed API calls.
- [ ] Passes axe accessibility audit (zero critical/serious).
- [ ] Keyboard-only navigation works end-to-end.
- [ ] Responsive: works at 375px, 768px, 1024px, 1440px.
- [ ] Dark mode parity.
- [ ] No `--` or `0` values shown without context.
- [ ] All copy passes microcopy review (second person, action-led).
- [ ] Lighthouse score: Performance ≥ 90, Accessibility ≥ 95.

---

## 11. Risk Register & Conflict Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Dev 1 falls behind, blocks team | Medium | High | Wave 1 primitives by Day 3 non-negotiable. Dev 1 has buffer in Sprint 3. |
| Multiple devs edit `globals.css` | High | Medium | Only Dev 1 + Dev 2 may touch globals. Others file requests. |
| Dev 2 route restructure breaks pages | Medium | High | Dev 2 lands routing changes behind feature flag. Devs test in parallel. |
| API changes mid-sprint | Low | High | Lock API contracts in Sprint 0. Use mocks if backend lags. |
| Storybook not maintained | High | Low | CI fails if components ship without stories. Dev 1 enforces. |
| Component naming drift (e.g., `Btn` vs `Button`) | Medium | Medium | Dev 1 owns naming registry in `docs/component-registry.md`. |
| Visual regressions sneak in | Medium | High | Chromatic / Percy on PRs from Sprint 2 onwards. |
| Dev 4 + Dev 2 conflict on routing | High | Medium | Joint planning Day 1. Dev 2 ships routing first; Dev 4 migrates pages second. |

---

## 12. Final Integration & QA Checklist (Sprint 3 Last 3 Days)

### Code Freeze — Sprint 3 Day 8
After this point, only bug fixes, no new features.

### QA Pass — Sprint 3 Day 8–9
- [ ] Click every sidebar item → verify correct route, no errors.
- [ ] Run a full audit end-to-end.
- [ ] Generate a draft via Quick Writer.
- [ ] Set up an Auto Pilot schedule.
- [ ] View Calendar, drag a post to reschedule.
- [ ] Mobile pass: iOS Safari, Chrome Android.
- [ ] Dark mode pass.
- [ ] Accessibility pass: NVDA / VoiceOver.
- [ ] Performance pass: Lighthouse on all pages.

### Documentation — Sprint 3 Day 10
- [ ] Update `README.md` with new structure.
- [ ] Update `docs/design-tokens.md`.
- [ ] Update `docs/component-registry.md`.
- [ ] Storybook deployed to staging URL.
- [ ] Migration notes for any breaking changes.

### Launch — Sprint 3 Day 10
- [ ] Merge to `main`.
- [ ] Deploy to staging.
- [ ] Smoke test on staging.
- [ ] Deploy to production.
- [ ] Monitor Sentry / logs for 24h.

---

## Appendix A — Quick Assignment Card (Print This)

```
┌──────────────────────────────────────────────────────────────┐
│  Dev 1: DESIGN SYSTEM                                        │
│  Owns:   src/components/ui/, tailwind.config, Storybook      │
│  Sprint 1: Tokens + Primitives Wave 1 + Wave 2               │
│  Sprint 2: DataTable, DatePicker, Stepper, StatCard, Modal   │
│  Sprint 3: Dark mode, A11y audit, Visual regression          │
│  Critical Deliverable: Day 3 primitives → unblocks team      │
├──────────────────────────────────────────────────────────────┤
│  Dev 2: NAVIGATION & LAYOUT                                  │
│  Owns:   src/components/layout/, middleware, root layout     │
│  Sprint 1: Sidebar redesign, Topbar, Routing restructure     │
│  Sprint 2: Command palette, Domain switcher, Mobile drawer   │
│  Sprint 3: Onboarding tour, Notifications, Mobile QA         │
│  Critical Deliverable: Day 3 new sidebar, Day 7 routing      │
├──────────────────────────────────────────────────────────────┤
│  Dev 3: DASHBOARD & HISTORY                                  │
│  Owns:   src/app/dashboard/, src/app/history/                │
│  Sprint 1: Dashboard refactor, History filters + table       │
│  Sprint 2: Empty states, StatCards, Things-to-do widget      │
│  Sprint 3: Customization, Real-time updates, Saved views     │
│  Blocked until: Dev 1 Day 3, Dev 2 Day 3                     │
├──────────────────────────────────────────────────────────────┤
│  Dev 4: CONTENT STRATEGY (Core)                              │
│  Owns:   src/app/content-strategy/, ContentStrategyV2,       │
│          QuickWriter, BrandContext, Wizard                   │
│  Sprint 1: Remove sub-nav, Strip marketing hero, Alerts      │
│  Sprint 2: Horizontal Stepper, Inline edit, Tooltips         │
│  Sprint 3: Wizard onboarding, AI streaming, Re-run flow      │
│  Critical Deliverable: Day 3 sub-nav removal                 │
├──────────────────────────────────────────────────────────────┤
│  Dev 5: AUTO PILOT, PROGRESS, DRAFTS, CALENDAR               │
│  Owns:   AutoPilot, Progress, DraftsPanel, CalendarView      │
│  Sprint 1: Progress skeleton, Auto Pilot inputs, empty states│
│  Sprint 2: FullCalendar grid, Drafts polish                  │
│  Sprint 3: Drag-and-drop reschedule, Calendar sync           │
│  Critical Deliverable: Day 2 Progress skeleton fix           │
└──────────────────────────────────────────────────────────────┘
```

---

## Appendix B — Sprint 1 Day-by-Day Gantt

```
        Day1 Day2 Day3 Day4 Day5 Day6 Day7 Day8 Day9 Day10
Dev1    ████ ████ ★PRM ████ ████ ████ ████ ★FRM ████ ████
Dev2    ████ ████ ★SBR ████ ████ ████ ████ ████ ████ ████
Dev3    ████ ████ ▒▒▒▒ ████ ████ ████ ████ ████ ████ ████
Dev4    ████ ████ ★NAV ████ ████ ████ ████ ████ ████ ████
Dev5    ████ ★PRG ▒▒▒▒ ████ ████ ████ ████ ████ ████ ████

Legend:
  ★ = Critical milestone delivery
  ▒ = Soft-blocked (can start prep/planning)
  █ = Active development
  PRM = Primitives Wave 1
  FRM = Form Primitives (DatePicker, NumberStepper)
  SBR = New Sidebar
  NAV = Sub-nav removal
  PRG = Progress page skeleton fix
```

---

**Final Note:**
This plan is designed for **5 developers working 6 weeks in parallel**. The biggest leverage point is Dev 1's primitives by Day 3 — protect that delivery at all costs. If Dev 1 slips, the whole team slows. Pair-program if needed.

Ship fast. Ship together.

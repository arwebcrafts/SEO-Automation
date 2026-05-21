# Information Architecture Audit

## Current State

### Duplicate Routes Identified

1. **History appears twice**:
   - Audit section: `/history?tab=audits`
   - Content section: `/history?tab=content`

2. **Query parameter routing** (needs conversion to proper Next.js routes):
   - `/content-strategy?view=dashboard` → `/content/dashboard`
   - `/content-strategy?view=analysis` → `/content/analysis`
   - `/content-strategy?view=production` → `/content/production`
   - `/content-strategy?view=auto-pilot` → `/content/auto-pilot`
   - `/content-strategy?view=progress` → `/content/progress`
   - `/content-strategy?view=drafts` → `/content/drafts`
   - `/content-strategy?view=calendar` → `/content/calendar`

### Current Sidebar Structure

**Audit Section:**
- New Audit → `/`
- History → `/history?tab=audits`

**Content Section:**
- Dashboard → `/content-strategy?view=dashboard`
- Strategy Hub → `/content-strategy?view=analysis`
- Quick Writer → `/content-strategy?view=production`
- Auto Pilot → `/content-strategy?view=auto-pilot` (badge: "New")
- Progress → `/content-strategy?view=progress`
- Drafts → `/content-strategy?view=drafts`
- Calendar → `/content-strategy?view=calendar`
- History → `/history?tab=content` ⚠️ DUPLICATE

### Current TopHeader Features
- Client switcher (agency users only)
- Agency tab (agency users only)
- Admin tab (admin users only)
- User button (Clerk)

**Missing Features:**
- Breadcrumbs
- Global search button (command palette)
- Notifications bell
- Help icon

---

## Proposed New Information Architecture

### Route Structure
```
/                          → Landing page (redirect to /dashboard if authenticated)
/dashboard                 → Main dashboard
/audits/new               → New audit form
/audits                   → Audit history (was /history?tab=audits)
/content
  /dashboard              → Content strategy dashboard
  /analysis               → Strategy analysis (was /content-strategy?view=analysis)
  /production             → Quick Writer (was /content-strategy?view=production)
  /auto-pilot             → Auto Pilot scheduler
  /progress               → Progress tracking
  /drafts                 → Drafts management
  /calendar               → Content calendar
/content/history          → Content history (was /history?tab=content)
/gbp-audit                → Google Business Profile audit
/settings                 → Settings
```

### New Sidebar Structure

**Domain Switcher** (top)
- Selected domain with favicon
- "Add new domain" action

**Primary Navigation:**
- Dashboard → `/dashboard`
- Audit → `/audits/new`
- Content (collapsible section)
  - Dashboard → `/content/dashboard`
  - Strategy Hub → `/content/analysis`
  - Quick Writer → `/content/production`
  - Auto Pilot → `/content/auto-pilot`
  - Progress → `/content/progress`
  - Drafts → `/content/drafts`
  - Calendar → `/content/calendar`

**Secondary Navigation:**
- History → `/audits` (unified history page with tabs)
- Settings → `/settings`

**User Menu** (bottom)
- Theme toggle
- Account settings
- Help / Docs
- Sign out

### Changes Required

1. **Merge History routes**: Combine `/history?tab=audits` and `/history?tab=content` into single `/audits` route with tab switching
2. **Convert query params**: Create proper Next.js route structure for content strategy views
3. **Remove horizontal sub-nav**: Content Strategy pages currently have duplicate horizontal tabs (Dev 4 responsibility)
4. **Add missing TopHeader features**: Breadcrumbs, search, notifications, help
5. **Improve domain switcher**: Replace current button with proper dropdown

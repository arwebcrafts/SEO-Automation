# Content Strategy Pages — UI/UX Improvement Plan
**Product:** https://seo-try.vercel.app  
**Pages in Scope:** Dashboard · Analysis · Production · Auto Pilot · Progress  
**Date:** May 2026  

---

## Overall UX Problems (All Pages)

### 1. Navigation Between Views is Hidden
**Problem:** The five views (dashboard, analysis, production, auto-pilot, progress) are only accessible via `?view=` URL params. There is no persistent tab/sidebar navigation visible to the user.  
**Fix:** Add a horizontal tab bar or a left-sidebar step indicator that is always visible on the content strategy section, showing all five views with icons and the current active state highlighted.

```
[ 📊 Dashboard ] [ 🔍 Analysis ] [ ✍️ Production ] [ 🤖 Auto Pilot ] [ 📈 Progress ]
```

### 2. Empty States Feel Like Broken Pages
**Problem:** "Pages Analyzed: 0", "No scheduled posts found" — the page looks empty and confusing to new users.  
**Fix:** Replace empty states with:
- Illustrated empty state (SVG icon + headline + CTA button)
- Example: "No content analyzed yet → Enter your website URL to start"
- Show a quick-start checklist the first time a user lands on the page

### 3. No Onboarding Flow
**Problem:** Users land on a complex multi-view platform with no guidance.  
**Fix:** Add a 4-step setup wizard when a user first enters Content Strategy:
1. Enter website URL (auto-crawl)
2. Confirm brand tone & audience (pre-filled from AI crawl)
3. Connect WordPress (optional)
4. Run first analysis → land on Dashboard with real data

---

## Page-by-Page UI Improvements

---

### Dashboard (`?view=dashboard`)

#### A. SEO Health Score — Make it Dynamic & Visual
**Current:** Static "45/100 — Needs Work" text block.  
**Improved:**
- Large circular gauge (SVG/Chart.js) with color zones (0–40 red, 41–70 amber, 71–100 green)
- Score animates on load (count-up effect)
- Below gauge: 3 top action items in a "Fix These First" list
- Score breakdown by category (Content, Keywords, Structure, E-E-A-T) in a horizontal bar

#### B. Stats Row — Add Trend Indicators
**Current:** 4 stat cards (Pages, Words, Keywords, Gaps) with no trend.  
**Improved:**
- Each card gets a mini sparkline (7-day trend)
- Green up-arrow / red down-arrow next to the number
- Hover tooltip: "vs. last week"

#### C. Content Gaps — Richer Cards
**Current:** Plain text list with priority badge.  
**Improved:** Each gap card should show:
- Priority badge (color-coded)
- Estimated monthly search volume (e.g. "~2,400 searches/mo")
- Competitor that ranks for it (e.g. "Ahrefs ranks #1")
- Two CTAs: "Draft Article" (primary) and "Add to Calendar" (secondary)
- Expand arrow to see full brief before drafting

#### D. AI Content Suggestions — Grid Layout
**Current:** Single suggestion card with small text.  
**Improved:**
- 2-column card grid for suggestions
- Each card: title, estimated word count, topic tags (colored pills), difficulty badge, "Generate" CTA
- "Load More Suggestions" button at the bottom
- Filter bar: All | Blog Post | Pillar Page | FAQ | Case Study | Location Page

#### E. Add a "Quick Actions" Bar
Position between the health score and stats:  
```
[ + New Article ] [ 🔍 Find Gaps ] [ 📅 Schedule Month ] [ 📊 View Rankings ]
```

---

### Analysis (`?view=analysis`)

#### A. Split Layout — Two-Pane Design
**Current:** Stacked single-column blocks.  
**Improved:** Side-by-side layout:
- Left panel (40%): Navigation tree — Keywords | Gaps | Competitors | E-E-A-T | Internal Links
- Right panel (60%): Detail view for selected item
- Allows faster scanning without scrolling

#### B. Keywords Table — Replace Cards with Sortable Table
**Current:** 3 keyword cards with Found/Priority info.  
**Improved:**

| Keyword | Volume | Difficulty | Rank | Pages Found | Status |
|---|---|---|---|---|---|
| AI Automation | 2,400/mo | 45 | #12 | 12 pages | Tracking |
| Healthcare Data | 880/mo | 38 | Not ranking | 5 pages | Gap |
| Computer Vision | 1,200/mo | 52 | #8 | 4 pages | Tracking |

- Sortable columns
- Row click → drawer opens with keyword details + top 10 SERP competitors
- "Track This Keyword" toggle per row

#### C. Topical Authority Map — New Visual Section
**Position:** Above Content Gaps  
**What it shows:**
- Pillar topic circles with connected subtopic nodes
- Green = published, Orange = in draft, Red = not written
- Legend bar at top
- Click any node → opens brief/draft view
- "Build Complete Cluster" button on each pillar

#### D. Writing Style Analysis — Actionable Panel
**Current:** Shows Dominant Tone / Formality / Perspective as static text.  
**Improved:**
- Side-by-side comparison: "Your Brand Voice" vs "Recommended for [Industry]"
- Gauge bars showing formality, sentiment, reading level
- "Improve Tone" button that pre-configures AI tone when generating content

#### E. Competitor Gap Section — New Addition
- Input: "Add competitor domain"
- Table showing: competitor's topics you're missing, their estimated traffic, difficulty
- "Draft Article" button next to each competitor topic

---

### Production (`?view=production`)

#### A. Redesign as a Step Wizard (not a long form)
**Current:** Long scrollable form — Service selection → Locations → Brand Context.  
**Improved:** Step-by-step wizard UI:

```
Step 1: Pick Topic/Service → Step 2: Keyword Research → Step 3: Brief → Step 4: Generate → Step 5: Review
```

Each step has a compact form, progress bar at top, and "Next →" button.

#### B. Topic Selection — Visual Service Grid
**Current:** Dropdown "Select Service to Generate Topics".  
**Improved:**
- Card grid of detected services, each with icon
- Multi-select allowed
- Below services: manual topic input option with "+ Custom Topic"
- Keyword suggestions appear as user hovers over a service card (popover)

#### C. Content Brief Card — Show Before Generation
After Step 2 (keyword selection), before AI generation starts, show:
- Suggested word count range (e.g., "1,200–1,800 words")
- Auto-generated H2 outline (editable inline)
- NLP terms checklist (user can check/uncheck)
- "People Also Ask" questions to cover
- Internal link suggestions from existing content
- Estimated time to write: "~15 min with AI"

#### D. Real-Time Content Editor Panel
After generation, show a split view:
- Left: Editable article content (rich text editor)
- Right: Live SEO score widget
  - Word count progress bar
  - Keyword density indicator
  - NLP terms coverage list (green checkmarks as terms are used)
  - Readability score
  - Internal links counter

#### E. Featured Image Generator — Visible CTA
**Current:** Mentioned in page title but no visible UI.  
**Improved:**
- At bottom of editor: "Generate Featured Image" button
- Shows 4 generated image options in a 2×2 grid
- User picks one → auto-set as WordPress featured image
- Alt text auto-generated from article title + primary keyword

---

### Auto Pilot (`?view=auto-pilot`)

#### A. Status Banner — More Prominent
**Current:** Small "WordPress Not Connected" notice.  
**Improved:**
- If WordPress not connected: full-width amber warning banner with step-by-step connection guide
- If connected: green success banner with site name + "Last synced: X minutes ago"
- Connection health indicator (last ping time)

#### B. Schedule Configuration — Visual Calendar Picker
**Current:** Plain form with Posts Per Day, Total Posts, Start Date inputs.  
**Improved:**
- Monthly calendar grid that the user fills in
- Click a day to add/remove a post slot
- Color-coded by content type
- Drag between days to reschedule
- Below calendar: summary "30 posts planned, 6 Mondays, 4 Fridays..."

#### C. Content Mix Configuration
**Add this section (currently missing):**

| Content Type | % of Posts | Count |
|---|---|---|
| Blog Post | 50% | 15 |
| Pillar Page | 10% | 3 |
| FAQ Article | 20% | 6 |
| Case Study | 10% | 3 |
| Location Page | 10% | 3 |

Sliders for each type, total always = 100%.

#### D. Review Mode Toggle
- "Auto-publish" vs "Review before publish" radio buttons  
- If "Review": posts appear in Progress page with "Approve / Edit / Reject" actions before going live

#### E. Auto Pilot Run Preview
Before confirming the run, show a preview table:

| # | Date | Title (AI Preview) | Type | Status |
|---|---|---|---|---|
| 1 | May 21 | "5 Risks of AI in Supply Chains" | Blog | Pending Generation |
| 2 | May 23 | "Computer Vision in Healthcare" | Blog | Pending Generation |
| … | … | … | … | … |

"Confirm & Start Auto Pilot" button at bottom.

---

### Progress (`?view=progress`)

#### A. Stats Row — Richer Metrics
**Current:** 4 plain number boxes (Total / Pending / Published / Failed).  
**Improved:**
- Each stat card is clickable to filter the table below
- Add: "Ranking" (posts with a tracked keyword rank) and "Traffic" (posts with GSC data)
- Color-code: Published = green, Pending = amber, Failed = red

#### B. Posts Table — Full Data Columns
**Current:** "No scheduled posts found" (empty).  
**Improved when populated:**

| Title | Type | Scheduled | Status | SEO Score | Rank | Clicks | Actions |
|---|---|---|---|---|---|---|---|
| "5 Risks of AI..." | Blog | May 21 | Published | 87/100 | #14 | 120 | View · Edit · Refresh |
| "Computer Vision..." | Blog | May 23 | Pending | — | — | — | Preview · Approve · Cancel |

- Sortable by any column
- Bulk actions: Approve All, Delete Selected, Reschedule Selected
- Search/filter bar above table

#### C. Per-Post Detail Drawer
Click any post row → right-side drawer opens with:
- Full article preview
- SEO score breakdown
- Keyword rank history (sparkline)
- GSC data (clicks, impressions, CTR, avg position)
- "Refresh & Republish" button (regenerate with latest SEO data)
- "Repurpose" button → opens repurposing modal

#### D. Performance Overview Chart
Above the table, a line chart showing (last 30 days):
- Total organic clicks from all published posts
- Number of keywords ranking in Top 10
- New posts published

Three toggle buttons: "Traffic" | "Rankings" | "Published"

#### E. "Needs Attention" Alert Row
Pinned at top of table (if applicable):
- Red badge: "3 posts failed to publish" → click to see errors
- Orange badge: "5 posts ranking #11–20 could be improved" → click to see quick-win list
- Blue badge: "2 posts ready for review" → click to approve

---

## Global Design System Improvements

### Color Palette Suggestions
| Token | Current | Recommended |
|---|---|---|
| Primary action | Blue | Keep but define consistent shade: `#3B82F6` |
| Success | Green | `#22C55E` |
| Warning | — | Add: `#F59E0B` |
| Danger | Red | `#EF4444` |
| Surface cards | White | Slight warm tint: `#FAFAF9` for depth |
| Score gauge | Static text | Dynamic color from red→amber→green |

### Typography Hierarchy
- Section headings: `text-xl font-semibold` (current seems inconsistent)
- Stats numbers: `text-3xl font-bold tabular-nums` — use tabular-nums so digits don't jump
- Labels: `text-xs text-muted-foreground uppercase tracking-wide`
- Ensure line height on cards doesn't collapse when content is long

### Component Library Recommendations
Use shadcn/ui components already in the stack:
- `<Tabs>` for page navigation
- `<DataTable>` (TanStack Table) for keywords and posts tables
- `<Dialog>` for content brief preview and post detail drawer
- `<Progress>` for SEO score bars
- `<Badge>` for priority labels (High = red, Medium = amber, Low = green)
- `<Calendar>` (already in shadcn) for content calendar
- `<Sheet>` (right-side drawer) for per-post details

### Micro-interactions
- Score number: animate count-up on first render
- Content brief: slide-in from right when clicking "Draft Article"
- Post row: expand in-place on click (accordion) before opening drawer
- Generating state: show streaming text animation (not just a spinner)
- Calendar drag: smooth snap-to-date animation

### Mobile Responsiveness
Currently the pages are not optimized for mobile. Priority fixes:
- Stack two-column layouts to single column below `md`
- Collapse the stats row to a 2×2 grid on mobile
- Convert sortable table to card-list on mobile
- Bottom navigation bar on mobile for the five views

### Accessibility
- Add `aria-label` to all icon-only buttons
- Ensure color-coded badges also use an icon (not just color) for color-blind users
- Focus ring visible on all interactive elements
- Announce live score changes to screen readers using `aria-live`

---

## Quick-Win UI Changes (< 1 day each)

1. **Add view navigation tabs** — most impactful single change
2. **Replace empty states** with illustrated onboarding prompts
3. **Keyword cards → sortable table** in Analysis
4. **"Draft Article" → show brief first** before generation
5. **WordPress connection banner** — make it prominent and actionable
6. **Content type filter bar** on AI suggestions list
7. **Score gauge** instead of plain "45/100" text
8. **Trend arrows** on all stat cards
9. **"Confirm before auto-pilot run"** preview table
10. **"Needs Attention" alert strip** at top of Progress table

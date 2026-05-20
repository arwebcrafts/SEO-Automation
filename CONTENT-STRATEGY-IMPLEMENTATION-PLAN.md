# Content Strategy Pages — Implementation Plan
**Product:** https://seo-try.vercel.app  
**Pages in Scope:** Dashboard · Analysis · Production · Auto Pilot · Progress  
**Date:** May 2026  

---

## Executive Summary

After auditing all five Content Strategy pages and benchmarking against Semrush, Ahrefs, Surfer SEO, SearchAtlas, and emerging AI-SEO tools, the product has a solid foundation but is missing 15+ high-demand features that competitors now treat as table-stakes. The gaps fall into four buckets:

1. **Depth of keyword/topic intelligence** — no topical authority maps or keyword clusters
2. **Real-time content optimization** — no NLP editor, content score, or SERP-driven brief
3. **Performance & ROI visibility** — no GSC integration, GA4 integration, or traffic attribution
4. **Content operations** — no visual calendar, internal linking, repurposing, or social distribution  

---

## Gap Analysis by Page

### Dashboard (`?view=dashboard`)
| Current State | Missing vs Competitors |
|---|---|
| SEO Health Score (static 45/100) | Live score updates when content is published |
| 3 hardcoded content gaps | Competitor-driven gap discovery |
| Priority Matrix (static) | Dynamic priority based on content gaps |
| 1 AI content suggestion | 20–50 suggestions with content type recommendations |
| No traffic data | GSC / Analytics impressions & clicks |

### Analysis (`?view=analysis`)
| Current State | Missing vs Competitors |
|---|---|
| Keywords found on pages | Keyword search volume, difficulty, CPC |
| Content Gaps list | Topical Authority / Pillar-Cluster map |
| Writing style analysis | E-E-A-T scoring with actionable fixes |
| No SERP data | SERP competitor comparison per keyword |
| No NLP analysis | NLP term recommendations |
| No internal link map | Internal linking opportunity finder |

### Production (`?view=production`)
| Current State | Missing vs Competitors |
|---|---|
| Service selection for topics | Keyword cluster-based topic generation |
| Brand context form | Content brief with word count, headings, NLP terms, questions |
| No content editor | Real-time SEO score while writing (Content Editor) |
| No image generation visible | AI featured image + alt text generation |
| Location targeting (empty) | Local SEO content integration with city/region pages |

### Auto Pilot (`?view=auto-pilot`)
| Current State | Missing vs Competitors |
|---|---|
| Schedule setup (frequency) | Content calendar with visual drag-and-drop |
| WordPress connected/not status | WordPress publishing only |
| Posts per day / start date | Content type mix (blog, pillar, FAQ, case study) |
| No review queue | Human-in-the-loop review before publish |
| No SEO pre-check | Auto-validate content score before publishing |

### Progress (`?view=progress`)
| Current State | Missing vs Competitors |
|---|---|
| Total / Pending / Published / Failed | Post performance (clicks, impressions from GSC) |
| No post details | Post performance (clicks, impressions from GSC) |
| No content score column | Content quality score per published piece |
| No ROI view | Traffic attribution: which posts drove conversions |
| No A/B testing | Title/meta A/B test results |
| No republish flow | "Refresh & Republish" for underperforming posts |

---

## Implementation Plan (Prioritized)

### Phase 1 — Quick Wins (2–4 weeks)

#### 1.1 Competitor Content Gap
**Affects:** Analysis, Dashboard  
**What to build:**
- Input field: "Enter 1–3 competitor domains"
- Crawl competitor sitemaps → extract their top topics
- Diff against user's crawled pages → surface gaps
- Show gap list with competitor's topic coverage

**Priority:** HIGH — users cite this as #1 missing feature in competitor comparisons

#### 1.2 Content Brief Generator
**Affects:** Production  
**What to build:**
- When clicking "Draft Article", first show a structured brief:
  - Recommended word count range (based on content type)
  - Suggested H1 / H2 / H3 outline
  - NLP terms to include (extracted from existing content)
  - Questions to answer
  - Internal links to include
  - Target keyword + 3–5 semantic variants
- Brief is editable before AI generation begins

#### 1.4 Human Review Queue (Auto Pilot)
**Affects:** Auto Pilot, Progress  
**What to build:**
- Add "Require review before publish" toggle in Auto Pilot config
- Generated posts land in a "Review" state in Progress page
- User can preview, edit, approve, or reject each post
- Approved posts publish at their scheduled time

---

### Phase 2 — High-Value Features (4–8 weeks)

#### 2.1 Topical Authority Map
**Affects:** Analysis, Dashboard  
**What to build:**
- Visual cluster diagram: one Pillar topic → N supporting subtopics
- Colour-code: green = covered, orange = partial, red = missing
- Click a cluster node to see: current ranking, word count, content score
- Generate missing cluster articles directly from map nodes
- Based on: Keyword Insights AI / SearchAtlas Topical Map approach

**UI component:** Interactive SVG/D3 force-directed graph or a tree-list with progress bars

#### 2.2 Real-Time Content Score Editor
**Affects:** Production  
**What to build:**
- Inline article editor (TipTap / Slate.js) embedded in Production page
- Right sidebar shows live content score (0–100) that updates as user types
- Score based on:
  - Keyword usage (primary + semantic)
  - NLP term coverage
  - Word count target
  - Heading structure
  - Readability score
  - Internal link count
- Below 70: show specific "what to fix" suggestions
- Above 90: badge "SEO Optimized"

#### 2.3 Rank Tracking Integration
**Affects:** Progress, Dashboard  
**What to build:**
- Use Google Search Console data to extract average position per keyword
- Progress page: add "Current Rank" column from GSC data
- Dashboard: "Ranking Improvements This Month" widget based on GSC position changes

#### 2.4 Google Search Console Integration
**Affects:** Dashboard, Analysis, Progress  
**What to build:**
- OAuth connect to GSC (already have OAuth infrastructure for WordPress)
- Pull: clicks, impressions, CTR, average position per page
- Analysis page: show GSC impressions next to each identified keyword
- Progress page: show clicks + impressions per published post
- Dashboard: "Top Performing Content" widget from GSC data

#### 2.5 E-E-A-T Scoring Module
**Affects:** Analysis, Dashboard  
**What to build:**
- Score (0–100) across four dimensions: Experience, Expertise, Authoritativeness, Trustworthiness
- Checks: author bio presence, citation count, external link quality, schema markup, "About" page quality
- Actionable fix list per dimension
- Integrate E-E-A-T score into the main health score calculation

---

### Phase 3 — Differentiation Features (8–16 weeks)

#### 3.1 AI Visibility Tracker (GEO — Generative Engine Optimization)
**What to build:**
- Track brand / product mentions in ChatGPT, Perplexity, and Google AI Overviews
- Show: "Your brand mentioned X times in AI answers for [keyword]"
- Competitor comparison: "Competitor A mentioned 3x more than you"
- Content recommendations to improve AI answer inclusion
- This is a **massive differentiator** — few tools do this well in 2025

#### 3.2 Internal Linking Engine
**Affects:** Production, Analysis  
**What to build:**
- After crawl, build a graph of all pages and their content
- Suggest internal links when drafting new content: "Link to [existing page] from paragraph 3"
- Show "orphan pages" (no internal links pointing to them)
- Show link equity distribution across the site
- One-click WordPress insertion of suggested internal links via plugin

#### 3.3 Content Repurposing Engine
**Affects:** Production  
**What to build:**
- Select any published article → "Repurpose This"
- Options: LinkedIn post, Twitter/X thread, FAQ schema, email newsletter, YouTube script
- AI generates the repurposed format maintaining brand tone
- Schedule directly from repurpose modal

#### 3.4 Content ROI Dashboard
**Affects:** Progress, Dashboard  
**What to build:**
- Revenue attribution: connect Google Analytics 4 → link published posts to goal completions
- Show: "This post drove 23 leads worth $X"
- Content ROI score: (leads / content cost) 
- "Best performing post type" breakdown
- Monthly trend: traffic gain, rank gain, leads from content

#### 3.5 A/B Title & Meta Testing
**Affects:** Progress  
**What to build:**
- For any published post: create an alternate title + meta description variant
- 50/50 split via WordPress plugin serving different meta tags
- Measure CTR from GSC over 14 days
- Auto-pick winner and deploy permanently

#### 3.6 Local SEO Content Automation
**Affects:** Production, Auto Pilot  
**What to build:**
- Location targeting (already has UI shell) → generate location-specific landing pages
- Template: "[Service] in [City]" pages with local keywords
- Bulk generation: 50 city pages in one run
- Auto-publish to WordPress as custom post type or page

---

## API & Backend Requirements

| Feature | Recommended API / Service |
|---|---|
| GSC Integration | Google Search Console API v3 (OAuth) |
| GA4 Integration | Google Analytics Data API |
| AI Visibility (GEO) | Custom: query ChatGPT/Perplexity APIs + scrape AI Overviews |
| Image generation | OpenAI DALL-E 3 or Replicate Stable Diffusion |

---

## Trigger.dev Task Extensions

```
trigger/content/
  competitor-gap.ts              ← Phase 1.1
  content-brief-generator.ts     ← Phase 1.2
  gsc-sync.ts                    ← Phase 2.3
  gsc-rank-tracker.ts            ← Phase 2.3
  ga4-sync.ts                    ← Phase 2.4
  eeat-scorer.ts                 ← Phase 2.5
  ai-visibility-tracker.ts       ← Phase 3.1
  internal-link-engine.ts        ← Phase 3.2
  content-repurposer.ts          ← Phase 3.3
  local-seo-generator.ts         ← Phase 3.6
```

---

## Prisma Schema Additions

```prisma
model ContentKeyword {
  id           String   @id @default(cuid())
  keyword      String
  rank         Int?
  rankHistory  Json?    // [{date, rank}]
  clicks       Int?
  impressions  Int?
  projectId    String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model ContentBrief {
  id            String   @id @default(cuid())
  title         String
  primaryKeyword String
  wordCountMin  Int
  wordCountMax  Int
  h2Outline     Json     // string[]
  nlpTerms      Json     // string[]
  paaQuestions  Json     // string[]
  internalLinks Json     // {text, url}[]
  status        String   @default("draft") // draft|scheduled|published|failed
  contentScore  Int?
  publishedUrl  String?
  gscClicks     Int?
  gscImpressions Int?
  currentRank   Int?
  projectId     String
  createdAt     DateTime @default(now())
}

model TopicCluster {
  id          String   @id @default(cuid())
  pillarTopic String
  pillarUrl   String?
  subTopics   Json     // [{topic, url, status}]
  projectId   String
  createdAt   DateTime @default(now())
}
```

---

## Success Metrics

| Metric | Current | 3-Month Target |
|---|---|---|
| Avg time-on-page (Content Strategy) | ~1 min | 8+ min |
| Articles generated per user/month | ~1 | 20+ |
| WordPress publish success rate | unknown | 95%+ |
| User retention (content tab) | low | 60%+ weekly active |
| NPS score | – | 40+ |

# New Features Summary
**Commits:** `de4a8c68` → `b12c62bb` (22 commits)

---

## 1. Rank Tracking & Weekly Reports

### Rank Tracking (`src/app/api/rank-tracking/route.ts`)
- Track keyword rankings across search engines
- Historical ranking data storage
- Ranking trend analysis

### Auto Weekly Reports (`src/app/api/cron/weekly-reports/route.ts`)
- Automated weekly report generation
- Scheduled via Vercel Cron (`vercel.json`)
- Email delivery of reports

---

## 2. Multi-Provider Email Engine

### Email Provider Support (`src/lib/email-engine.ts`, `src/app/api/email/provider/route.ts`)
- Multiple email provider integration
- Provider configuration and management
- Email delivery tracking

### Drip Campaigns (`src/app/api/email/drip/route.ts`)
- Automated drip email sequences
- Campaign management
- Subscriber segmentation

### Email Templates (`src/app/api/email/templates/route.ts`)
- Customizable email templates
- Template management API

---

## 3. White-Label Reports (`src/app/api/agency/white-label/route.ts`)
- Agency-branded report generation
- Custom domain support
- White-label configuration options
- Report customization per agency

---

## 4. Onboarding Wizard (`src/components/onboarding/OnboardingWizard.tsx`)
- Step-by-step user onboarding flow
- Progress tracking
- Skip/complete options
- Guided website setup

---

## 5. Workspace Management (`src/app/workspaces/page.tsx`)
- Create and manage multiple workspaces
- Workspace switching
- Per-workspace settings
- Sidebar navigation integration

---

## 6. GEO Audit & Location Pages Generator

### GEO Audit (`src/app/api/geo/analyze/route.ts`, `src/app/geo-audit/page.tsx`)
- Geographic location analysis
- Local SEO audit
- Location-specific recommendations

### Location Pages Generator (`src/app/api/content/locations/route.ts`, `src/app/location-pages/page.tsx`)
- AI-powered location page generation
- Bulk location page creation
- Customizable location content

### GEO Artifacts (`src/app/api/geo/artifacts/route.ts`, `src/app/api/geo/generate-files/route.ts`)
- GEO-specific file generation
- Location-based content artifacts

### Live GEO Audit (`src/app/api/geo/live-audit/route.ts`)
- Real-time geographic audit
- Live analysis results

---

## 7. WordPress Plugin Download Hub (`public/downloads/seo-auto-fix.zip`)
- Updated WordPress plugin package
- Plugin download management
- Version updates

---

## 8. Google Business Profile (GBP) Optimization

### GBP Scrape & Optimize (`src/app/api/gbp/scrape/route.ts`, `src/app/api/gbp/optimize/route.ts`)
- Google Business Profile data scraping
- Business listing optimization
- NAP (Name, Address, Phone) consistency check

### GBP Refresh (`trigger/gbp/refresh-gbp.ts`)
- Automated GBP data refresh
- Scheduled updates via Trigger.dev

---

## 9. Review Management System

### Reviews Page (`src/app/reviews/page.tsx`)
- Review dashboard and management
- Import reviews from various sources

### Reviews API Routes
- `src/app/api/reviews/contacts/route.ts` - Contact management
- `src/app/api/reviews/import/route.ts` - Review importing
- `src/app/api/reviews/settings/route.ts` - Review settings
- `src/app/api/reviews/stats/route.ts` - Review statistics
- `src/app/api/reviews/unsubscribe/route.ts` - Unsubscribe handling

### Review Sender (`src/lib/review-sender.ts`, `trigger/reviews/send-review-requests.ts`)
- Automated review request emails
- Scheduled review requests via Trigger.dev

---

## 10. Chatbot Widget (`src/chatbot-widget/widget.ts`, `src/app/chatbot/page.tsx`)

### Features
- Embeddable chatbot widget (`public/widget.js`)
- Lead capture functionality (`src/app/api/chatbot/leads/route.ts`)
- Chatbot configuration (`src/app/api/chatbot/config/[siteId]/route.ts`)
- Domain restriction (`src/app/api/chatbot/domains/route.ts`)
- Message handling (`src/app/api/chatbot/message/route.ts`)
- CORS handling (`src/lib/chatbot-cors.ts`)
- Rate limiting (`src/lib/chatbot-rate-limit.ts`)

### Chatbot Embed (`src/components/app/AppAssistantBubble.tsx`)
- App assistant bubble component
- In-app chatbot integration

---

## 11. Security Hardening

### Fixed Issues (`be77e10` - Phase 8 QA)
- **SSRF Prevention** - Server-Side Request Forgery protection in `src/app/api/proxy-fetch/route.ts`
- **Cron Auth Bypass** - Fixed authentication bypass in cron routes
- **API Auth** - Added proper API authentication
- **Encryption Bug** - Fixed encryption implementation in `src/lib/encryption.ts`

### Security Components
- `src/lib/ai-gatekeeper.ts` - AI usage gatekeeping
- `src/lib/reviews-guard.ts` - Review access protection

---

## 12. PlanGate Component (`src/components/PlanGate.tsx`)
- Plan-based feature gating
- UI enforcement of plan limits
- Upgrade prompts

---

## 13. Premium Sidebar UI (`src/components/layout/SidebarLayout.tsx`)
- Complete sidebar redesign
- Agency navigation
- Dynamic menu items
- Active state management

---

## 14. Marketing Pages

### New Pages
- `src/app/about/page.tsx` - About page
- `src/app/contact/page.tsx` - Contact page with layout (`src/app/contact/layout.tsx`)
- `src/app/services/page.tsx` - Services page
- `src/app/pricing/page.tsx` + `PricingClient.tsx` - Pricing page with client-side pricing logic
- `src/app/privacy/page.tsx` - Privacy policy
- `src/app/terms/page.tsx` - Terms of service

### Marketing Components
- `src/components/marketing/MarketingFooter.tsx` - Marketing footer
- `src/components/marketing/MarketingHomeContent.tsx` - Home page marketing content
- `src/components/marketing/MarketingNav.tsx` - Marketing navigation

---

## 15. Settings & Billing

### Settings Page (`src/app/settings/page.tsx`)
- User settings management
- Account configuration
- API key management (`src/app/api/user/keys/route.ts`)

### Billing (`src/app/billing/page.tsx`)
- Stripe checkout integration (`src/app/api/billing/checkout/route.ts`)
- Stripe portal (`src/app/api/billing/portal/route.ts`)
- Stripe webhook handling (`src/app/api/webhooks/stripe/route.ts`)
- `src/lib/stripe.ts` - Stripe utility functions

---

## 16. Site Management

### Sites Overview (`src/app/sites/[siteId]/page.tsx`)
- Individual site dashboard
- Site-specific overview (`src/app/api/sites/[siteId]/overview/route.ts`)
- Site validation (`src/app/api/sites/validate/route.ts`)

### Scan Page (`src/app/scan/page.tsx`, `src/app/api/scan/business/route.ts`)
- Business scanning functionality
- Scan results and recommendations

---

## 17. Reports System (`src/app/reports/page.tsx`)

### Report APIs
- `src/app/api/reports/generate/route.ts` - Report generation
- `src/app/api/reports/send/route.ts` - Report delivery

---

## 18. Content Generation Updates

### Annual Plan Content (`src/app/api/content/annual-plan/route.ts`)
- Annual content planning
- Yearly content calendar

### Content Sites (`src/app/api/content/sites/route.ts`)
- Content management per site

### Content Generator (`trigger/content/content-generator.ts`)
- Trigger.dev integration for content generation

---

## 19. Database & Schema Updates (`prisma/schema.prisma`)

Major schema updates including:
- Extended user models
- Enhanced workspace models
- Review and GBP models
- Email and chatbot models
- Report models

---

## 20. Plan Limits System (`src/lib/plan-limits.ts`)
- Plan-based feature limits
- Usage tracking
- Limit enforcement

---

## 21. BYOK (Bring Your Own Key) Support

### OpenRouter + Anthropic BYOK
- Custom API key integration
- Multiple provider support
- Key management per user

---

## 22. JSON-LD Structured Data (`80068c5`)
- Schema.org JSON-LD markup
- Rich snippets support
- SEO enhancement

---

## 23. Loading States (`src/app/loading.tsx`)
- Loading skeleton UI
- Improved UX during data fetching

---

## 24. Not Found Page (`src/app/not-found.tsx`)
- Custom 404 page
- Navigation back to safety

---

## 25. Plugin Page (`src/app/plugin/page.tsx`)
- WordPress plugin information
- Download links
- Setup instructions

---

## 26. Health Check (`src/app/api/health/route.ts`)
- API health monitoring
- System status endpoint

---

## 27. User Context (`src/app/api/user/context/route.ts`)
- User context management
- Session handling

---

## 28. Vercel Cron Schedule (`vercel.json`)
- Weekly cron job configuration
- Automated task scheduling

---

## 29. Places Details (`src/lib/places-details.ts`)
- Google Places API integration
- Location data retrieval

---

## 30. Logger (`src/lib/logger.ts`)
- Application logging
- Error tracking

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Commits | 22 |
| Files Changed | 130 |
| Insertions | +15,596 |
| Deletions | -1,624 |
| Net Lines | +13,972 |

---

*Generated from commit range: `de4a8c68` → `b12c62bb`*

# Implement 21 Missing Features from NEW-FEATURES-SUMMARY.md

Implementing all missing features documented in `NEW-FEATURES-SUMMARY.md` across 6 phases, organized by dependency order. Total: ~80+ new files.

## User Review Required

> [!IMPORTANT]
> This is a **massive implementation** (~80+ files). All features follow existing project patterns:
> - **Auth:** Clerk + `requireAuth()` from `@/lib/auth`
> - **DB:** Prisma with `@/lib/prisma`  
> - **API:** Next.js App Router route handlers
> - **UI:** Tailwind CSS with shadcn-style design tokens
> - **Scheduling:** Trigger.dev for background jobs

> [!WARNING]
> - **Stripe integration** requires API keys configured in `.env` — the billing routes will be functional stubs until keys are provided.
> - **Email (Resend)** — `resend` package already installed. Email engine will use it as primary provider.
> - **Schema migration** — New Prisma models will be added. You'll need to run `npx prisma db push` after implementation.

## Open Questions

> [!IMPORTANT]
> 1. **Stripe pricing tiers** — What are the actual prices for PRO, AGENCY, and WHITE_LABEL plans? I'll use placeholder prices ($29/mo, $99/mo, $249/mo) unless you specify.
> 2. **Email provider** — The Resend package is already installed. Should I also add Nodemailer/SMTP support, or is Resend sufficient as the email engine?
> 3. **Chatbot AI model** — Should the chatbot use OpenAI (already configured) for responses, or a simpler rule-based approach?

---

## Proposed Changes

### Phase 1: Infrastructure & Security (Foundation Layer)

These files have no dependencies and are needed by subsequent phases.

---

#### [NEW] `src/lib/logger.ts`
- Structured logging utility with log levels (debug, info, warn, error)
- JSON output in production, pretty-print in development
- Context-aware logging (userId, requestId)

#### [NEW] `src/lib/encryption.ts`
- AES-256-GCM encryption/decryption for API keys, secrets
- Uses Node.js `crypto` module
- Key derivation from `ENCRYPTION_KEY` env var

#### [NEW] `src/lib/plan-limits.ts`
- Plan-based limit definitions (FREE/PRO/AGENCY/WHITE_LABEL)
- Usage checking utilities (audits, content, clients, etc.)
- Limit enforcement functions

#### [NEW] `src/lib/ai-gatekeeper.ts`
- AI usage tracking per user per plan
- Rate limiting for AI calls
- Token budget enforcement

#### [NEW] `src/lib/reviews-guard.ts`
- Review request rate limiting
- Spam prevention for review solicitation
- Per-user daily/monthly limits

#### [NEW] `src/lib/chatbot-cors.ts`
- CORS handling for chatbot widget cross-origin requests
- Domain validation against allowed domains

#### [NEW] `src/lib/chatbot-rate-limit.ts`
- Per-IP and per-session rate limiting for chatbot
- Sliding window algorithm

#### [NEW] `src/lib/stripe.ts`
- Stripe client initialization
- Checkout session creation
- Portal session creation
- Webhook signature verification

#### [NEW] `src/lib/email-engine.ts`
- Multi-provider email engine (Resend primary)
- Template rendering
- Delivery tracking
- Provider failover

#### [NEW] `src/lib/review-sender.ts`
- Review request email composition
- Template selection
- Send scheduling

#### [NEW] `src/lib/places-details.ts`
- Google Places API integration
- Place details retrieval
- Location data formatting

#### [MODIFY] `src/app/api/proxy-fetch/route.ts`
- **Add SSRF prevention**: Block private IPs (10.x, 172.16-31.x, 192.168.x, 127.x, ::1)
- Add URL scheme validation (only http/https)
- Add domain blocklist (localhost, internal hosts)
- Add auth check with `requireAuth()`

#### [NEW] `vercel.json`
- Cron schedule for weekly reports (`0 9 * * 1`)
- Cron schedule for GBP refresh
- Cron schedule for review requests

#### [NEW] `.env.example` update
- Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO, STRIPE_PRICE_AGENCY, STRIPE_PRICE_WHITE_LABEL
- Add ENCRYPTION_KEY
- Add RESEND_API_KEY (already likely there)

---

### Phase 2: Database Schema Updates

#### [MODIFY] `prisma/schema.prisma`
Add new models:
- `Workspace` — multi-workspace support
- `RankTracking` — keyword rank history
- `WeeklyReport` — generated report records
- `EmailTemplate` — email template storage
- `DripCampaign` / `DripStep` — drip email sequences
- `ReviewRequest` / `ReviewContact` — review management
- `ChatbotConfig` / `ChatbotLead` / `ChatbotMessage` — chatbot data
- `LocationPage` — generated location pages
- `GeoAudit` — geographic audit results
- `UserApiKey` — BYOK key storage (encrypted)
- `BillingSubscription` — Stripe subscription tracking

---

### Phase 3: API Routes (Backend)

#### Rank Tracking & Weekly Reports
- [NEW] `src/app/api/rank-tracking/route.ts` — CRUD for rank tracking config
- [NEW] `src/app/api/cron/weekly-reports/route.ts` — Cron-triggered weekly report generation + email delivery

#### Email Engine
- [NEW] `src/app/api/email/provider/route.ts` — Email provider config CRUD
- [NEW] `src/app/api/email/drip/route.ts` — Drip campaign CRUD + execution
- [NEW] `src/app/api/email/templates/route.ts` — Email template CRUD

#### White-Label
- [NEW] `src/app/api/agency/white-label/route.ts` — White-label branding config

#### GEO Audit & Locations
- [NEW] `src/app/api/geo/analyze/route.ts` — Geographic SEO analysis
- [NEW] `src/app/api/geo/artifacts/route.ts` — GEO file artifacts generation
- [NEW] `src/app/api/geo/generate-files/route.ts` — Bulk GEO file generation
- [NEW] `src/app/api/geo/live-audit/route.ts` — Real-time GEO audit
- [NEW] `src/app/api/content/locations/route.ts` — Location page content generation

#### GBP Optimization
- [NEW] `src/app/api/gbp/optimize/route.ts` — GBP listing optimization suggestions

#### Reviews
- [NEW] `src/app/api/reviews/contacts/route.ts` — Contact list management
- [NEW] `src/app/api/reviews/import/route.ts` — Review import from platforms
- [NEW] `src/app/api/reviews/settings/route.ts` — Review settings
- [NEW] `src/app/api/reviews/stats/route.ts` — Review statistics
- [NEW] `src/app/api/reviews/unsubscribe/route.ts` — Unsubscribe handling

#### Chatbot
- [NEW] `src/app/api/chatbot/leads/route.ts` — Lead capture CRUD
- [NEW] `src/app/api/chatbot/config/[siteId]/route.ts` — Per-site chatbot config
- [NEW] `src/app/api/chatbot/domains/route.ts` — Domain restriction management
- [NEW] `src/app/api/chatbot/message/route.ts` — Message handling + AI response

#### Billing
- [NEW] `src/app/api/billing/checkout/route.ts` — Stripe checkout session
- [NEW] `src/app/api/billing/portal/route.ts` — Stripe customer portal
- [NEW] `src/app/api/webhooks/stripe/route.ts` — Stripe webhook handler

#### Settings & User
- [NEW] `src/app/api/user/keys/route.ts` — BYOK API key management
- [NEW] `src/app/api/health/route.ts` — Health check endpoint

#### Reports
- [NEW] `src/app/api/reports/generate/route.ts` — Report generation
- [NEW] `src/app/api/reports/send/route.ts` — Report email delivery

#### Content
- [NEW] `src/app/api/content/annual-plan/route.ts` — Annual content planning

#### Sites
- [NEW] `src/app/api/sites/[siteId]/overview/route.ts` — Site overview data
- [NEW] `src/app/api/scan/business/route.ts` — Business scanning

---

### Phase 4: Trigger.dev Background Jobs

- [NEW] `trigger/gbp/refresh-gbp.ts` — Scheduled GBP data refresh
- [NEW] `trigger/reviews/send-review-requests.ts` — Scheduled review request emails

---

### Phase 5: UI Components

#### Core Components
- [NEW] `src/components/PlanGate.tsx` — Plan-based feature gating with upgrade prompts
- [NEW] `src/components/onboarding/OnboardingWizard.tsx` — Step-by-step wizard (complements existing Walkthrough)
- [NEW] `src/components/app/AppAssistantBubble.tsx` — In-app chatbot bubble

#### Marketing Components
- [NEW] `src/components/marketing/MarketingNav.tsx` — Marketing site navigation
- [NEW] `src/components/marketing/MarketingFooter.tsx` — Marketing site footer
- [NEW] `src/components/marketing/MarketingHomeContent.tsx` — Home page hero + features

---

### Phase 6: Pages (Frontend)

#### App Pages
- [NEW] `src/app/loading.tsx` — Loading skeleton
- [NEW] `src/app/not-found.tsx` — Custom 404 page
- [NEW] `src/app/workspaces/page.tsx` — Workspace management
- [NEW] `src/app/geo-audit/page.tsx` — GEO audit dashboard
- [NEW] `src/app/location-pages/page.tsx` — Location pages manager
- [NEW] `src/app/reviews/page.tsx` — Review management dashboard
- [NEW] `src/app/chatbot/page.tsx` — Chatbot configuration
- [NEW] `src/app/settings/page.tsx` — User settings
- [NEW] `src/app/billing/page.tsx` — Billing & subscription
- [NEW] `src/app/sites/[siteId]/page.tsx` — Individual site dashboard
- [NEW] `src/app/scan/page.tsx` — Business scanning page
- [NEW] `src/app/reports/page.tsx` — Reports dashboard
- [NEW] `src/app/plugin/page.tsx` — WordPress plugin info page

#### Marketing Pages
- [NEW] `src/app/about/page.tsx` — About page
- [NEW] `src/app/contact/page.tsx` — Contact page
- [NEW] `src/app/contact/layout.tsx` — Contact layout
- [NEW] `src/app/services/page.tsx` — Services page
- [NEW] `src/app/pricing/page.tsx` — Pricing page (server)
- [NEW] `src/app/pricing/PricingClient.tsx` — Pricing client component
- [NEW] `src/app/privacy/page.tsx` — Privacy policy
- [NEW] `src/app/terms/page.tsx` — Terms of service

#### Chatbot Widget
- [NEW] `src/chatbot-widget/widget.ts` — Embeddable chatbot source
- [NEW] `public/widget.js` — Compiled chatbot widget for embedding

---

## Verification Plan

### Automated Tests
1. **Build check**: `npm run build` — verify no TypeScript errors
2. **Schema push**: `npx prisma db push --dry-run` — verify schema is valid
3. **API health check**: Hit `/api/health` endpoint
4. **Browser test**: Navigate key pages to verify rendering

### Manual Verification
- Verify sidebar navigation includes new pages
- Test PlanGate component blocks/allows features correctly
- Verify SSRF protection blocks private IPs in proxy-fetch
- Check loading and 404 pages render correctly

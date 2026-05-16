# Implementation Task Tracker

## Phase 1: Infrastructure & Security
- [x] `src/lib/logger.ts`
- [x] `src/lib/encryption.ts`
- [x] `src/lib/plan-limits.ts`
- [x] `src/lib/ai-gatekeeper.ts`
- [x] `src/lib/reviews-guard.ts`
- [x] `src/lib/chatbot-cors.ts`
- [x] `src/lib/chatbot-rate-limit.ts`
- [x] `src/lib/stripe.ts`
- [x] `src/lib/email-engine.ts`
- [x] `src/lib/review-sender.ts`
- [x] `src/lib/places-details.ts`
- [x] Fix SSRF in `src/app/api/proxy-fetch/route.ts`
- [x] `vercel.json`
- [ ] Update `.env.example`

## Phase 2: Database Schema
- [ ] Update `prisma/schema.prisma` with new models

## Phase 3: API Routes
- [ ] `src/app/api/rank-tracking/route.ts`
- [ ] `src/app/api/cron/weekly-reports/route.ts`
- [ ] `src/app/api/email/provider/route.ts`
- [ ] `src/app/api/email/drip/route.ts`
- [ ] `src/app/api/email/templates/route.ts`
- [ ] `src/app/api/agency/white-label/route.ts`
- [ ] `src/app/api/geo/analyze/route.ts`
- [ ] `src/app/api/geo/artifacts/route.ts`
- [ ] `src/app/api/geo/generate-files/route.ts`
- [ ] `src/app/api/geo/live-audit/route.ts`
- [ ] `src/app/api/content/locations/route.ts`
- [ ] `src/app/api/content/annual-plan/route.ts`
- [ ] `src/app/api/gbp/optimize/route.ts`
- [ ] `src/app/api/reviews/contacts/route.ts`
- [ ] `src/app/api/reviews/import/route.ts`
- [ ] `src/app/api/reviews/settings/route.ts`
- [ ] `src/app/api/reviews/stats/route.ts`
- [ ] `src/app/api/reviews/unsubscribe/route.ts`
- [ ] `src/app/api/chatbot/leads/route.ts`
- [ ] `src/app/api/chatbot/config/[siteId]/route.ts`
- [ ] `src/app/api/chatbot/domains/route.ts`
- [ ] `src/app/api/chatbot/message/route.ts`
- [ ] `src/app/api/billing/checkout/route.ts`
- [ ] `src/app/api/billing/portal/route.ts`
- [ ] `src/app/api/webhooks/stripe/route.ts`
- [ ] `src/app/api/user/keys/route.ts`
- [ ] `src/app/api/health/route.ts`
- [ ] `src/app/api/reports/generate/route.ts`
- [ ] `src/app/api/reports/send/route.ts`
- [ ] `src/app/api/sites/[siteId]/overview/route.ts`
- [ ] `src/app/api/scan/business/route.ts`

## Phase 4: Trigger.dev Jobs
- [ ] `trigger/gbp/refresh-gbp.ts`
- [ ] `trigger/reviews/send-review-requests.ts`

## Phase 5: UI Components
- [ ] `src/components/PlanGate.tsx`
- [ ] `src/components/onboarding/OnboardingWizard.tsx`
- [ ] `src/components/app/AppAssistantBubble.tsx`
- [ ] `src/components/marketing/MarketingNav.tsx`
- [ ] `src/components/marketing/MarketingFooter.tsx`
- [ ] `src/components/marketing/MarketingHomeContent.tsx`

## Phase 6: Pages
- [ ] `src/app/loading.tsx`
- [ ] `src/app/not-found.tsx`
- [ ] `src/app/workspaces/page.tsx`
- [ ] `src/app/geo-audit/page.tsx`
- [ ] `src/app/location-pages/page.tsx`
- [ ] `src/app/reviews/page.tsx`
- [ ] `src/app/chatbot/page.tsx`
- [ ] `src/app/settings/page.tsx`
- [ ] `src/app/billing/page.tsx`
- [ ] `src/app/sites/[siteId]/page.tsx`
- [ ] `src/app/scan/page.tsx`
- [ ] `src/app/reports/page.tsx`
- [ ] `src/app/plugin/page.tsx`
- [ ] `src/app/about/page.tsx`
- [ ] `src/app/contact/page.tsx`
- [ ] `src/app/contact/layout.tsx`
- [ ] `src/app/services/page.tsx`
- [ ] `src/app/pricing/page.tsx`
- [ ] `src/app/pricing/PricingClient.tsx`
- [ ] `src/app/privacy/page.tsx`
- [ ] `src/app/terms/page.tsx`
- [ ] `src/chatbot-widget/widget.ts`
- [ ] `public/widget.js`

## Verification
- [ ] Build check (`npm run build`)
- [ ] Schema validation

# TRAVEL REVENUE NETWORK — RELEASE CHECKLIST (SPRINT 1)

## 1. Safety & Secret Verification

- [x] `TRAVEL_JOURNEY_SECRET` is used exclusively for token signing & verification.
- [x] No fallback to `JWT_SECRET` or `SESSION_SECRET`.
- [x] Browser SDK `@onyx/travel-tracking` contains ZERO HMAC secrets and performs ZERO local token signing.
- [x] Token signing occurs 100% server-side inside `POST /api/travel/cross-promo/decision`.
- [x] Degraded mode is properly reported in `GET /api/travel/health` when secret is absent.

## 2. Data Backbone & DB Schema Verification

- [x] Reduced Sprint 1 tables created in `drizzle/schema/travel-network.ts`:
  - `travel_domains`
  - `travel_events`
  - `travel_campaigns`
  - `travel_creatives`
  - `travel_placements`
  - `travel_targeting_rules`
  - `travel_journeys`
  - `travel_affiliate_clicks`
  - `affiliate_partners`
  - `affiliate_conversions`
  - `travel_audit_logs`
- [x] Deferred tables (`travel_experiments`, `travel_offer_health`, `travel_alerts`) omitted from Sprint 1 schema.
- [x] Migration scripts generated cleanly via `pnpm db:push`.

## 3. API & Event Ingestion Verification

- [x] All 18 mandatory event types defined in Zod schema validator.
- [x] Event idempotency enforced (`event_id` unique constraint skips duplicates with `duplicate_ignored`).
- [x] Public API endpoints secured (`POST /api/travel/events`, `POST /api/travel/cross-promo/decision`, `GET /api/travel/health`).
- [x] Origin validation, domain ID check, rate limiting, and 4KB metadata limit active.

## 4. Attribution & Conversion Importer Verification

- [x] Multi-touch attribution model active (Last affiliate click, Network origin, Assisted domains).
- [x] Conversion status state machine (`pending` -> `confirmed` / `cancelled`).
- [x] LeadOS Travel Overview dashboard strictly separates pending vs confirmed revenue.

## 5. UI & Governance Verification

- [x] Travel Overview MVP at `/dashboard/travel`.
- [x] Campaign Manager MVP at `/dashboard/travel/campaigns`.
- [x] Governance approval workflow (`draft` -> `review` -> `approved` -> `active` / `paused`).
- [x] Editorial status decoupled from runtime health. Creative suppressions logged to audit log.

## 6. Pilot Integration & Seed Data

- [x] Pilot seed campaign created with status `draft`: `do-italie.cz` -> `akcni-letenky.com` (`article_mid_content`).
- [x] Headline: "Najděte levné letenky do Itálie", Body: "Porovnejte aktuální odlety z Česka a okolních letišť.", CTA: "Najít letenky".
- [x] No unverified prices or urgency claims embedded.

## 7. Automated Tests & Build

- [x] `pnpm check` passes with 0 TypeScript errors.
- [x] `pnpm test` suite (`server/travel/travelNetwork.test.ts`) passes.
- [x] `pnpm build` verifies clean bundling.

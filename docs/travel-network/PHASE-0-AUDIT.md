# PHASE 0 — REPOSITORY AUDIT: TRAVEL REVENUE NETWORK

**Project:** ONYX OS / LeadOS
**Module:** Travel Revenue Network (`travelNetwork`)
**Date:** 2026-07-23
**Status:** APPROVED (Sprint 1 Scope Approved with Constraints)

---

## 1. Approved Sprint 1 Constraints

1. **Secret Management**:
   - Strictly use `TRAVEL_JOURNEY_SECRET`. No fallback to `JWT_SECRET` or `SESSION_SECRET`.
   - Missing secret -> token features disabled, health = `degraded`, no production token generation.
   - Journey token signing and verification is **server-side only**. The browser SDK never receives or uses the HMAC secret.
2. **Client SDK Security**:
   - The SDK does not locally sign tokens. `createJourneyLink()` only consumes server-minted URLs/tokens returned by Decision API.
3. **Sprint 1 Database Scope**:
   - Tables: `travel_domains`, `travel_events`, `travel_campaigns`, `travel_creatives`, `travel_placements`, `travel_targeting_rules`, `travel_journeys`, `travel_affiliate_clicks`, `affiliate_partners`, `affiliate_conversions`, `travel_audit_logs`.
   - Deferred: `travel_experiments`, `travel_experiment_variants`, `travel_experiment_assignments`, `travel_experiment_results`, `travel_offer_health`, `travel_alerts`.
4. **Health & Editorial Separation**:
   - Editorial status (`draft`, `review`, `approved`, `scheduled`, `active`, `paused`, `archived`) is distinct from runtime health (`unknown`, `healthy`, `warning`, `invalid`, `expired`, `offline`).
   - Decision API suppresses unhealthy/expired creatives without changing their approved editorial status, logging audit events.
5. **Event Ingestion Security**:
   - Origin validation, domain ID check, project key validation, rate limiting, payload/metadata size limits, schema validation, abuse protection.
6. **UI Scope**:
   - Implement only `/dashboard/travel` (Travel Overview MVP) and `/dashboard/travel/campaigns` (Campaign Manager MVP).
7. **Pilot Campaign**:
   - One draft seed campaign (`do-italie.cz` -> `akcni-letenky.com`, `article_mid_content`, `native_card`).

---

## 2. Architecture & Capabilities Summary

- **Monolith Core**: Single repository containing React 19 frontend (`client/`), Express v4 backend (`server/`), and Drizzle ORM v0.44 (`drizzle/`).
- **Database**: MySQL 8+ with Drizzle ORM. Domain schema `drizzle/schema/travel-network.ts`.
- **API Layer**: Express REST for high-throughput public endpoints (`POST /api/travel/events`, `POST /api/travel/cross-promo/decision`, `GET /api/travel/health`); tRPC for LeadOS administration.
- **Testing**: Vitest (`vitest.config.ts`, `pnpm test`).

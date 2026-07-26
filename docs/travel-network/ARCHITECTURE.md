# TRAVEL REVENUE NETWORK — ARCHITECTURE SPECIFICATION

## System Overview

The Travel Revenue Network consists of three primary layers:
1. **ONYX OS Core**: Event Ingestion API, Cross-Domain Identity Token Signing, Event Store, Attribution Engine, Audit Logging.
2. **LeadOS Command-and-Control**: Dashboards (`/dashboard/travel`), Campaign Manager (`/dashboard/travel/campaigns`), Governance & Approval Workflows, Decision Rules Engine.
3. **Client Websites**: External websites (`do-italie.cz`, `akcni-letenky.com`, `lastminutedovolene.cz`) rendering `<TravelCrossPromo />` components, consuming Decision API via REST, embedding `@onyx/travel-tracking` SDK.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT WEBSITES                                   |
| (do-italie.cz, akcni-letenky.com, lastminutedovolene.cz)                           |
| - @onyx/travel-tracking SDK                                                       |
| - <TravelCrossPromo /> Component                                                 |
+----------------------------------------+------------------------------------------+
                                         |
                       HTTP POST REST    |    HTTP POST REST
                       /api/travel/events|    /api/travel/cross-promo/decision
                                         v
+-----------------------------------------------------------------------------------+
|                                   ONYX OS CORE                                    |
| - Ingestion API (Validation, Rate limiting, Origin check, Idempotence)            |
| - Decision Engine (10-step priority evaluation, Signed token URL generation)      |
| - Server-Side Token Signer (TRAVEL_JOURNEY_SECRET HMAC)                            |
| - Attribution Engine (Last-click, Network Origin, Assisted Domains)               |
| - Audit Logger                                                                    |
+----------------------------------------+------------------------------------------+
                                         |
                                         | tRPC Internal API
                                         v
+-----------------------------------------------------------------------------------+
|                           LEADOS COMMAND & CONTROL                                |
| - Travel Overview Dashboard (/dashboard/travel)                                  |
| - Campaign Manager UI (/dashboard/travel/campaigns)                              |
| - Conversion Import Manager (CSV / Admin API)                                     |
+-----------------------------------------------------------------------------------+
```

## Security & Secrets Architecture

- **HMAC Secret**: `TRAVEL_JOURNEY_SECRET` is used exclusively for server-side signing and verification of `onyx_journey` tokens.
- **Client Security**: The browser SDK never receives `TRAVEL_JOURNEY_SECRET`. Token signing is 100% server-side inside `POST /api/travel/cross-promo/decision`.
- **Degraded Mode**: If `TRAVEL_JOURNEY_SECRET` is not provided in environment variables:
  - Token signing features are disabled.
  - Endpoint `GET /api/travel/health` returns status `"degraded"`.
  - Production environment rejects token generation.

## Health vs Editorial State Machine

- **Editorial Status**: `draft` -> `review` -> `approved` -> `scheduled` / `active` -> `paused` -> `archived`. (Controlled by LeadOS Admin / Approver).
- **Runtime Health Status**: `unknown`, `healthy`, `warning`, `invalid`, `expired`, `offline`.
- **Decoupled Rule**: Decision API suppresses creatives with unhealthy or expired runtime status without modifying their approved editorial status. All suppressions are recorded in `travel_audit_logs`.

# TRAVEL REVENUE NETWORK — EVENT CONTRACT SPECIFICATION

## Mandatory Event Types (18 Types)

1. `page_view`
2. `crosspromo_request`
3. `crosspromo_impression`
4. `crosspromo_click`
5. `search_start`
6. `search_submit`
7. `offer_impression`
8. `offer_view`
9. `offer_click`
10. `affiliate_redirect`
11. `booking_start`
12. `booking_complete`
13. `revenue_pending`
14. `revenue_confirmed`
15. `revenue_cancelled`
16. `cross_domain_arrival`
17. `empty_results`
18. `tracking_error`

## Event Payload JSON Schema

```json
{
  "event_id": "uuid-v4",
  "event_name": "crosspromo_click",
  "occurred_at": "2026-07-23T18:45:00.000Z",
  "domain_id": "uuid-v4",
  "source_domain": "do-italie.cz",
  "target_domain": "akcni-letenky.com",
  "anonymous_visitor_id": "anon_abc123xyz",
  "session_id": "sess_456def789",
  "journey_id": "journ_789ghi012",
  "campaign_id": "uuid-v4-or-null",
  "creative_id": "uuid-v4-or-null",
  "placement_id": "uuid-v4-or-null",
  "experiment_id": null,
  "variant_id": null,
  "page_url": "https://www.do-italie.cz/sicilie/palermo",
  "page_path": "/sicilie/palermo",
  "page_type": "article",
  "content_category": "sicilie",
  "destination": "palermo",
  "departure_airport": "PRG",
  "device_type": "mobile",
  "traffic_source": "organic",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "summer_promo",
  "affiliate_partner": null,
  "affiliate_click_id": null,
  "currency": "CZK",
  "revenue": 0,
  "metadata": {}
}
```

## Security & Validation Rules

- **Idempotency**: Requests with previously ingested `event_id` are acknowledged with HTTP 200 `{ "status": "duplicate_ignored" }` without saving duplicate rows.
- **Timestamps**: `occurred_at` represents the original client timestamp. `received_at` is set server-side upon receipt.
- **Privacy Constraints**: No email or PII allowed in events or URL query parameters. IP address is hashed for geolocation/device lookup and never stored raw.
- **Metadata Limits**: Max JSON size 4KB per event. Max batch size 50 events.
- **Batch Endpoint**: `POST /api/travel/events` accepts `{ "events": [ ... ] }`.

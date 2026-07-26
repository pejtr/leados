# TRAVEL REVENUE NETWORK — PRIVACY & DATA FLOW SPECIFICATION

## Data Flow & Collection Policy

1. **Collected Data**:
   - `anonymous_visitor_id`: Opaque client-side random string (`anon_...`). Stored in 1st-party localStorage.
   - `session_id`: Opaque session identifier (`sess_...`). Stored in 1st-party sessionStorage.
   - `journey_id`: Signed cross-domain identifier (`journ_...`).
   - Technical metadata: Device type, traffic source, UTM parameters, page URL/type, destination, departure airport.
2. **PII Restrictions**:
   - No email address or real name is stored in tracking events or URL parameters.
   - Raw IP addresses are NEVER stored in event logs or database tables.
   - Cross-domain tokens (`onyx_journey`) contain zero PII and are signed with `TRAVEL_JOURNEY_SECRET`.
3. **Retention & Anonymization**:
   - Event records retained for 90 days before raw event cleanup.
   - Aggregated metrics stored permanently without individual visitor IDs.

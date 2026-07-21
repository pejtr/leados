# ONYX OS UX and Workflow Architecture

## Product hierarchy

- **ONYX OS** is the product and the single user-facing workspace.
- **HERMES** is the orchestrator. It creates plans, routes work, records workflow runs and produces artifacts.
- **HERA and specialist agents** are execution modes under HERMES, not separate products or competing chat entry points.
- The primary navigation is limited to Today, Leads, Campaigns, HERMES, Analytics and Settings. The complete module catalog remains searchable.

## Data truth contract

Every operational state must be one of the following:

- **Live**: read from persisted application data or a successful external response.
- **Guided**: generated plan or draft that has not performed an external action.
- **Requires integration**: blocked until a required API, OAuth connection or product capability exists.
- **Unavailable**: a read failed; the UI must not replace the value with zero or demo data.

Generated estimates must never be displayed as CRM facts. External sends, publishing, purchases and third-party contact require explicit approval and a successful provider response.

## Implemented sprints

### Sprint 1: shell, trust and navigation

- Unified the primary application identity as ONYX OS.
- Reduced the desktop dock and added a stable mobile navigation.
- Added real search to the complete application catalog and repaired its group mapping.
- Removed the silent Google Maps demo fallback.
- Replaced simulated sequence delivery with Brevo delivery; failed sends do not advance the sequence.

### Sprint 2: Today workspace

- Replaced the default dashboard with an operational Today view.
- Shows persisted pipeline states, pending tasks, approvals, recommendations and integration health.
- Keeps the previous broad dashboard at `/overview` for compatibility.
- Consolidates legacy AI routes into the HERMES Command Center.

### Sprint 3: governed workflows

- Command Center templates create persisted `hermes_missions` drafts.
- State flow: `awaiting_approval -> approved -> running -> completed`.
- Alternative terminal states: `rejected` and `failed`; failed runs can be retried.
- Every completed run stores artifacts and execution metadata.
- Roadmap templates can be planned but cannot be marked as executed.

### Sprint 4: local acquisition golden path

1. Create and approve the Local Acquisition workflow.
2. HERMES produces the governed plan and an action artifact.
3. The action opens a prefilled, real Apify Google Maps search.
4. A result can open a prefilled live web audit.
5. The audited company can be converted to CRM with `google_maps` or `web_audit` provenance.
6. Approved active email sequences use Brevo and advance only after a provider message ID is returned.

### Sprint 5: performance and integration visibility

- Route pages are loaded with React lazy loading and Suspense.
- Integration health distinguishes configured providers from missing and unavailable capabilities.
- Social publishing and voice remain visibly unavailable until real OAuth/telephony implementations exist.

## Acceptance criteria

- The default workspace contains no calculated fake pipeline stages.
- A Google Maps provider failure stores no substitute demo companies.
- A sequence is not advanced unless Brevo confirms delivery.
- All template runs are persisted and require approval before execution.
- Roadmap capabilities cannot produce a false completed state.
- Desktop and mobile navigation expose the same core workflows.
- The production build emits route-specific chunks instead of one page bundle containing every screen.

## Remaining integration work

- Implement Meta and TikTok OAuth, token refresh, permission checks and publishing receipts.
- Select and integrate a telephony provider before enabling the voice receptionist.
- Add provider webhook ingestion for email delivery, bounce, reply and unsubscribe events.
- Apply the lead source enum migration before writing `google_maps` or `web_audit` source values in an existing database.

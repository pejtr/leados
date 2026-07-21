# OMNIVIDEO+ and FORGE Two-System Architecture

## Decision

The portfolio converges from four overlapping systems to two systems with one explicit lifecycle boundary:

> Before final video readiness = OMNIVIDEO+  
> After final video readiness = FORGE

No feature may be owned by both systems. Cross-system behavior is implemented through versioned events and identifiers, not shared UI modules or direct writes into the other system's database.

## System ownership

### OMNIVIDEO+ Studio

OMNIVIDEO+ owns everything required to create a final video:

- project and creative brief
- scripts, storyboards and shot plans
- generation and editing
- rendering and render jobs
- source media, generated assets and asset metadata
- versions, review notes and creation approvals
- final media validation and the final-video-ready decision

### FORGE Publisher

FORGE owns everything after a final video is ready:

- publishing and distribution
- influencer and creator relationships
- campaigns and monetization
- channel analytics and attribution
- scheduling and publication calendars
- social OAuth connections, permissions and token refresh
- revenue, commission and payout tracking
- post-publication optimization and reporting

## Boundary contract

OMNIVIDEO+ emits a versioned `FinalVideoReady` event only after the selected render passes its readiness checks. A minimum payload contains:

- event and schema version
- immutable video and render identifiers
- project and owner identifiers
- canonical asset URL or storage reference
- duration, aspect ratio, codec and file checksum
- title, description, captions and thumbnail references
- rights and territory metadata
- readiness timestamp and approving identity

FORGE consumes the event idempotently and creates a publication-ready media record. FORGE may report distribution outcomes back by event, but it must not mutate OMNIVIDEO+ creative records.

If a published asset needs a creative change, FORGE requests a new OMNIVIDEO+ version. It does not edit the final render in place.

## Migration from four systems to two

### Phase 1: inventory and ownership map

1. Inventory every feature, database table, API, scheduled job, OAuth credential and storage location in the four current systems.
2. Assign each item to OMNIVIDEO+, FORGE, shared infrastructure or retirement using the lifecycle boundary.
3. Identify duplicate identifiers and select canonical project, asset, video and campaign IDs.

### Phase 2: contracts and adapters

1. Define `FinalVideoReady` and downstream status event schemas.
2. Add idempotency keys, retries, dead-letter handling and audit logs.
3. Place adapters in front of legacy entry points so new writes go to the future owner while old reads remain available.

### Phase 3: data migration

1. Migrate creation projects, source assets, versions and renders to OMNIVIDEO+.
2. Migrate channels, OAuth connections, schedules, campaigns, influencers, analytics and revenue records to FORGE.
3. Reconcile counts, checksums, ownership, permissions and historical timestamps before switching traffic.

### Phase 4: workflow cutover

1. Route all new creation work to OMNIVIDEO+.
2. Emit readiness events for approved final renders and create FORGE publication records.
3. Route all new scheduling, publishing and monetization work to FORGE.
4. Run legacy systems read-only during a defined verification window.

### Phase 5: retirement

1. Export required audit archives and credential inventories.
2. Revoke duplicate OAuth applications, API keys and scheduler jobs.
3. Remove dual writes and legacy adapters only after reconciliation and rollback windows expire.
4. Decommission the two legacy systems with an owner-approved runbook.

## Risks

- Ambiguous readiness criteria can move unfinished media into publishing.
- Duplicate schedulers or OAuth applications can publish the same asset twice.
- Identifier mismatch can break attribution between video, campaign and revenue.
- Token migration may be prohibited by a social provider and require reauthorization.
- Historical analytics can lose attribution when campaign or channel keys change.
- Shared storage without immutable checksums can make published media diverge from the approved render.
- Dual writes can create conflicting state during cutover.

## Acceptance criteria

- Every current feature has one documented owner in OMNIVIDEO+ or FORGE.
- OMNIVIDEO+ can create, version, render, validate and mark a video ready without FORGE.
- FORGE can schedule, publish, monetize and measure a ready video without changing creative state.
- `FinalVideoReady` delivery is authenticated, versioned, idempotent, retryable and auditable.
- Replaying an event does not create duplicate FORGE media or publication jobs.
- OAuth credentials and revenue records exist only in FORGE.
- Source assets and render history exist only in OMNIVIDEO+.
- Migrated record counts and sampled checksums reconcile with the four source systems.
- Legacy schedulers and credentials are disabled before decommissioning.
- A tested rollback procedure exists for each cutover phase.

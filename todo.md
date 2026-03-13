# AI Lead Generation Platform - TODO

## Backend
- [x] Database schema: leads table with all metadata fields
- [x] Database schema: lead_sessions table for grouping generation runs
- [x] Run migration SQL
- [x] DB helpers: insert lead, get leads, get stats, get sessions
- [x] tRPC router: leads.generate (full pipeline: validate → scrape → enrich → save)
- [x] tRPC router: leads.list (with filter/search/pagination)
- [x] tRPC router: leads.stats (totals, enrichment rate, industry breakdown)
- [x] tRPC router: leads.export (JSON download)
- [x] tRPC router: leads.sessions (list generation sessions)
- [x] tRPC router: leads.deleteSession

## Frontend
- [x] Global dark theme + CSS variables
- [x] DashboardLayout with sidebar navigation
- [x] Dashboard home page with stats cards
- [x] Lead generation form (industry, location, count, seniority, Apify token)
- [x] Real-time progress/status during generation
- [x] Lead results view with icebreaker display
- [x] Lead history page with search + filter by industry/date
- [x] Statistics page with charts (industry breakdown, enrichment rate)
- [x] JSON export download button
- [ ] Google Sheets export (webhook URL input - planned)

## Quality
- [x] Vitest: leads router unit tests (10 tests passing)
- [ ] Checkpoint + publish

## Apify Integration
- [x] Add APIFY_TOKEN secret to environment
- [x] Rewrite leadPipeline.ts to use harvestapi/linkedin-company-search actor via Apify REST API
- [x] Map actor output fields (name, website, description, employeeCount, industries, locations) to lead schema
- [x] Add scraper source field to leads table (linkedin_apify | mock)
- [x] Add data source selector to Generate page (LinkedIn via Apify / Demo data)
- [x] Show real-time Apify run status (queued → running → succeeded)
- [x] Graceful fallback to mock data when Apify token is missing or run fails
- [x] Update Vitest tests for new pipeline (12 tests passing)

## CSV Export
- [x] Add csvExport tRPC query returning CSV string
- [x] Add CSV download button to Generate page results header
- [x] Add CSV download button to Lead History page toolbar

## Lead Status Tracking
- [x] Add status enum column to leads table (new | contacted | replied | qualified | disqualified)
- [x] Run migration SQL for status column
- [x] Add leads.updateStatus tRPC mutation
- [x] Add status badge + inline status changer dropdown to Lead History page
- [x] Add status filter to Lead History search bar

## Email Finder Enrichment (Website scraper via Apify)
- [x] Integrate caprolok/website-email-phone-finder actor into leadPipeline.ts
- [x] Call email finder after LinkedIn scrape, before icebreaker generation
- [x] Update lead email field with found email if empty
- [x] Add "Email found" badge to lead cards
- [x] Add enrichEmails toggle to Generate form (optional, costs Apify credits)
- [x] 17 Vitest tests passing (all 3 test files)

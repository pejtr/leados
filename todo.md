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

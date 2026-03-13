# AI Lead Generation Platform — Full Roadmap

## Core (Completed)
- [x] Database schema: leads + lead_sessions tables
- [x] tRPC routers: generate, list, stats, export, sessions, deleteSession
- [x] Lead generation pipeline: AI validate → Apify LinkedIn scrape → email enrichment → AI icebreaker
- [x] Dashboard with stats cards and recent sessions
- [x] Generate Leads page with data source selector and real-time progress
- [x] Lead History with search, industry filter, pagination
- [x] Statistics page with Recharts charts
- [x] JSON + CSV export (Generate + History)
- [x] Lead status tracking: new/contacted/replied/qualified/disqualified
- [x] Inline status dropdown in History
- [x] Status filter in History
- [x] Email enrichment via caprolok/website-email-phone-finder (Apify)
- [x] Apify token validated (LEADGEN22)
- [x] 17 Vitest tests passing

## Kanban Board View
- [x] Kanban board page with drag-and-drop pipeline columns (New/Contacted/Replied/Qualified/Disqualified)
- [x] Install @dnd-kit/core
- [x] Optimistic drag-and-drop status updates
- [x] Lead count badge per column header
- [x] Compact lead card design for Kanban view
- [x] Kanban route in App.tsx and DashboardLayout nav

## Bulk Actions
- [x] Checkbox on each lead row in list view
- [x] Select all / deselect all checkbox in header
- [x] Bulk status update dropdown + Set Status button
- [x] Bulk CSV export for selected leads
- [x] Bulk delete with confirmation dialog
- [x] bulkUpdateStatus and bulkDelete tRPC mutations

## Email Outreach Templates
- [x] DB schema: email_templates table
- [x] Migration SQL for email_templates
- [x] tRPC: templates.list, templates.create, templates.update, templates.delete
- [x] Templates page with editor and variable preview
- [x] Copy-to-clipboard for filled template

## Industry Segment Presets
- [x] Segment preset buttons on Generate form (Finance, Insurance, Mortgages, Investments, Real Estate, MLM, SaaS, Healthcare)
- [x] One-click preset fills industry, seniority, location

## Lead Quality Rating System
- [x] qualityRating column in leads table
- [x] Thumbs up / thumbs down buttons in History expanded row
- [x] tRPC: leads.rateQuality mutation

## ROI Tracking
- [x] dealValue and dealClosed columns in leads table
- [x] ROI page with deal value input per lead
- [x] Revenue vs cost dashboard (total pipeline value, closed deals, conversion rate)
- [x] ROI route in App.tsx and DashboardLayout nav

## Team Management
- [x] team_members table with email-based invites
- [x] Team page: invite by email, assign role (admin/agent)
- [x] tRPC: team.invite, team.list, team.remove, team.updateRole

## Public Landing Page
- [x] Hero section with CTA
- [x] Features section with icons
- [x] How it works section
- [x] Stats / social proof
- [x] Testimonials
- [x] Pricing section (3 tiers)
- [x] CTA contact form

## Quality & Polish
- [x] 17 Vitest tests passing (3 test files)
- [ ] Final checkpoint + publish

## Internationalization (i18n) — EN / CS / SK
- [x] Install react-i18next and i18next
- [x] Create translation files: en.json, cs.json, sk.json
- [x] Set up i18n provider in main.tsx with localStorage persistence
- [x] Build LanguageSwitcher component (EN / CS / SK toggle)
- [x] Add LanguageSwitcher to Landing page navbar and DashboardLayout sidebar footer
- [x] Translate Landing page (hero, features, how it works, pricing, testimonials, CTA)
- [x] Translate DashboardLayout (nav items, user menu)
- [x] Translate Home/Dashboard page (stats cards, quick actions)
- [x] Translate Generate page (form labels, segment presets, progress messages)
- [x] Translate History page (search, filters, bulk actions, lead cards)
- [x] Translate Kanban page (column headers, card labels)
- [x] Translate Stats page (chart labels, metric names)
- [x] Translate ROI page (deal value input, metrics)
- [x] Translate Templates page (editor, variable hints)
- [x] Translate Team page (invite form, role labels)
- [ ] Final checkpoint + publish

## Google Sheets Integration
- [x] Research and choose integration approach (Google Sheets API with service account)
- [x] Install googleapis npm package
- [x] Add GOOGLE_SERVICE_ACCOUNT_JSON secret to environment
- [x] Build backend: sheetsExport tRPC procedure (takes spreadsheetId + leads, appends rows)
- [x] Auto-create header row if sheet is empty
- [x] Build frontend: Google Sheets export modal with spreadsheet URL input
- [x] Add "Export to Google Sheets" button to History toolbar and Generate results
- [x] Show success toast with link to the spreadsheet after export
- [x] 19 Vitest tests passing (4 test files)
- [ ] Final checkpoint + publish

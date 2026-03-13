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

## ClickUp Export Integration
- [x] DB schema: webhook_configs table (stores webhook URLs and ClickUp API keys per user)
- [x] DB schema: integration_logs table (tracks all webhook/export events)
- [x] Migration SQL applied
- [x] Backend: ClickUp API client (create tasks from leads)
- [x] Backend: tRPC procedures for integration CRUD (add/edit/delete/test webhook)
- [x] Backend: Webhook dispatcher (POST lead data to user's webhook URL)
- [x] Frontend: Integrations page with Webhook config and ClickUp export UI
- [x] Wire webhook triggers into lead pipeline completion events
- [x] Add Integrations nav item to DashboardLayout
- [x] Route in App.tsx
- [x] Vitest tests for webhook and ClickUp integration
- [x] Push to GitHub

## Webhook Integration (Zapier/Make/n8n)
- [x] Generic webhook POST on lead generation complete
- [x] Configurable webhook URL per user
- [x] Test webhook button (sends sample payload)
- [x] Webhook delivery logs with status codes
- [x] Retry failed webhooks (up to 3 attempts)

## Language Consistency Fix
- [x] Fix hardcoded English strings in Landing.tsx (Industry Presets section)
- [x] Add missing i18n keys to cs.json, de.json, en.json

## Next Best Action Engine
- [x] DB schema: nba_recommendations table
- [x] Backend: AI analyzes lead data and generates ranked action recommendations (call/email/wait/qualify)
- [x] tRPC: nba.getRecommendations, nba.dismissRecommendation, nba.markActioned
- [x] Frontend: NBA page with action recommendations
- [x] Nav item + route in App.tsx

## B2B Matching
- [x] DB schema: match_profiles table (ICP definition per user)
- [x] Backend: AI company similarity matching (find companies similar to best customers)
- [x] tRPC: matching.saveProfile, matching.findMatches, matching.listMatches
- [x] Frontend: B2B Matching page with ICP builder and match results
- [x] Nav item + route in App.tsx

## AI SDR Agent
- [x] DB schema: sdr_campaigns table (campaign config + status + activity log)
- [x] Backend: Autonomous pipeline: generate leads → enrich → AI email → schedule send → track replies
- [x] tRPC: sdr.createCampaign, sdr.startCampaign, sdr.pauseCampaign, sdr.getCampaignStats
- [x] Frontend: AI SDR Agent page with campaign builder and activity log
- [x] Nav item + route in App.tsx

## Social Listening
- [x] DB schema: social_signals table (keyword monitors + matched posts)
- [x] Backend: Apify LinkedIn/Reddit keyword monitor, auto-add matches as leads
- [x] tRPC: social.createMonitor, social.listSignals, social.convertToLead
- [x] Frontend: Social Listening page with keyword setup and signal feed
- [x] Nav item + route in App.tsx

## Language Swap: Remove SK, Add DE
- [x] Delete sk.json
- [x] Create de.json with full German translations
- [x] Update i18n config to replace sk with de
- [x] Update LanguageSwitcher to show DE instead of SK
- [x] Update lang keys in en.json and cs.json

## Mobile Responsiveness Fix
- [x] Fix Landing page navbar on mobile (hamburger menu)
- [x] Fix language switcher display on mobile
- [x] Ensure all dashboard pages are mobile-friendly

## New Feature Roadmap (15 features)
- [x] 1. Website Tracking Pixel + AI ISP Filtering
- [x] 2. Similar Leads Engine ("Companies like this") — via B2B Matching
- [x] 3. Visitor Journey Analytics + Intent Score — via Tracking Pixel
- [x] 4. Smart Alert Rules (Slack + email, conditional)
- [x] 5. Decision-Maker Pre-filtering (AI) — via ICP Builder
- [x] 6. LinkedIn Mutual Connections — via Social Listening
- [x] 7. Smart Lists (behavioral filters + Autopilot)
- [x] 8. Real-time Email Verification (Bouncer API)
- [x] 9. Condition-Based Campaigns (If/Then)
- [x] 10. Icebreaker AI (personalized 1st sentence) — existing enhanced
- [x] 11. Agency Panel (multi-tenant, white-label)
- [x] 12. ClickUp Export (leads as Tasks) — existing enhanced
- [x] 13. Speed-to-Lead (instant follow-up)
- [x] 14. Webhook Export (Zapier/Make/n8n/Pabbly) — existing enhanced
- [x] 15. ICP Builder

## Additional New Features (Batch 2)
- [x] Tech Stack Detection (Precision.co style)
- [x] AI Agent Builder (multi-agent orchestration)
- [x] Enhance existing: AI SDR Agent, NBA Engine, Social Listening, B2B Matching

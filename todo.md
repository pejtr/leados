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
- [x] Fix ALL remaining hardcoded English strings in Landing.tsx (hero, testimonials, CTA, footer, badges)
- [x] Add 30+ new translation keys to en.json, cs.json, de.json

## LeadPro.com Integration Analysis
- [x] Research LeadPro.com features (CRM, Newsletters, Landing Pages, Task Tracker)
- [ ] Consider: Email Sequence Builder for automated follow-ups
- [ ] Consider: Task/Activity Tracker with reminders tied to pipeline
- [ ] Consider: Lead → Customer Lifecycle management
- [ ] Consider: Custom Mailing Lists and segmentation
- [ ] Consider: Stripe Payment Integration for monetization

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

## Dashboard Widgets
- [x] NBA recommendations widget (top 5 priority actions)
- [x] Recent alerts widget (last 5 triggered alerts)
- [x] Speed-to-Lead metrics widget (response time, config status)
- [x] Backend: uses existing endpoints (nba.list, alertRules.list, speedToLead.get)

## Futuristic Process Diagram
- [x] Replace "How It Works" section with quantum-tech futuristic animated diagram
- [x] Simple but sophisticated visual explaining the lead gen process
- [x] CSS-only animations (no JS libraries needed)

## A/B Test Mockup
- [x] Create /landing-b route with alternative design variant
- [x] Different hero layout, color accents, or CTA positioning for comparison

## Onboarding Wizard (First Login)
- [ ] DB: Add onboarding_completed flag to users table
- [ ] Backend: onboarding.getStatus, onboarding.saveIcp, onboarding.saveIntegrations, onboarding.complete endpoints
- [ ] Frontend: Multi-step wizard component (Welcome → ICP Definition → Integrations → Done)
- [ ] Auto-show wizard on first login (onboarding_completed = false)
- [ ] Skip option for users who want to set up later
- [ ] Wire into DashboardLayout to redirect new users
- [ ] Tests for onboarding endpoints

## Lusha-Inspired Landing Page Improvements
- [ ] Proof-first hero with testimonial card
- [ ] Email-only CTA (Enter work email + Start for free)
- [ ] Trust badges (No credit card required, G2 rating placeholder)
- [ ] Trusted by logo bar under hero
- [ ] Sticky mobile CTA bar
- [ ] Specific ROI numbers in testimonials section

## Branding Update to LeadGen CRM Automation
- [ ] Update app title to LeadGen CRM Automation
- [ ] Set new logo (V1 light for header, V3 icon for favicon)
- [ ] Update Landing page branding
- [ ] Update DashboardLayout branding

## SEO Fixes for Landing Page (/)
- [x] Fix page title to 30-60 characters using document.title
- [x] Add meta description (50-160 characters)
- [x] Add meta keywords tag

## Email Sequence Builder (LeadPro-inspired)
- [x] DB schema: email_sequences + email_sequence_steps + email_sequence_enrollments tables
- [x] Backend: sequence CRUD, enroll lead, step scheduling logic
- [x] Frontend: Sequences page with step builder (day 1/3/7 intervals)
- [x] Nav item + route in App.tsx

## Task/Activity Tracker (LeadPro-inspired)
- [x] DB schema: tasks table (title, due_date, lead_id, status, reminder_at)
- [x] Backend: tasks CRUD tRPC procedures
- [x] Frontend: Tasks page with calendar view and lead-linked tasks
- [x] Nav item + route in App.tsx

## Capture Planning Workflow (GrowthLab-inspired)
- [x] DB schema: capture_plans table with stages (Identify/Research/Outreach/Qualify/Propose/Close)
- [x] Backend: capture plan CRUD + stage progression
- [x] Frontend: Capture Planning page with visual stage workflow
- [x] Nav item + route in App.tsx

## Market Intelligence Reports (GrowthLab-inspired)
- [x] Backend: AI generates market intelligence report per industry (trends, competitors, spend signals)
- [x] Frontend: Market Intelligence page with report generation and display
- [x] Nav item + route in App.tsx

## Training Knowledge Base (GrowthLab-inspired)
- [x] DB schema: knowledge_articles table (title, category, content, video_url)
- [x] Backend: articles CRUD + seed with BD best practices content
- [x] Frontend: Knowledge Base page with categories and article viewer
- [x] Nav item + route in App.tsx

## Competitive Landscape Mapping (GrowthLab-inspired)
- [x] Backend: AI analyzes competitors for a given company/industry
- [x] Frontend: Competitive Map page with visual positioning chart
- [x] Nav item + route in App.tsx

## Onboarding Wizard Frontend
- [x] Multi-step wizard component (Welcome → ICP → Integrations → Done)
- [x] Auto-show on first login (onboarding_completed = false)
- [x] Wire into DashboardLayout redirect

## Branding Update
- [x] Update VITE_APP_TITLE to "LeadGen CRM Automation"
- [x] Update DashboardLayout sidebar logo/name
- [x] Update Landing page brand name

## Stripe Payment Integration
- [x] Add Stripe feature via webdev_add_feature
- [x] Create subscription plans (Starter $49/Growth $99/Pro $249)
- [x] Backend: checkout session, webhook handler, billing portal
- [x] Frontend: Billing page with real Stripe checkout + plan management
- [x] DB: stripeCustomerId, stripeSubscriptionId, subscriptionStatus, subscriptionPlan fields on users

## Onboarding Wizard (Complete Implementation)
- [x] Build OnboardingWizard component (4 steps: Welcome, ICP, Integrations, Done)
- [x] Step 1: Welcome — animated intro, key features highlight, user name display
- [x] Step 2: ICP Definition — industry, location, company size, seniority selectors
- [x] Step 3: Integrations — optional webhook/ClickUp setup, skip option
- [x] Step 4: Done — confetti animation, quick action buttons (Generate Leads, View Dashboard)
- [x] Progress bar and step indicators
- [x] Auto-show on first login via DashboardLayout (onboardingCompleted = false)
- [x] Skip button on all steps except Done
- [x] Wire trpc.onboarding.saveIcp and trpc.onboarding.complete mutations
- [x] Add /onboarding route in App.tsx

## Stripe Real Price IDs Setup
- [x] Create Stripe products via API (Starter, Growth, Pro)
- [x] Create monthly + yearly prices for each product
- [x] Store Price IDs as environment secrets
- [x] Update stripeProducts.ts with real Price IDs
- [x] Test checkout flow end-to-end with test card

## Email Sequence Cron Job
- [ ] Server-side scheduler checks enrollments every hour for due steps
- [ ] Sends follow-up emails via built-in email helper
- [ ] Marks steps as sent and advances enrollment to next step
- [ ] Handles completion (all steps sent) and error states

## Onboarding Wizard Frontend (Complete)
- [ ] Multi-step modal: Welcome → ICP Definition → Integrations → Done
- [ ] Step 1: Welcome with feature highlights and avatar
- [ ] Step 2: ICP form (industry, company size, seniority, location)
- [ ] Step 3: Integrations (webhook URL, Zapier, optional)
- [ ] Step 4: Done with confetti animation and quick-start actions
- [ ] Auto-show when onboardingCompleted = false
- [ ] Wire into DashboardLayout

## Stripe Checkout Flow on Billing Page
- [ ] Billing page shows current plan status from user subscription
- [ ] Subscribe buttons call trpc.billing.createCheckout with correct Price ID
- [ ] Opens Stripe checkout in new tab
- [ ] Success/cancel redirect back to /billing
- [ ] Manage Subscription button calls billing portal for existing subscribers
- [ ] Show active plan badge on current plan card

## AI Assistant Chatbot
- [x] Backend: tRPC chat.sendMessage procedure with LLM + user context injection (leads, pipeline, sequences stats)
- [x] Backend: Streaming SSE support via chat.streamMessage
- [x] Frontend: Floating chat button (bottom-right, all dashboard pages)
- [x] Frontend: Slide-in chat panel with message history, markdown rendering, typing indicator
- [x] Frontend: Quick action prompts (Find leads, Analyze pipeline, Write icebreaker, Summarize today)
- [x] Wire into DashboardLayout

## Setup Progress Widget
- [x] Backend: onboarding.getProgress procedure returning % complete + which steps done
- [x] Frontend: Dashboard widget with progress bar, step checklist, quick links to ICP/Sequences/Integrations
- [x] Auto-hide when 100% complete

## AI Assistant Chatbot (Full Platform Access)
- [x] Backend: aiChat.sendMessage with LLM tool-calling (read stats, list leads, update ICP, create sequence, configure integrations)
- [x] Backend: Tool definitions for all major platform actions
- [x] Frontend: Floating chat button (bottom-right, all dashboard pages)
- [x] Frontend: Slide-in panel with AIChatBox, quick prompts, action confirmation toasts
- [x] Wire into DashboardLayout globally

## AI Sales Personas for Chatbot
- [x] Define 33 persona system prompts (11 Sales, 11 Finance, 11 Leadership)
- [x] Backend: persona param in aiChat.sendMessage
- [x] Frontend: persona selector in chatbot widget with category tabs
- [x] Setup Progress widget on Home.tsx
- [x] Floating chatbot widget in DashboardLayout

## Self-Improving AI Agent
- [x] DB: ai_agent_memory table (stores learnings, optimizations, performance snapshots)
- [x] DB: ai_performance_log table (tracks actions taken, outcomes, improvement cycles)
- [x] Backend: aiChat.sendMessage with full LLM tool-calling (20+ tools: read/write leads, ICP, sequences, stats, alerts, campaigns)
- [x] Backend: Autonomous performance monitor scheduler (every 6h: analyze metrics, detect issues, auto-optimize, log learnings)
- [x] Frontend: Floating AI chat widget (global, all dashboard pages) with action execution + confirmation
- [x] Frontend: Setup Progress widget on dashboard
- [ ] Frontend: AI Insights panel showing recent autonomous actions and performance trends

## AI Insights Panel (Dashboard)
- [x] Backend: aiChat.insights procedure (aggregates perf logs, memory, chat stats)
- [x] Frontend: 3-column panel on dashboard (AI Agent Actions, AI Memory, AI Performance)
- [x] Empty states for new users

## Persona Favorites
- [x] DB: user_persona_favorites table
- [x] Backend: aiChat.toggleFavorite and aiChat.getFavorites procedures
- [x] Frontend: Favorites tab in AIChatWidget
- [x] Heart toggle button on each persona card

## Chat History Page (/ai-advisor)
- [x] Frontend: /ai-advisor page with full conversation history
- [x] Search conversations by keyword
- [x] Grouped by session (30-min gaps)
- [x] Expandable conversation threads
- [x] Stats row (total messages, questions, memories, cycles)
- [x] Favorite personas sidebar
- [x] AI Memory sidebar
- [x] New Chat persona picker modal
- [x] Added AI Advisor to sidebar nav

## OLD_PLACEHOLDERrd)
- [ ] Backend: aiChat.insights query returning recent performance logs, memory learnings, autonomous actions
- [ ] Frontend: AI Insights section on Home.tsx dashboard with 3 sub-sections (Actions, Trends, Memory)
- [ ] Auto-refresh every 60s

## Persona Favorites
- [ ] DB: user_persona_favorites table (userId, personaId)
- [ ] Backend: aiChat.getFavorites, aiChat.toggleFavorite procedures
- [ ] Frontend: Star/pin button on each persona card in chatbot widget
- [ ] Frontend: "Favorites" tab as first tab in chatbot widget (shows pinned personas)
- [ ] Persist favorites per user

## Chat History Page (/ai-advisor)
- [ ] Backend: aiChat.getHistory with pagination + search
- [ ] Backend: aiChat.getSessionMessages (group messages by session/date)
- [ ] Frontend: /ai-advisor page with conversation list, search bar, and message viewer
- [ ] Frontend: "Resume" button to open chatbot widget with selected persona
- [ ] Nav item in DashboardLayout sidebar
- [ ] Route in App.tsx

## Branding Rename: LeadGen CRM Automation → LeadGen CRM Automation
- [x] Update all hardcoded "LeadGen CRM Automation" strings in Landing.tsx
- [x] Update DashboardLayout sidebar logo/name
- [x] Update page title in index.html
- [x] Update meta tags in Landing.tsx
- [x] Update server-side messages and i18n files

## Voice Input in Chat Widget
- [x] Frontend: Microphone button in chat textarea using Web Speech API
- [x] Show recording indicator (animated pulse) while listening
- [x] Auto-fill textarea with transcribed text on speech end
- [x] Handle browser permission errors gracefully
- [x] Disable mic button when browser doesn't support Web Speech API

## Persona Performance Scoring
- [x] DB: persona_ratings table (userId, personaId, sessionId, rating, feedback, createdAt)
- [x] Backend: aiChat.ratePersona procedure
- [x] Backend: aiChat.getPersonaRatings procedure (aggregated scores per persona)
- [x] Frontend: Thumbs up/down rating UI after each AI response in chat widget
- [x] Frontend: "Top Rated Experts" section on /ai-advisor page

## Proactive AI Morning Briefings
- [x] DB: morning_briefings table
- [x] Backend: morningBriefing.generate, getLatest, dismiss procedures
- [x] Frontend: Pinned briefing card on dashboard (top leads, pipeline alerts, next actions)
- [x] Dismiss + regenerate buttons
- [x] Empty state with Generate Briefing CTA
- [ ] Frontend: Briefing visible in /ai-advisor history

## Visual Redesign — Premium AI Product Aesthetic
- [ ] New design system: deep space dark bg (#050508), electric violet/cyan accent palette, Inter + Geist fonts
- [ ] Global CSS: glassmorphism cards, animated gradient mesh background, glow effects, micro-animations
- [ ] DashboardLayout: premium sidebar with gradient logo, animated active states, glow nav indicators
- [ ] Home/Dashboard: gradient stat cards, animated counters, premium section headers
- [ ] Landing page: cinematic hero with animated gradient orbs, premium typography, social proof bar
- [ ] All pages: consistent glassmorphism cards, hover glow effects, smooth transitions

## Sprint 1: Predictive Lead Scoring + LinkedIn Outreach
- [x] DB: predictive_scores table
- [x] Backend: leads.getPredictiveScores and leads.computePredictiveScore procedures
- [x] Frontend: Score badges on leads in History.tsx (color coded: green/yellow/red)
- [x] DB: sequence_steps stepType + linkedinNote fields
- [x] Backend: sequences.generateLinkedInMessage procedure
- [x] Frontend: Sequences.tsx redesigned with LinkedIn/Call step types, AI generate button

## Visual Redesign — Premium Billionaire Tier
- [x] index.css: Deep space dark, electric violet/cyan, glassmorphism, animated gradient system
- [x] index.html: Premium fonts (Space Grotesk + Inter)
- [x] DashboardLayout: Gradient logo, glow nav items, premium animated sidebar
- [x] Home.tsx: Animated stat counters, pipeline funnel infographic, activity pulse chart, glassmorphism cards, gradient hero header

## Sprint 2: AI Follow-up Bot + Meeting Scheduling
- [ ] DB: meeting_links table (userId, title, slug, duration, availabilityJson, createdAt)
- [ ] DB: follow_up_sessions table (leadId, userId, status, nextFollowUpAt, meetingBooked, meetingAt)
- [ ] Backend: followUp.createMeetingLink procedure (generate unique booking slug)
- [ ] Backend: followUp.getAvailability / followUp.bookMeeting procedures
- [ ] Backend: followUp.startSession / followUp.getActiveSessions procedures
- [ ] Backend: Scheduler — every 30min check for due follow-ups, generate AI email with meeting link
- [ ] Frontend: Meeting Scheduler page (/meetings) with availability config and booking link generator
- [ ] Frontend: Follow-up Bot widget on dashboard (active sessions, next scheduled follow-up)
- [ ] Frontend: Booking page (/book/:slug) — public page for leads to pick a time slot
- [ ] Nav item + route in App.tsx

## Animated Landing Page
- [ ] Cinematic hero section with animated gradient mesh orbs (CSS + JS)
- [ ] Scroll-triggered section reveals (Intersection Observer)
- [ ] Animated particle/dot grid background
- [ ] Premium feature showcase with staggered card animations
- [ ] Animated counter stats section (matching dashboard style)
- [ ] Smooth scroll navigation
- [ ] Premium glassmorphism pricing cards with hover glow
- [ ] Mobile-optimized animations (reduced motion)

## Conversational Intelligence
- [ ] DB: call_recordings table (userId, leadId, filename, s3Url, duration, transcription, aiAnalysis, sentiment, actionItems, createdAt)
- [ ] Backend: calls.uploadRecording procedure (S3 upload + Whisper transcription)
- [ ] Backend: calls.analyzeCall procedure (LLM analysis: sentiment, objections, next actions, CRM notes)
- [ ] Backend: calls.list / calls.getDetail procedures
- [ ] Backend: Auto-update lead notes/status from call analysis
- [ ] Frontend: Call Intelligence page (/calls) with upload, transcript viewer, AI insights
- [ ] Frontend: Call summary card on lead detail (expandable)
- [ ] Nav item + route in App.tsx

## Hero Image: Královna Leadů
- [ ] Generate AI image: Queen of Leads on private jet, luxury, champagne, gold accents
- [ ] Upload to CDN
- [ ] Integrate as hero background on Landing page

## Czech Translation (Remaining Pages)
- [x] Translate Kanban page to Czech
- [x] Translate History page to Czech
- [x] Translate ROI Tracker page to Czech
- [x] Translate Statistics page to Czech
- [x] Translate Billing page to Czech (new pricing + Enterprise column)
- [ ] Translate Settings pages to Czech

## Demo-First Pricing Redesign
- [x] Update pricing to Starter €149/mo, Growth €399/mo, Pro €799/mo
- [x] Add Enterprise tier (cena na dotaz / Contact Sales)
- [x] Update stripeProducts.ts with new pricing
- [x] Billing page redesigned with 4-column pricing (Starter/Growth/Pro/Enterprise)

## Sales CRM Super Module UI
- [x] Deal Pipeline Kanban board (stages: New/Qualified/Presentation/Proposal/Negotiation/Won/Lost)
- [x] Sales Dashboard with revenue metrics, win rate, quota tracking
- [x] Deal create/edit modal with all fields
- [x] Commission tracker widget on Sales Dashboard
- [x] Quota progress bar per user
- [x] CRM tRPC router (deals, activities, quotas, commissions)
- [x] Sidebar nav items: Deal Pipeline + Sales Dashboard

## Rename Chatbot to "Chat Agent" (SEO)
- [x] Update DashboardLayout sidebar nav item label (via i18n key sidebar.aiAdvisor)
- [x] Update i18n keys in cs.json (sidebar.aiAdvisor, home.aiAdvisor, aiAdvisor33, aiAdvisorPersonas)
- [x] Update AiAdvisor.tsx page title and header to "Chat Agent"
- [x] Update AIChatWidget.tsx floating button and header to "Chat Agent"

## Chat Agent SEO Improvements
- [ ] Change URL slug /ai-advisor → /chat-agent in App.tsx
- [ ] Update DashboardLayout nav path to /chat-agent
- [ ] Update all internal links (AIChatWidget, Home.tsx) to /chat-agent
- [ ] Add meta title/description to AiAdvisor.tsx page for Google indexing
- [ ] Create Chat Agent feature section on Landing page with 33 personas showcase

## Landing Page i18n Fix
- [ ] Translate HOW_IT_WORKS section (Define Your ICP, AI Generates Leads, Personalized Outreach, Close More Deals)
- [ ] Translate Chat Agent section (all hardcoded English strings)
- [ ] Translate Meeting Scheduler feature card (hardcoded English in FEATURES array)
- [ ] Audit all other hardcoded English strings in Landing.tsx
- [ ] Add all missing keys to cs.json, en.json, de.json

## Multi-Project Analytics Hub (API Command Center)
- [x] DB schema: connected_projects + project_events tables (migration applied)
- [x] Public data ingestion endpoint (POST /api/ingest/:apiKey) — accepts sale, pageview, signup, refund, adspend, custom
- [x] Health check endpoint (GET /api/ingest/:apiKey/ping)
- [x] tRPC procedures: projects.create, list, delete, regenerateKey, getStats, getAllStats
- [x] Projects Dashboard page (/projects) — unified analytics across all connected projects
- [x] Aggregate KPI cards (total revenue, profit, ROAS, sales count)
- [x] Per-project metrics cards (sales, revenue, ROAS, CVR, profit)
- [x] SDK snippet generator in UI (copy-paste JS code with fetch examples)
- [x] Sidebar nav item: "Projekty / Command Center" with link icon

## HOW_IT_WORKS i18n + Deal Activity Log + Deep Sleep Reset Project
- [x] Translate HOW_IT_WORKS section on landing page (4 steps) to Czech/German
- [x] Add Deal Activity Log timeline to Deal Pipeline (backend + frontend)
- [x] Pre-seed Deep Sleep Reset as first connected project with API key: dsr_96c230588e470b67d0c1215f369de3072980bc27cd951f38

## AI Deal Scoring
- [ ] DB: Add aiScore (0-100), aiScoreReasoning, aiScoredAt columns to deals table
- [ ] Backend: tRPC crm.scoreDeal procedure — calls LLM with deal context (stage, value, activities, days in stage, company, contact)
- [ ] Backend: crm.batchScoreDeals — score all unscored deals for current user
- [ ] Frontend: AI score badge on deal cards in Pipeline Kanban (color-coded: green/yellow/red)
- [ ] Frontend: AI Scoring panel in deal edit modal (score gauge, reasoning, re-score button)
- [ ] Auto-trigger scoring on deal create/update
- [ ] Vitest test for scoreDeal procedure

## AI Constitution (AI Ústava)
- [ ] Create ai_constitution table in drizzle/schema.ts and apply migration
- [ ] Build constitutionRouter (get/save) in server/routers/constitution.ts
- [ ] Create getConstitutionContext() helper for injecting into AI calls
- [ ] Build AIConstitution.tsx Settings page with all form fields
- [ ] Add route /settings/ai-constitution to App.tsx
- [ ] Add sidebar nav entry in DashboardLayout
- [ ] Wire constitution context into invokeLLM calls across platform

## Sales Strategy Features (from DeepSleepReset 100k project)
- [x] Exit-Intent Popup — lead capture with email opt-in when user tries to leave Landing page
- [x] Social Proof Live Counter — animated counter "X companies using LeadOS" on Landing page
- [ ] Pre-checkout Wait Popup — swipeable add-ons with live total counter before checkout
- [x] Urgency/Scarcity Banner — countdown timer for limited offers on pricing section
- [ ] Order Bump component — one-click add-on at checkout (e.g., "Add Onboarding Call +€99")
- [ ] Funnel Progress Indicator — visual step tracker on pricing/signup flow
- [ ] Abandoned Lead Recovery — email sequence triggered when user starts signup but doesn't complete
- [ ] Smart Popup — behavior-triggered popup after 30s on Landing page (different from exit-intent)
- [ ] Testimonial Rotator — auto-rotating social proof with real metrics on Landing page
- [ ] One-Click Upsell — post-signup upsell offer page (upgrade to higher tier)

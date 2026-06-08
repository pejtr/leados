# LeadOS — AI Lead Generation & CRM Platform

## Project Overview

LeadOS is a full-stack AI-powered lead generation and sales CRM platform. It generates B2B leads via LinkedIn/Xing scraping (Apify), enriches them with AI icebreakers, and provides a complete sales pipeline with CRM, sequences, analytics, and a multi-agent AI orchestrator (HERMES).

**Primary markets**: Czech Republic, Germany, Austria, Switzerland (DACH). UI languages: CS / EN / DE.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui (Radix UI) |
| Routing | wouter 3 (patched) |
| State / Data | tRPC 11 + TanStack Query 5 |
| Backend | Express 4, Node.js (tsx for dev) |
| Database | MySQL + Drizzle ORM |
| Auth | Manus OAuth (JWT sessions via `server/_core/sdk.ts`) |
| AI / LLM | Manus Forge API → `gemini-2.5-flash` (see `server/_core/llm.ts`) |
| Payments | Stripe (subscriptions + webhooks) |
| File storage | AWS S3 (call recordings) |
| i18n | react-i18next — EN / CS / DE in `client/src/i18n/` |
| Package manager | pnpm |
| Tests | Vitest |

## Directory Structure

```
leados/
├── client/src/
│   ├── pages/          # ~60 page components
│   ├── components/     # Shared components (DashboardLayout, AIChatWidget, etc.)
│   ├── components/ui/  # shadcn/ui primitives
│   ├── hooks/          # Custom hooks
│   ├── i18n/           # Translation files (en.json, cs.json, de.json)
│   ├── lib/            # trpc.ts client setup
│   └── App.tsx         # All routes defined here
├── server/
│   ├── _core/          # Framework: express setup, auth SDK, LLM, env
│   ├── routers/        # Feature tRPC routers
│   ├── routers.ts      # Aggregates ALL routers into appRouter
│   └── *.ts            # Feature-level business logic files
├── drizzle/
│   ├── schema.ts       # ALL database table definitions (single source of truth)
│   ├── relations.ts    # Drizzle ORM relations
│   └── *.sql           # Migration files (0000–0023)
├── shared/
│   ├── _core/errors.ts
│   ├── const.ts        # Shared constants (COOKIE_NAME, etc.)
│   └── types.ts
└── references/
    └── periodic-updates.md   # Manus Heartbeat cron documentation
```

## Development Commands

```bash
pnpm dev          # Start dev server (Vite + Express, hot reload)
pnpm build        # Production build
pnpm start        # Start production server
pnpm test         # Run vitest tests
pnpm db:push      # Generate + apply Drizzle migrations
pnpm check        # TypeScript type check
pnpm format       # Prettier
```

## Environment Variables

```env
# Required
DATABASE_URL=mysql://user:pass@host:3306/leados
JWT_SECRET=<random secret for session signing>

# Manus platform (auth + LLM)
VITE_APP_ID=<Manus project app ID>
OAUTH_SERVER_URL=<Manus OAuth server URL>
OWNER_OPEN_ID=<Manus owner openId>
BUILT_IN_FORGE_API_URL=<Manus LLM API base URL>
BUILT_IN_FORGE_API_KEY=<Manus LLM API key>

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_STARTER_YEARLY=
STRIPE_PRICE_GROWTH_MONTHLY=
STRIPE_PRICE_GROWTH_YEARLY=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=

# AWS S3 (call recordings)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=

# Third-party integrations
APIFY_TOKEN=                      # Lead scraping
GOOGLE_SERVICE_ACCOUNT_JSON=      # Google Sheets export
GEMINI_API_KEY=                   # Deep Think layer in Computer Flow
DEEP_SLEEP_RESET_API_KEY=         # DSR project monitoring
```

## Architecture Patterns

### tRPC
- All API calls go through tRPC at `/api/trpc`
- Routers are in `server/routers/` + some directly in `server/*.ts`
- All routers aggregated in `server/routers.ts` → `appRouter`
- Client access via `client/src/lib/trpc.ts`

### Auth Flow
- Uses Manus OAuth: user logs in via `ManusDialog` → OAuth callback → `server/_core/oauth.ts` exchanges code for token → creates JWT session cookie
- Every tRPC call goes through `createContext` in `server/_core/context.ts` which calls `sdk.authenticateRequest()`
- User identity stored in MySQL `users` table with `openId` as unique key

### Database
- Schema in `drizzle/schema.ts` — **this is the single source of truth**
- Add new tables here, then run `pnpm db:push` to generate + apply migration
- Migrations live in `drizzle/*.sql` (auto-generated)

### LLM Calls
- All AI calls go through `invokeLLM()` in `server/_core/llm.ts`
- Currently calls Manus Forge API (`forge.manus.im`) with `gemini-2.5-flash`
- **To switch to Anthropic**: change `resolveApiUrl()` and `BUILT_IN_FORGE_API_KEY` → Anthropic API key, model → `claude-sonnet-4-6` etc.
- `invokeLLM` is OpenAI-compatible format (messages, tools, tool_choice)

## Key Pages & Features

| Route | File | Description |
|---|---|---|
| `/` | Landing.tsx | Public landing page (CZ/EN/DE) |
| `/dashboard` | Home.tsx | Main dashboard with widgets |
| `/generate` | Generate.tsx | Lead generation form + Apify scraping |
| `/history` | History.tsx | Lead list with bulk actions |
| `/kanban` | Kanban.tsx | Lead pipeline board |
| `/deal-pipeline` | DealPipeline.tsx | Sales CRM Kanban |
| `/sales` | SalesDashboard.tsx | Revenue metrics + commission |
| `/hermes` | Hermes.tsx | HERMES AI orchestrator (flagship) |
| `/computer-flow` | ComputerFlow.tsx | Multi-brain parallel AI execution |
| `/sequences` | Sequences.tsx | Email + LinkedIn outreach sequences |
| `/billing` | Billing.tsx | Stripe subscription management |
| `/projects` | ProjectsHub.tsx | Multi-project API analytics hub |
| `/deep-sleep` | DeepSleepDashboard.tsx | DeepSleepReset project monitoring |
| `/ai-advisor` | AiAdvisor.tsx | Chat agent history + personas |
| `/global-earnings` | GlobalEarnings.tsx | Cross-project earnings dashboard |
| `/admin/integrations` | AdminIntegrations.tsx | API keys + webhooks management |

## Manus-Specific Components (require attention for self-hosting)

1. **`server/_core/sdk.ts`** — Manus OAuth client. Handles login, JWT sessions, user sync. Must be replaced or configured with valid `OAUTH_SERVER_URL`.
2. **`server/_core/llm.ts`** — Calls `forge.manus.im`. Replace URL + key to use Anthropic/OpenAI directly.
3. **`server/_core/heartbeat.ts`** — Manus Heartbeat cron SDK. Used for scheduled tasks.
4. **`vite-plugin-manus-runtime`** — Dev plugin, harmless but Manus-specific.
5. **`client/src/components/ManusDialog.tsx`** — Login modal with Manus OAuth + Google Sign-In.
6. **`client/public/__manus__/`** — Manus debug collector (safe to ignore).

## HERMES AI Orchestrator

HERMES is the flagship AI feature — a meta-agent that routes queries to specialized sub-agents:
- **Backend**: `server/hermesAgent.ts` (intent routing, sub-agent dispatch)
- **Router**: `server/hermesRouter.ts` (tRPC: chat, missions, mastermind, computerFlow)
- **Frontend**: `client/src/pages/Hermes.tsx`
- Auto-briefing on page load, Czech as primary language
- HERMES mode toggle in `AIChatWidget.tsx`

## Computer Flow (Multi-Brain)

Perplexity-style parallel AI execution:
- DECOMPOSER → splits query into 2-5 sub-tasks
- EXECUTOR → parallel sub-agents (Scout / Analyst / Strategist / DeepThink)
- SYNTHESIZER → merges results
- Optional Gemini 2.5 Pro deep think layer
- Backend: `server/computerFlow.ts`

## Connected External Projects

| Project | API Key | Purpose |
|---|---|---|
| Deep Sleep Reset | `dsr_96c230588e470b67d0c1215f369de3072980bc27cd951f38` | Sleep product monitoring |
| Human Design Map | `lsk_a669...` | HDM project analytics |

## Scheduled Jobs

- **Autopilot**: `server/autopilotScheduler.ts`
- **Email sequences**: `server/sequenceScheduler.ts` (hourly)
- **Daily report**: `server/dailyReportScheduler.ts`
- **HERMES digest**: `server/hermesDigest.ts` (08:00 CET daily via node-cron)
- **Webhook retry**: `server/webhookRetryScheduler.ts` (every 5 min via Heartbeat)

## Active TODO Items (as of June 2026)

### High Priority
- Phase 8: Google Maps Scraper + Web Audit Tool (webové zakázky)
- Phase 7: HDM CRM bidirectional integration
- HERMES Daily Digest scheduler finish
- AI Deal Scoring on pipeline cards
- Sprint 2: Meeting Scheduler + AI Follow-up Bot

### Medium Priority
- Visual Redesign (premium glassmorphism aesthetic)
- Animated Landing Page
- DACH market expansion (GDPR section, Xing, EU VAT)
- Chat Agent SEO (/chat-agent slug, Landing page section)

### Pending
- Email Sequence Cron Job (server-side scheduler)
- Phase 6: A/B testing UpgradeNudge + ROI animator + Affiliate leaderboard
- Conversational Intelligence (call recordings + Whisper transcription)

## Testing

```bash
pnpm test           # All tests
pnpm test -- --run  # Single run (no watch)
```

Test files: `server/*.test.ts` — covers leads, CRM, sheets, webhooks, API keys, features, Apify, sequences, Stripe prices, prompt security.

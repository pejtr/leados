# Audit – LEADOS (ONYX.OS)

## Current State

The repository currently contains a full‑stack application built with a modern React frontend and a Node.js backend (tRPC). The codebase includes:

- **Client** (`client/`): React (Vite) with TypeScript, Tailwind CSS, shadcn/ui components, and tRPC client.
- **Server** (implied by tRPC router structure): tRPC server with Prisma ORM (PostgreSQL).
- **Shared** (`shared/`): shared types and error classes.
- **Documentation**: minimal existing docs.

The application appears to be a lead‑generation / CRM / marketing platform with features such as AI chat, campaign management, meeting scheduling, knowledge base, and integrations.

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend     | Node.js, tRPC, Prisma ORM                       |
| Database    | PostgreSQL (via Prisma)                         |
| Auth        | NextAuth.js (implied by `useAuth` hook)         |
| i18n        | Custom i18n (en, cs, de)                        |
| State       | React hooks, tRPC queries/mutations             |
| Testing     | Not yet observed                                |
| CI/CD       | Not yet observed                                |

## Main Modules

- **AI Chat** (`AIChatBox.tsx`, `ComputerFlow.tsx`): LLM‑powered chat and agent orchestration.
- **Campaigns** (`AdCampaigns.tsx`): Ad campaign tracking (Meta, Google, LinkedIn).
- **AI Agent Builder** (`AiAgentBuilder.tsx`): Create and manage AI agents.
- **AI Skills** (`AiSkills.tsx`): Manage reusable AI skill templates.
- **Autopilot** (`Autopilot.tsx`): Automated campaign execution.
- **Knowledge Base** (`KnowledgeBase.tsx`): Article management.
- **Meeting Scheduler** (`MeetingScheduler.tsx`): Follow‑up scheduling.
- **Market Intel** (`MarketIntel.tsx`): Market research reports.
- **Integrations** (`Integrations.tsx`): External service integrations (ClickUp, Slack, webhooks).
- **Sheets Export** (`SheetsExportModal.tsx`): Export leads to Google Sheets.
- **Ares Search** (`AresSearch.tsx`): Czech business registry search.
- **Public Portfolio ROAS** (`PublicPortfolioROAS.tsx`): Public ROAS dashboard.
- **Onboarding Wizard** (`OnboardingWizard.tsx`): User onboarding flow.
- **UI Components**: shadcn/ui components (dialog, drawer, sidebar, etc.).

## Routes / APIs

The application uses tRPC for all API calls. Observed route patterns (from file names and imports):

- `trpc.lead.*` – lead management
- `trpc.campaign.*` – campaign CRUD
- `trpc.autopilot.*` – autopilot runs
- `trpc.aiAgent.*` – AI agent management
- `trpc.aiSkill.*` – AI skill management
- `trpc.knowledgeBase.*` – knowledge base articles
- `trpc.integration.*` – integration settings
- `trpc.portfolioShare.*` – public portfolio sharing
- `trpc.ares.*` – ARES search
- `trpc.meeting.*` – meeting scheduling
- `trpc.marketIntel.*` – market intelligence reports
- `trpc.sheets.*` – Google Sheets export

Frontend routes (React Router) are not fully enumerated but include pages such as `/`, `/campaigns`, `/ai-agent-builder`, `/ai-skills`, `/autopilot`, `/knowledge-base`, `/meeting-scheduler`, `/market-intel`, `/integrations`, `/ares-search`, `/public-portfolio-roas`, `/onboarding`, etc.

## Integrations

- **Google Ads** (`useGoogleAds.ts`): Conversion tracking.
- **Google Sheets** (`SheetsExportModal.tsx`): Export leads.
- **ClickUp** (`Integrations.tsx`): Task creation.
- **Slack** (`Integrations.tsx`): Notifications.
- **Webhooks** (`Integrations.tsx`): Generic webhook triggers.
- **Google Maps** (`Map.tsx`): Map display.
- **ARES** (`AresSearch.tsx`): Czech business registry.
- **LLM** (implied by `AIChatBox.tsx`): AI chat via tRPC mutation.

## Risks

1. **Naming inconsistency**: The repository is named LEADOS but the strategic brand is ONYX.OS / OMNICORE. This may cause confusion.
2. **Hardcoded brand references**: Many components contain hardcoded references to "LEADOS", "OPTIMATEO", "ONYX WEBY", "OMNICORE", "ONYX OS", and legacy names like "Optivio". These need to be centralized.
3. **Missing tests**: No test files observed. Risk of regressions during refactoring.
4. **No CI/CD configuration**: No GitHub Actions or similar pipeline observed.
5. **Environment variables**: `.env` values are not documented; risk of exposing secrets.
6. **No rollback strategy**: No documented process for reverting changes.
7. **Dependency on external services**: Google Ads, Google Sheets, ClickUp, Slack, ARES – any outage affects functionality.

## Missing Pieces

- **Centralized brand configuration** (e.g., `brand.config.ts`).
- **Environment variable documentation** (`.env.example`).
- **Testing infrastructure** (unit, integration, e2e).
- **CI/CD pipeline**.
- **Deployment documentation**.
- **API documentation** (beyond tRPC introspection).
- **Database schema documentation** (Prisma schema comments).
- **Security audit** (authentication, authorization, data validation).
- **Performance monitoring**.
- **Error tracking** (e.g., Sentry).

## First Safe Implementation Tasks

1. Create `docs/` directory with audit, brand architecture, omnicore architecture, roadmap, and implementation plan.
2. Centralize brand names into a configuration file (e.g., `brand.config.ts`) without changing any UI code.
3. Add `.env.example` with placeholder values (no real secrets).
4. Add basic CI workflow (lint, typecheck, build) without modifying production code.
5. Document existing routes and APIs in `docs/`.
6. Identify and list all hardcoded brand references for future replacement.
7. Create a rollback strategy document.

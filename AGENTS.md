# AGENTS.md — OPTIHUB / ONYX OS

## Commands

```bash
pnpm dev          # Dev: tsx watch (Express) + Vite middleware (client), port 3000
pnpm build        # Production: vite build → dist/public/ + esbuild server → dist/
pnpm start        # Production: node dist/index.js
pnpm test         # vitest run --pool=forks --poolOptions.forks.singleFork (37 files, 498 tests)
pnpm check        # tsc --noEmit
pnpm format       # Prettier
pnpm db:push      # drizzle-kit generate → drizzle-kit migrate (requires DATABASE_URL)
```

After `pnpm build`, the server entrypoint is `dist/index.js` and static assets are in `dist/public/`.

## Architecture

**Monolith**: React 19 frontend + Express backend in one process. Single `package.json` at root. pnpm workspaces are **not** used — `@/` and `@shared/` are TypeScript path aliases + Vite resolve aliases.

### Directory ownership
| Dir | What |
|-----|------|
| `client/` | React app. Vite root = `client/`, entry = `client/src/main.tsx`. `tsx` in dev is for the **server only**. |
| `server/` | Express + tRPC backend. Entry = `server/_core/index.ts`. All feature logic and ~20 router files. |
| `drizzle/` | DB schema (`schema.ts`) + auto-generated `*.sql` migrations. Single source of truth for tables. |
| `shared/` | Constants + types shared between client and server. No runtime dependencies. |

### tRPC
- All API at `/api/trpc`. Routers live in `server/routers/` subdirectory (grouped by domain) and are aggregated in `server/routers.ts` → `appRouter`.
- Client typed via `client/src/lib/trpc.ts` which imports the server's `AppRouter` type.
- Uses `superjson` transformer — Dates and other non-JSON types survive the wire.
- `protectedProcedure` requires auth (middleware in `server/_core/trpc.ts`). The middleware narrows `ctx.user` to non-null `User`, so inside `protectedProcedure`/`adminProcedure` you can use `ctx.user` directly without `as any`.

### Auth
- Manus OAuth → `server/_core/sdk.ts` → JWT session cookie (`app_session_id`).
- Every tRPC call goes through `server/_core/context.ts` → `sdk.authenticateRequest()`.
- **Local dev bypass**: set `DEV_AUTO_LOGIN=true` (and `OWNER_OPEN_ID`) to skip OAuth entirely.

### LLM calls
- Single entrypoint: `invokeLLM()` in `server/_core/llm.ts`. OpenAI-compatible contract.
- Provider priority: `ANTHROPIC_API_KEY` → Direct Anthropic; `DEEPSEEK_API_KEY` → DeepSeek; fallback → Manus Forge (`gemini-2.5-flash`).
- All callers just use `invokeLLM()` — never call a provider directly.
- Built-in retry: transient failures (HTTP 429/500/502/503/504, network errors) are retried with exponential backoff. Tune via `LLM_MAX_RETRIES` (default 3) and `LLM_RETRY_BASE_MS` (default 1000). See `server/_core/llm.test.ts`.

### Environment config
- All env vars are centralized in `server/_core/env.ts` (`ENV` object). Prefer `ENV.foo` over `process.env.FOO` in new code so there's a single typed source of truth.

## Quirks & Gotchas

### Build path asymmetry
Vite `root` is `client/` but `outDir` is `../dist/public`. Server is built **separately** by esbuild to `dist/`. Do not assume Vite builds the whole app.

### tsconfig excludes test files
`tsconfig.json` explicitly excludes `**/*.test.ts`. Typechecking (`pnpm check`) does **not** validate tests. Tests only run through vitest.

### Stripe webhook order matters
`registerStripeWebhook(app)` must be called **before** `express.json()` in `server/_core/index.ts` (Stripe needs the raw body for signature verification). Same for HDM webhook.

### wouter patched
`wouter@3.7.1` has a pnpm patch (`patches/wouter@3.7.1.patch`) that exposes all route paths on `window.__WOUTER_ROUTES__`. pnpm auto-applies patches on install.

### Port fallback
Dev server tries `$PORT` or 3000, then auto-falls-back up to 20 ports higher if busy. No explicit port errors — it just picks the next one.

### Scheduled jobs start with the server
Autopilot, Telegram, sequence scheduler, daily report, and HERMES/HERA digest cron jobs all start in the `server.listen()` callback. They require no separate process.

### DB schema is single source
All tables defined in `drizzle/schema/` (one file per domain, re-exported via `drizzle/schema/index.ts` barrel). After editing a domain file: `pnpm db:push` (generates SQL → applies). Never edit `drizzle/*.sql` by hand.

### TypeScript path aliases
`@/` = `client/src/`, `@shared/` = `shared/`. Configured in `tsconfig.json` (paths) and `vite.config.ts`/`vitest.config.ts` (resolve.alias). Must match in all three places.

### i18n bootstrap
`@/i18n` is imported first in `main.tsx` before App renders. react-i18next with EN/CS/DE, initialized in `client/src/i18n/`.

### shadcn/ui style
`components.json` specifies `"style": "new-york"` with `"baseColor": "neutral"`. Use the shadcn CLI with these settings for new components.

## Known Issues

### DB helpers are split into `server/db/` by domain
All DB helper functions live in `server/db/<domain>.ts` files, re-exported via `server/db/index.ts` barrel (backward-compatible with `import { ... } from "./db"`). When adding new table operations, add to the matching domain file (or create one) and re-export from the barrel. Do NOT recreate a monolithic `server/db.ts`.

### No client-side tests
Only server tests exist. Client components are not tested. If modifying client code, verify manually via `pnpm dev`.

### `.env` contains live secrets
The `.env` file has real API keys (Stripe, Anthropic, DeepSeek, Google, Telegram, AWS). **Never commit this file.** If keys are exposed, rotate them immediately.

### `pnpm build` client step needs memory
The Vite client build is memory-hungry on constrained machines (can OOM / exceed 10 min). The server esbuild build (`npx esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`) is fast and validates all server imports. Run it instead when you only changed server code.

## Testing

- Files: `server/**/*.test.ts` (node env, aliases matching Vite). No client tests.
- Run one: `pnpm test -- -t "name pattern"` or `pnpm test -- server/leads.test.ts`.
- Router tests use `appRouter.createCaller(fakeCtx)` with a fabricated user — no HTTP layer. They hit the **real MySQL** when `DATABASE_URL` is set; when unset, `getDb()` returns `null` and db helpers warn + no-op, so tests still pass.
- LLM-dependent tests mock `./_core/llm` with `vi.mock`; pure unit tests (apiKeys, promptSecurity) need no mocks.

## Key entrypoints for agents

| Task | Where to look |
|------|---------------|
| Add a new tRPC route | `server/routers/` → import in `server/routers.ts` |
| Add a new DB table | `drizzle/schema/` → `pnpm db:push` |
| Add a new DB helper | `server/db/<domain>.ts` → re-export from `server/db/index.ts` |
| Add a new page | `client/src/pages/` → lazy import in `client/src/App.tsx` |
| Modify LLM behavior | `server/_core/llm.ts` (never call providers directly) |
| Change auth flow | `server/_core/sdk.ts` + `server/_core/context.ts` |
| Add webhook event | `server/webhookDispatcher.ts` |
| Modify HERMES agent | `server/hermesAgent.ts` (intent routing, sub-agents) |
| Change Stripe prices | `server/stripeWebhook.ts` + `server/stripe.prices.test.ts` |

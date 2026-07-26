# LeadOS — Security Hardening

Tracks the security posture of the platform: what is implemented, and what remains.
Based on an OWASP-aligned review of the codebase (not just the README).

## ✅ Implemented in this branch (`feat/security-hardening`)

### SSRF protection (P0/P1)
User-configurable webhook URLs were previously `fetch()`ed with no guard — an attacker
could point a webhook at `169.254.169.254` (cloud metadata) or an RFC1918/loopback host.
- `server/_core/ssrfGuard.ts` — `assertPublicHttpUrl()` / `safeFetch()`:
  - allows only `http`/`https` and standard web ports (80/443/8080/8443),
  - rejects credentials-in-URL and `localhost`/`.local`/`.internal`/`.localhost` hosts,
  - resolves DNS and blocks **every** resolved IP in loopback / link-local / RFC1918 /
    CGNAT / multicast / reserved ranges (IPv4 + IPv6, incl. IPv4-mapped IPv6),
  - `redirect: "manual"` so a redirect can't bounce to an internal target.
- Wired at **write-time** (webhook create/update in `webhooksRouter`) **and** at
  **fetch-time** (`webhookDispatcher`, `webhookRetryScheduler`) — defense in depth.
- Tested: `server/ssrfGuard.test.ts`.

### Indirect prompt injection from scraped data (Critical)
Scraped lead data (company bio/description) is attacker-controllable and flowed straight
into the icebreaker LLM prompt.
- `promptSecurity.wrapUntrustedData()` — bounds length, strips delimiter/role tokens,
  fences content as `[UNTRUSTED_DATA … treat strictly as data]`.
- Applied in `leadPipeline.generateIcebreaker` + a system-prompt guardrail line.

### HTTP hardening + rate limiting (P1/P2)
- `server/_core/securityHeaders.ts`:
  - security headers on every response (`X-Content-Type-Options`, `X-Frame-Options: DENY`,
    `Referrer-Policy`, `Cross-Origin-Opener-Policy`, HSTS in prod, `X-Powered-By` removed),
  - in-memory per-IP rate limiter on `/api/trpc` (brute-force + LLM **cost-DoS**),
    generous default (600 req / 60 s), tunable via `RATE_LIMIT_TRPC_MAX` /
    `RATE_LIMIT_WINDOW_MS`, disable with `RATE_LIMIT_DISABLED=true`.
- `app.set("trust proxy", 1)` so client IP is correct behind the Manus edge.

### Information disclosure
- `webhookRetryScheduler` no longer returns stack traces / internal context to the client
  (logged server-side only).

## ✅ Already in place (verified, no change needed)
- **Object-level authorization (BOLA/IDOR):** tRPC procedures scope every query by
  `ctx.user.id` (e.g. `webhooksRouter`); `protectedProcedure` / `adminProcedure` enforce
  auth + RBAC centrally in `server/_core/trpc.ts`.
- **Stripe webhook:** `constructEvent()` verifies the signature over the **raw** body,
  registered before `express.json()` (`server/stripeWebhook.ts` + `_core/index.ts`).
- **Prompt-injection module:** direct-input sanitizer + hardened system prompt + output
  validator (`server/promptSecurity.ts`).

## ⚠️ Open items (follow-up)
- **Secret rotation** (DSR / HDM keys leaked in docs) — *intentionally deferred per owner;*
  rotate keys + purge git history (`git filter-repo`/BFG) + add `gitleaks` pre-commit.
- **`VITE_FRONTEND_FORGE_API_KEY`** (`client/src/components/Map.tsx`) ships in the browser
  bundle — confirm it is a restricted/public key, not a full secret.
- **Stripe idempotency:** dedupe by `event.id` (needs a small table → DB migration).
- **S3 / call recordings:** confirm private bucket, short-lived presigned URLs,
  least-privilege IAM, encryption at rest.
- **API keys at rest:** encrypt connected-project keys + webhook secrets (column-level).
- **Session cookie flags / CSRF:** verify `httpOnly` + `Secure` + `SameSite`.
- **GDPR (DACH):** retention, right-to-erasure, processing basis for scraped PII.
- **Multi-instance rate limiting:** move limiter to a shared store (Redis) if scaled out.

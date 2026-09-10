# OPTIHUB public edge and private ONYX architecture

## Canonical ownership

- **OPTIMATEO** is the commercial, contractual and payment owner.
- **OPTIHUB** is the public customer and machine entry layer.
- **ONYX OS** is the private operating intelligence and control plane.
- **ONYXO** is the private executive and orchestration layer over ONYX
  capabilities.
- **OMNICORE** is an independent QA, security and release-policy layer. It does
  not become the public hub or the system of record for customer workflows.
- **LEADOS, OMNI PROFIT, OMNIVIDEO and OMNIADS** are private capability
  services reached only after the edge gate.

## Topology

```text
                 OPTIMATEO
          commercial and legal owner
                       |
                       v
                  OPTIHUB.cz
          customer and platform boundary
                       |
       +---------------+---------------+
       |               |               |
       v               v               v
 app.optihub.cz   api.optihub.cz   mcp.optihub.cz
       |               |               |
       +------ AUTH / TENANT / POLICY --+
                       |
           OMNICORE QA/security verdict
                       |
                       v
                private ONYX router
                       |
       +---------------+---------------------------+
       |               |              |            |
       v               v              v            v
    LEADOS        OMNI PROFIT      OMNIVIDEO     OMNIADS
```

`www.optihub.cz` is the public information and onboarding surface. Protected
application actions start at `app.optihub.cz`. Services and external systems
enter through `api.optihub.cz`; agents enter through `mcp.optihub.cz`.

There is no public `onyxos.optihub.cz` or direct public endpoint for ONYX core,
the router, orchestration, databases, workers or capability services.

## Edge contract

Every protected ingress must execute these controls before dispatch:

1. Authenticate the user, service or agent.
2. Resolve the tenant from trusted identity, never from an unverified body.
3. Authorize the requested capability and scopes.
4. Evaluate server-side policy and required human approval.
5. Apply rate limits per tenant, credential and capability.
6. Write a redacted audit record with request and correlation identifiers.

Machine requests carry `requestId`, `tenantId`, `actorId`, `scopes` and
`policyVersion`. The edge creates or verifies this context; downstream services
must not trust caller-supplied tenant or policy identity.

The canonical registry for these invariants is
`shared/optihubBoundary.ts`. It is an architecture contract, not proof that DNS,
OAuth, MCP transport or production routing already exists.

## Payment boundary

Payments remain separate:

```text
pay.optimateo.com -> ONYX PAY -> Comgate
```

OPTIHUB may display billing state, but API and MCP credentials must not acquire
payment-provider authority. Payment callbacks require their own signature,
idempotency and audit controls.

## OMNIVIDEO P0 path

The first machine use case may use this boundary without exposing the GPU host:

```text
ChatGPT
  -> mcp.optihub.cz
  -> auth / tenant / policy
  -> private ONYX router
  -> OMNIVIDEO control plane
  -> outbound-polling Windows worker
  -> local generation backend
  -> verified artifact
```

`mcp.optihub.cz` exposes narrow OMNIVIDEO capabilities, never ComfyUI, shell,
filesystem or a worker port. A generation job is not `COMPLETED` until its
artifact exists and its provenance can be retrieved.

## Current repository reality

- The repository currently builds one Express/Vite deployment, not four edge
  services and a private service network.
- `server/hubRoute.ts` describes `/api/hub/*` as `OMNICORE Hub`, but the route is
  not registered by `server/_core/index.ts`.
- `server/externalApi.ts` contains Bearer-key endpoints but is also not
  registered by the server entrypoint.
- The existing hub key resolves a project, not a canonical tenant, scopes and
  policy context.
- No production evidence currently proves the `app`, `api` or `mcp` OptiHub
  hostnames, remote MCP transport or private ONYX network boundary.

Therefore the gateway is **contract-defined and P1-implemented, not
production-deployed**. Mounting the legacy hub route publicly before adding the
complete edge gate is explicitly prohibited.

## P1 API edge - implementation status

`server/optihub/` now implements the P1 API edge and is mounted by
`server/_core/index.ts` at `/api/optihub` (before tRPC and before the SPA
fallback). What exists today:

- One ordered, fail-closed pipeline for every protected request: correlation id,
  credential extraction, credential verification (SHA-256 + constant-time
  compare), credential status/version check, tenant resolution, scope
  authorization, policy evaluation, rate limiting, handler, audit record.
- A stable machine-readable error contract
  (`code`/`message`/`reason`/`requestId` plus a fixed HTTP status). No stack
  traces, dependency names or private hostnames are returned.
- The edge is mounted before the app-wide 50 MB parser and owns a strict 64 kB
  body limit. Oversized or malformed bodies return `PAYLOAD_TOO_LARGE` (413) or
  `BAD_REQUEST` (400) through the same JSON contract, before any handler runs.
  Unmatched `/api/optihub/*` paths also return the JSON contract instead of
  falling through to the SPA.
- Credential provisioning, rotation (with an explicit, bounded overlap and a
  compare-and-swap claim) and revocation as an **internal** service module.
  There is deliberately **no credential-management HTTP surface**: the public API
  only consumes credentials.
- A versioned manifest at `GET /api/optihub/v1/manifest`, plus a health/ready
  split. `mcp`, `app` and `www` are declared but **not enabled** in P1 and return
  `SURFACE_NOT_ENABLED`.
- Audit records on every terminal decision, with redaction and a hashed client
  address. The internal correlation id is returned as
  `x-optihub-request-id`.

Honest limitations of this phase:

- The credential store, rate limiter and audit sink are **in-memory reference
  implementations**. They are swappable behind `EdgeCredentialStore`,
  `EdgeRateLimiter` and `EdgeAuditSink`, but they do not survive a restart and are
  not shared across processes. A durable store (and Redis-backed limiting) is the
  next step before the edge can be called production-ready.
- The pipeline is exercised by real HTTP tests against loopback, but the router
  is **not deployed** and no DNS, TLS or proxy routing for `api.optihub.cz` is
  proven here.
- Registration in the entrypoint is proven by a source-level assertion plus
  runtime router tests, not by booting the full production entrypoint.
- The repository-wide `tsc --noEmit` has ~1300 pre-existing errors unrelated to
  this change; the `server/optihub` module passes a targeted strict check.

## Delivery phases

### P0 - boundary contract

- Canonical domains, roles and private services are represented in code.
- Automated tests prevent accidental public ONYX hostnames and missing edge
  controls.
- Documentation supersedes the old ONYX-as-public-app interpretation.

### P1 - authenticated API edge

Status: implemented in `server/optihub/` (see the implementation status above).

- Credential hashing/rotation, tenant resolution, scoped authorization, policy
  evaluation, rate limiting and audit logging.
- A versioned `api.optihub.cz` manifest and a health/readiness split.
- `/api/hub/*` and `/api/external/*` remain unregistered. No credential-management
  HTTP surface exists.
- Still required before "production-ready": durable credential storage, a shared
  rate limiter, and deployed DNS/TLS routing for `api.optihub.cz`.

### P1.1 - adversarial hardening

- Fuzz the pipeline: malformed headers, oversized bodies, duplicate credential
  headers, timing and enumeration checks, audit-sink outage, limiter outage.
- Prove that no denial path reaches a handler and no secret reaches a response or
  the audit trail, under adversarial input.
- Add abuse/synthetic monitoring and an alert on edge denial anomalies.

### P2 - MCP edge

- Implement remote MCP auth and tenant-bound capability dispatch.
- It must reuse the **same** authentication, tenant, scope, policy, rate-limit and
  audit contract as `api.optihub.cz`. `mcp.optihub.cz` must not become a second
  side door around the API edge.
- Start with read-only discovery, then the four OMNIVIDEO P0 capabilities.
- Prove the local-worker truth gate without cloud fallback.

### P2.1 - service identity

- Give each private service a workload identity and mutual authentication, so the
  edge-to-ONYX hop is authenticated in both directions.

### P3 - application edge and ONYXO/worker bridge

- Move customer workflows to `app.optihub.cz` using the same identity, tenant and
  policy contracts.
- Only then bridge ONYXO and outbound-polling workers.
- Keep operator-only ONYX diagnostics private.

## Acceptance criteria

- Only the four declared OptiHub hosts are public ecosystem entrypoints.
- No private ONYX service has a public hostname or bypass route.
- API, MCP and protected app calls fail closed without all required controls.
- Tenant identity cannot be selected solely from caller input.
- MCP exposes capabilities, never infrastructure access.
- Payment authority remains isolated at `pay.optimateo.com`.
- Logs are correlation-friendly and do not contain secrets.
- Documentation and runtime state clearly distinguish `contract_ready` from
  `available` and production-proven.

## Non-goals of P0

- DNS, Railway or proxy deployment.
- Public MCP transport.
- OMNIVIDEO worker implementation or real video generation.
- Migration or removal of legacy API routes.
- Rebranding every historical UI string.

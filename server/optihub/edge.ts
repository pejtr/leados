/**
 * OPTIHUB EDGE - the api.optihub.cz request pipeline.
 *
 * This router is the only public programmable entry into the ecosystem. It does
 * not proxy, forward or tunnel anything: a handler here is a local function, and
 * nothing in this file can reach a private ONYX service.
 *
 * Every protected request walks the same ordered pipeline and fails closed:
 *
 *   REQUEST
 *   -> correlation/request id
 *   -> credential extraction
 *   -> credential verification
 *   -> credential status/version check
 *   -> tenant resolution
 *   -> scope verification
 *   -> policy evaluation
 *   -> rate-limit evaluation
 *   -> route handler
 *   -> audit record
 *
 * A denial at any step audits and returns; the handler is never invoked.
 */

import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
  type Router,
} from "express";

import {
  getOptiHubIngressSurface,
  isForbiddenDirectOnyxHostname,
  optihubIngressSurfaces,
  type OptiHubIngressId,
  type OptiHubIngressSurface,
} from "../../shared/optihubBoundary";
import {
  hashClientAddress,
  truncateUserAgent,
  type EdgeAuditRecord,
  type EdgeAuditSink,
} from "./audit";
import {
  DEFAULT_EDGE_AUDIT_POLICY,
  EdgeAuditWriter,
  type EdgeAuditPolicy,
  type EdgeOperationRisk,
} from "./auditPolicy";
import { resolveClientIp, type TrustedProxyChainMode } from "./clientIp";
import type { EdgePreAuthLimiter } from "./preAuth";
import {
  credentialStatusAt,
  hashEdgeSecret,
  isEdgeSecretFormat,
  verifyEdgeSecret,
  type EdgeCredentialRecord,
} from "./credentials";
import {
  createEdgeCorrelation,
  EDGE_EXTERNAL_REQUEST_ID_HEADER,
  EDGE_INTERNAL_REQUEST_ID_HEADER,
  type EdgeCorrelation,
} from "./correlation";
import { edgeErrorBody, edgeErrorStatus, type EdgeErrorCode } from "./errors";
import {
  authorize,
  EDGE_POLICY_VERSION,
  type EdgePolicyConfig,
  type EdgePolicyDecision,
  type EdgeResourceRef,
} from "./policy";
import {
  edgeRateLimitFor,
  type EdgeRateLimiter,
  type EdgeRateLimitDecision,
} from "./rateLimit";
import { hasEdgeScope, type EdgeScope } from "./scopes";
import type { EdgeCredentialStore } from "./store";
import {
  buildMachineGatewayContext,
  checkRequestedTenant,
  readRequestedTenantId,
  resolveEdgeTenant,
  type EdgePrincipal,
  type MachineGatewayContext,
} from "./tenant";

export const EDGE_MOUNT_PATH = "/api/optihub";
export const EDGE_API_VERSION = "v1";
export const EDGE_SERVICE_NAME = "optihub-edge";
/**
 * The edge reads at most a tiny JSON body (for tenant comparison). It must not
 * inherit the application's large upload parser, so it owns a strict limit and
 * is mounted before the global parser.
 */
export const EDGE_BODY_LIMIT = "64kb";

export interface EdgeDeps {
  readonly store: EdgeCredentialStore;
  readonly audit: EdgeAuditSink;
  readonly limiter: EdgeRateLimiter;
  readonly policy: EdgePolicyConfig;
  /** Build/deploy identifier surfaced by health and manifest. Not a secret. */
  readonly version: string;
  readonly clock?: () => number;
  /** Ingress surfaces enabled in this phase. P1 enables only `api`. */
  readonly enabledSurfaces?: readonly OptiHubIngressId[];
  /** Extra hosts treated as the API surface (local development). */
  readonly additionalApiHosts?: readonly string[];
  readonly readiness?: () => boolean | Promise<boolean>;
  /** Cheap shared counter that runs before credential verification. */
  readonly preAuthLimiter?: EdgePreAuthLimiter;
  /**
   * Proxy peers whose forwarding headers may be trusted. Empty (the default)
   * means "no proxy in front": X-Forwarded-* is ignored entirely.
   */
  readonly trustedProxies?: readonly string[];
  /**
   * How the forwarding chain is read when the socket peer is trusted.
   * Default `last_hop` (append semantics). `platform_replaced_xff` is opt-in for
   * ingresses that overwrite client-supplied X-Forwarded-For.
   */
  readonly trustedProxyChain?: TrustedProxyChainMode;
  /** How an unavailable audit sink is handled. Never silently ignored. */
  readonly auditPolicy?: EdgeAuditPolicy;
}

/** Internal: `EdgeDeps` plus the derived writer and proxy model. */
interface ResolvedEdgeDeps extends EdgeDeps {
  readonly auditWriter: EdgeAuditWriter;
  readonly trustedProxies: readonly string[];
  readonly trustedProxyChain: TrustedProxyChainMode;
}

export interface EdgeHandlerContext {
  readonly requestId: string;
  readonly externalRequestId: string | null;
  readonly correlation: EdgeCorrelation;
  readonly principal: EdgePrincipal;
  readonly gatewayContext: MachineGatewayContext;
  readonly surface: string;
  readonly host: string;
  readonly action: string;
  readonly policyDecision: EdgePolicyDecision;
  readonly rateLimit: EdgeRateLimitDecision;
  readonly request: Request;
}

export type EdgeRouteHandler = (context: EdgeHandlerContext) => unknown | Promise<unknown>;

export interface ProtectedEdgeRoute {
  readonly method: "get" | "post";
  readonly path: string;
  readonly action: string;
  readonly requiredScope: EdgeScope;
  readonly policyAction?: string;
  /**
   * How audit failure is handled for this route. Defaults: `publication:execute`
   * is `execute`, other POSTs are `mutating`, everything else is `read`.
   */
  readonly risk?: EdgeOperationRisk;
  readonly resolveResource?: (request: Request) => EdgeResourceRef | undefined;
  readonly successStatus?: number;
  readonly handler: EdgeRouteHandler;
}

export interface PublicEdgeHandlerResult {
  readonly status?: number;
  readonly body: unknown;
}

export interface PublicEdgeRoute {
  readonly method: "get" | "post";
  readonly path: string;
  /**
   * Liveness/readiness must answer the platform health checker, whose Host is
   * not the public API hostname. Such routes skip the surface gate but are still
   * denied on a forbidden ONYX hostname.
   */
  readonly hostAgnostic?: boolean;
  readonly handler: (request: Request) => PublicEdgeHandlerResult | Promise<PublicEdgeHandlerResult>;
}

export interface EdgeRouterOptions {
  readonly publicRoutes?: readonly PublicEdgeRoute[];
  readonly protectedRoutes?: readonly ProtectedEdgeRoute[];
}

interface SurfaceResolution {
  readonly kind: "enabled" | "disabled" | "forbidden" | "unknown";
  readonly surface?: OptiHubIngressSurface;
  readonly host: string;
}

export function normalizeEdgeHost(hostHeader: string | undefined): string {
  const raw = (hostHeader ?? "").trim().toLowerCase();
  const withoutScheme = raw.replace(/^[a-z]+:\/\//, "");
  return (withoutScheme.split("/")[0] ?? "").replace(/:\d+$/, "").replace(/\.$/, "");
}

export function resolveEdgeSurface(
  hostHeader: string | undefined,
  deps: Pick<EdgeDeps, "enabledSurfaces" | "additionalApiHosts">,
): SurfaceResolution {
  const host = normalizeEdgeHost(hostHeader);
  const enabled = deps.enabledSurfaces ?? ["api"];
  const additional = deps.additionalApiHosts ?? [];

  if (host === "") return { kind: "unknown", host };

  // A direct ONYX hostname is never a valid entry, whatever it resolves to.
  if (isForbiddenDirectOnyxHostname(host)) return { kind: "forbidden", host };

  const declared = getOptiHubIngressSurface(host);
  if (declared !== undefined) {
    if (enabled.includes(declared.id)) return { kind: "enabled", surface: declared, host };
    return { kind: "disabled", surface: declared, host };
  }

  if (additional.includes(host)) {
    const apiSurface = optihubIngressSurfaces.find(surface => surface.id === "api");
    if (apiSurface !== undefined) return { kind: "enabled", surface: apiSurface, host };
  }

  return { kind: "unknown", host };
}

export function createOptiHubEdgeRouter(deps: EdgeDeps, options: EdgeRouterOptions = {}): Router {
  const router = express.Router();
  const resolved: ResolvedEdgeDeps = {
    ...deps,
    auditWriter: new EdgeAuditWriter(deps.audit, deps.auditPolicy ?? DEFAULT_EDGE_AUDIT_POLICY),
    trustedProxies: deps.trustedProxies ?? [],
    trustedProxyChain: deps.trustedProxyChain ?? "last_hop",
  };
  const publicRoutes = options.publicRoutes ?? defaultPublicEdgeRoutes(deps);
  const protectedRoutes = options.protectedRoutes ?? defaultProtectedEdgeRoutes();

  // Edge-owned, strict body limit. Never inherit the app-wide upload parser.
  router.use(express.json({ limit: EDGE_BODY_LIMIT }));

  for (const route of publicRoutes) {
    router[route.method](route.path, (req, res) => {
      void handlePublicRoute(resolved, route, req, res);
    });
  }

  for (const route of protectedRoutes) {
    router[route.method](route.path, (req, res) => {
      void handleProtectedRoute(resolved, route, req, res);
    });
  }

  // Unmatched edge paths must answer with the JSON contract, never fall through
  // to the SPA or any other surface.
  router.use((req: Request, res: Response) => {
    const correlation = createEdgeCorrelation(req.headers[EDGE_EXTERNAL_REQUEST_ID_HEADER]);
    const resolution = resolveEdgeSurface(req.headers.host, deps);
    setCorrelationHeaders(res, correlation);
    void recordAudit(resolved, {
      timestamp: nowOf(resolved),
      requestId: correlation.requestId,
      externalRequestId: correlation.externalRequestId,
      surface: resolution.surface?.id ?? "unknown",
      host: resolution.host,
      method: req.method,
      route: `${EDGE_MOUNT_PATH}${req.path}`,
      action: "route_not_found",
      credentialId: null,
      tenantId: null,
      actorId: null,
      decision: "DENY",
      code: "NOT_FOUND",
      reason: "unknown_edge_route",
      status: 404,
      ipHash: clientIpHash(resolved, req),
      userAgent: truncateUserAgent(req.headers["user-agent"]),
    }, "read");
    res.status(404).json(edgeErrorBody("NOT_FOUND", "unknown_edge_route", correlation.requestId));
  });

  // Body-parser failures must produce the same machine-readable contract and
  // must never surface a stack trace.
  router.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const type = (error as { type?: unknown } | null)?.type;
    const tooLarge = type === "entity.too.large";
    const code: EdgeErrorCode = tooLarge ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST";
    const reason = tooLarge ? "request_body_too_large" : "request_body_invalid";
    const resolution = resolveEdgeSurface(req.headers.host, deps);
    const correlation = createEdgeCorrelation(req.headers[EDGE_EXTERNAL_REQUEST_ID_HEADER]);
    setCorrelationHeaders(res, correlation);
    void recordAudit(resolved, {
      timestamp: nowOf(resolved),
      requestId: correlation.requestId,
      externalRequestId: correlation.externalRequestId,
      surface: resolution.surface?.id ?? "unknown",
      host: resolution.host,
      method: req.method,
      route: `${EDGE_MOUNT_PATH}${req.path}`,
      action: "body_parse",
      credentialId: null,
      tenantId: null,
      actorId: null,
      decision: "DENY",
      code,
      reason,
      status: edgeErrorStatus(code),
      ipHash: clientIpHash(resolved, req),
      userAgent: truncateUserAgent(req.headers["user-agent"]),
    }, "read");
    res.status(edgeErrorStatus(code)).json(edgeErrorBody(code, reason, correlation.requestId));
  });

  return router;
}

/** Mount the edge on an existing Express app. Returns the router for tests. */
export function registerOptiHubEdge(
  app: Express,
  deps: EdgeDeps,
  options: EdgeRouterOptions = {},
): Router {
  const router = createOptiHubEdgeRouter(deps, options);
  app.use(EDGE_MOUNT_PATH, router);
  return router;
}

// ---------------------------------------------------------------------------
// Default routes
// ---------------------------------------------------------------------------

export function defaultPublicEdgeRoutes(deps: EdgeDeps): readonly PublicEdgeRoute[] {
  return [
    {
      method: "get",
      path: "/v1/manifest",
      handler: () => ({ body: buildManifest(deps) }),
    },
    {
      method: "get",
      path: "/health",
      hostAgnostic: true,
      handler: () => ({
        body: { status: "ok", service: EDGE_SERVICE_NAME, version: deps.version },
      }),
    },
    {
      method: "get",
      path: "/ready",
      hostAgnostic: true,
      handler: async () => {
        const ready = await checkReadiness(deps);
        return { status: ready ? 200 : 503, body: { status: ready ? "ready" : "not_ready" } };
      },
    },
  ];
}

export function defaultProtectedEdgeRoutes(): readonly ProtectedEdgeRoute[] {
  return [
    {
      method: "get",
      path: "/v1/context",
      action: "projects:read",
      requiredScope: "projects:read",
      handler: context => ({
        tenantId: context.principal.tenantId,
        actorId: context.principal.actorId,
        credentialId: context.principal.credentialId,
        credentialVersion: context.principal.credentialVersion,
        scopes: context.principal.scopes,
        policyVersion: EDGE_POLICY_VERSION,
        requestId: context.requestId,
      }),
    },
    {
      method: "post",
      path: "/v1/publications/:publicationId/execute",
      action: "publication:execute",
      requiredScope: "publication:execute",
      policyAction: "publication:execute",
      resolveResource: request => ({
        kind: "publication",
        id: String(request.params["publicationId"] ?? ""),
      }),
      successStatus: 202,
      handler: context => ({
        ok: true,
        capability: "publication:execute",
        executed: false,
        requestId: context.requestId,
        note: "P1 edge only. Execution lives behind the private ONYX boundary and is not implemented here.",
      }),
    },
  ];
}

/**
 * Public self-description. It lists declared public surfaces, scopes and error
 * codes - never a private service, hostname or configuration value.
 */
export function buildManifest(deps: EdgeDeps): Record<string, unknown> {
  const surfaceStatus = (surface: OptiHubIngressSurface): string => {
    if (surface.id === "api") return "available";
    if (surface.id === "www") return "contract_ready";
    return "not_enabled";
  };

  return {
    service: EDGE_SERVICE_NAME,
    apiVersion: EDGE_API_VERSION,
    version: deps.version,
    status: "available",
    auth: { scheme: "Bearer", credentialPrefix: "ohk_" },
    pipeline: [
      "correlation",
      "credential_extraction",
      "credential_verification",
      "credential_status",
      "tenant_resolution",
      "scope_verification",
      "policy_evaluation",
      "rate_limit",
      "handler",
      "audit",
    ],
    surfaces: optihubIngressSurfaces.map(surface => ({
      id: surface.id,
      hostname: surface.hostname,
      audience: surface.audience,
      status: surfaceStatus(surface),
    })),
    policyVersion: EDGE_POLICY_VERSION,
  };
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

async function handlePublicRoute(
  deps: ResolvedEdgeDeps,
  route: PublicEdgeRoute,
  req: Request,
  res: Response,
): Promise<void> {
  const resolution = resolveEdgeSurface(req.headers.host, deps);
  const correlation = createEdgeCorrelation(req.headers[EDGE_EXTERNAL_REQUEST_ID_HEADER]);
  setCorrelationHeaders(res, correlation);

  // Health/readiness must answer a platform checker whose Host is not the public
  // API hostname. They still refuse a forbidden ONYX hostname.
  const allowed =
    route.hostAgnostic === true ? resolution.kind !== "forbidden" : resolution.kind === "enabled";
  if (!allowed) {
    await respondSurfaceDenial(
      deps,
      res,
      correlation,
      resolution,
      route.method.toUpperCase(),
      `${EDGE_MOUNT_PATH}${route.path}`,
      nowOf(deps),
    );
    return;
  }

  try {
    const result = await route.handler(req);
    res.status(result.status ?? 200).json(result.body);
  } catch {
    res.status(500).json(edgeErrorBody("INTERNAL", "internal_error", correlation.requestId));
  }
}

async function handleProtectedRoute(
  deps: ResolvedEdgeDeps,
  route: ProtectedEdgeRoute,
  req: Request,
  res: Response,
): Promise<void> {
  const now = nowOf(deps);
  const correlation = createEdgeCorrelation(req.headers[EDGE_EXTERNAL_REQUEST_ID_HEADER]);
  const resolution = resolveEdgeSurface(req.headers.host, deps);
  const surface = resolution.surface?.id ?? "unknown";
  const host = resolution.host;
  const risk = routeRisk(route);
  const ipHash = clientIpHash(deps, req);
  setCorrelationHeaders(res, correlation);

  const auditBase = {
    requestId: correlation.requestId,
    externalRequestId: correlation.externalRequestId,
    surface,
    host,
    method: route.method.toUpperCase(),
    route: `${EDGE_MOUNT_PATH}${route.path}`,
    action: route.action,
    timestamp: now,
    ipHash,
    userAgent: truncateUserAgent(req.headers["user-agent"]),
  };

  const deny = async (
    code: EdgeErrorCode,
    reason: string,
    identity: { credentialId?: string; tenantId?: string; actorId?: string } = {},
    headers: Record<string, string> = {},
  ): Promise<void> => {
    const status = edgeErrorStatus(code);
    await recordAudit(deps, {
      ...auditBase,
      credentialId: identity.credentialId ?? null,
      tenantId: identity.tenantId ?? null,
      actorId: identity.actorId ?? null,
      decision: "DENY",
      code,
      reason,
      status,
    }, risk);
    for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
    res.status(status).json(edgeErrorBody(code, reason, correlation.requestId));
  };

  // --- host + surface gate -------------------------------------------------
  if (resolution.kind === "forbidden") {
    await deny("HOST_DENIED", "forbidden_onyx_hostname");
    return;
  }
  if (resolution.kind === "unknown") {
    await deny("HOST_DENIED", "unknown_host");
    return;
  }
  if (resolution.kind === "disabled") {
    // mcp / app / www are declared but not active in P1. Never a bypass.
    await deny("SURFACE_NOT_ENABLED", "surface_not_enabled_in_phase");
    return;
  }

  // --- pre-auth abuse limit (runs before any credential work) --------------
  if (deps.preAuthLimiter !== undefined) {
    try {
      const preAuth = await deps.preAuthLimiter.evaluate(ipHash, surface, now);
      if (!preAuth.allowed) {
        await deny("RATE_LIMITED", "preauth_abuse_limit", {}, {
          "Retry-After": String(preAuth.retryAfterSeconds),
        });
        return;
      }
    } catch {
      await deny("RATE_LIMIT_UNAVAILABLE", "preauth_limiter_unavailable");
      return;
    }
  }

  // --- credential extraction ----------------------------------------------
  const extracted = extractBearerCredential(req.headers.authorization);
  if (!extracted.ok) {
    await deny(extracted.code, extracted.reason);
    return;
  }

  // --- credential verification --------------------------------------------
  let record: EdgeCredentialRecord | null;
  try {
    record = await deps.store.findBySecretHash(hashEdgeSecret(extracted.secret));
  } catch {
    await deny("INTERNAL", "credential_store_unavailable");
    return;
  }
  if (record === null || !verifyEdgeSecret(extracted.secret, record.secretHash)) {
    await deny("INVALID_CREDENTIAL", "credential_not_recognized");
    return;
  }

  // --- credential status / version check ----------------------------------
  const status = credentialStatusAt(record, now);
  if (status === "revoked") {
    await deny("REVOKED_CREDENTIAL", "credential_revoked", identityOf(record));
    return;
  }
  if (status === "expired") {
    await touchExpired(deps, record);
    await deny("EXPIRED_CREDENTIAL", "credential_expired", identityOf(record));
    return;
  }
  if (!Number.isInteger(record.version) || record.version < 1) {
    await deny("INVALID_CREDENTIAL", "credential_version_invalid", identityOf(record));
    return;
  }

  const principal = resolveEdgeTenant(record);
  void touchLastUsed(deps, record, now);

  // --- tenant resolution ---------------------------------------------------
  const requestedTenant = readRequestedTenantId({
    header: req.headers["x-optihub-tenant"],
    body: req.body,
    query: req.query,
  });
  const tenantCheck = checkRequestedTenant(principal, requestedTenant);
  if (!tenantCheck.ok) {
    await deny("TENANT_DENIED", tenantCheck.reason, identityOf(record, principal));
    return;
  }

  // --- scope verification --------------------------------------------------
  if (!hasEdgeScope(principal.scopes, route.requiredScope)) {
    await deny("SCOPE_DENIED", `missing_scope:${route.requiredScope}`, identityOf(record, principal));
    return;
  }

  // --- policy evaluation ---------------------------------------------------
  const resource = route.resolveResource?.(req);
  const policyDecision = authorize(
    principal,
    { name: route.policyAction ?? route.action },
    resource,
    deps.policy,
  );
  if (policyDecision.decision === "DENY") {
    await deny(policyDecision.code, policyDecision.reason, identityOf(record, principal));
    return;
  }

  // --- rate-limit evaluation ----------------------------------------------
  const rule = edgeRateLimitFor(route.action);
  let rateLimit: EdgeRateLimitDecision;
  try {
    rateLimit = await deps.limiter.evaluate(
      { tenantId: principal.tenantId, credentialId: principal.credentialId, action: route.action },
      rule.limit,
      rule.windowMs,
      now,
    );
  } catch {
    // Fail closed: a limiter that cannot answer does not get to allow traffic.
    await deny("RATE_LIMIT_UNAVAILABLE", "rate_limiter_unavailable", identityOf(record, principal));
    return;
  }
  if (!rateLimit.allowed) {
    await deny(
      "RATE_LIMITED",
      "rate_limit_exceeded",
      identityOf(record, principal),
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
    return;
  }

  // --- handler -------------------------------------------------------------
  const resourceRef = resource === undefined ? null : edgeResourceLabel(resource);
  const successStatus = route.successStatus ?? 200;
  const allowBase = {
    ...auditBase,
    credentialId: principal.credentialId,
    tenantId: principal.tenantId,
    actorId: principal.actorId,
    decision: "ALLOW" as const,
    code: null,
    status: successStatus,
    resource: resourceRef,
  };

  // Privileged actions must have a persisted trail line before they run, so no
  // side effect can happen without an audit record (fail closed).
  if (risk !== "read") {
    const pre = await recordAudit(deps, { ...allowBase, reason: "authorized" }, risk);
    if (!pre) {
      await deny("AUDIT_UNAVAILABLE", "audit_unavailable", identityOf(record, principal));
      return;
    }
  }

  const handlerContext: EdgeHandlerContext = {
    requestId: correlation.requestId,
    externalRequestId: correlation.externalRequestId,
    correlation,
    principal,
    gatewayContext: buildMachineGatewayContext(principal, correlation.requestId, EDGE_POLICY_VERSION),
    surface,
    host,
    action: route.action,
    policyDecision,
    rateLimit,
    request: req,
  };

  let result: unknown;
  try {
    result = await route.handler(handlerContext);
  } catch {
    await recordAudit(deps, {
      ...allowBase,
      decision: "ERROR",
      code: "INTERNAL",
      reason: "handler_failed",
      status: 500,
    }, risk);
    res.status(500).json(edgeErrorBody("INTERNAL", "internal_error", correlation.requestId));
    return;
  }

  const completed = await recordAudit(deps, {
    ...allowBase,
    reason: risk === "read" ? policyDecision.reason : "completed",
  }, risk);
  if (!completed && risk === "read") {
    // Read path is fail-closed: without a trail line we do not hand back data.
    res.status(503).json(edgeErrorBody("AUDIT_UNAVAILABLE", "audit_unavailable", correlation.requestId));
    return;
  }
  // For privileged actions the pre-handler line already exists and the side
  // effect has happened; the completion loss is counted by the audit writer.

  res.status(successStatus).json(result ?? {});
}

function extractBearerCredential(
  authorization: string | undefined,
): { ok: true; secret: string } | { ok: false; code: EdgeErrorCode; reason: string } {
  if (authorization === undefined || authorization.trim() === "") {
    return { ok: false, code: "MISSING_CREDENTIAL", reason: "missing_authorization" };
  }
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  if (match === null) {
    return { ok: false, code: "INVALID_CREDENTIAL", reason: "unsupported_authorization_scheme" };
  }
  const secret = (match[1] ?? "").trim();
  if (!isEdgeSecretFormat(secret)) {
    return { ok: false, code: "INVALID_CREDENTIAL", reason: "malformed_credential" };
  }
  return { ok: true, secret };
}

function identityOf(
  record: EdgeCredentialRecord,
  principal?: EdgePrincipal,
): { credentialId: string; tenantId: string; actorId: string } {
  return {
    credentialId: principal?.credentialId ?? record.id,
    tenantId: principal?.tenantId ?? record.tenantId,
    actorId: principal?.actorId ?? record.actorId,
  };
}

async function checkReadiness(deps: EdgeDeps): Promise<boolean> {
  if (deps.readiness === undefined) return true;
  try {
    return await deps.readiness();
  } catch {
    return false;
  }
}

async function touchLastUsed(
  deps: ResolvedEdgeDeps,
  record: EdgeCredentialRecord,
  now: number,
): Promise<void> {
  try {
    await deps.store.update(record.id, { lastUsedAt: now });
  } catch {
    // Usage bookkeeping must never fail a request that already passed controls.
  }
}

async function touchExpired(deps: ResolvedEdgeDeps, record: EdgeCredentialRecord): Promise<void> {
  try {
    await deps.store.updateIf(record.id, current => current.status === "active", {
      status: "expired",
    });
  } catch {
    // Best effort; the denial is what matters.
  }
}

/**
 * Persist one audit record under the configured failure policy. Returns false
 * when the record could not be persisted and the policy does not allow degraded
 * operation. A false result on the allow path is a DENY, never a silent allow.
 */
async function recordAudit(
  deps: ResolvedEdgeDeps,
  entry: EdgeAuditRecord,
  risk: EdgeOperationRisk,
): Promise<boolean> {
  const result = await deps.auditWriter.persist(entry, risk);
  return result.ok;
}

async function respondSurfaceDenial(
  deps: ResolvedEdgeDeps,
  res: Response,
  correlation: EdgeCorrelation,
  resolution: SurfaceResolution,
  method: string,
  route: string,
  now: number,
): Promise<void> {
  const code: EdgeErrorCode =
    resolution.kind === "forbidden" || resolution.kind === "unknown"
      ? "HOST_DENIED"
      : "SURFACE_NOT_ENABLED";
  const reason =
    resolution.kind === "unknown"
      ? "unknown_host"
      : resolution.kind === "forbidden"
        ? "forbidden_onyx_hostname"
        : "surface_not_enabled_in_phase";
  const status = edgeErrorStatus(code);

  setCorrelationHeaders(res, correlation);
  await recordAudit(deps, {
    timestamp: now,
    requestId: correlation.requestId,
    externalRequestId: correlation.externalRequestId,
    surface: resolution.surface?.id ?? "unknown",
    host: resolution.host,
    method: method.toUpperCase(),
    route,
    action: "public",
    credentialId: null,
    tenantId: null,
    actorId: null,
    decision: "DENY",
    code,
    reason,
    status,
    ipHash: null,
    userAgent: null,
  }, "read");
  res.status(status).json(edgeErrorBody(code, reason, correlation.requestId));
}

function setCorrelationHeaders(res: Response, correlation: EdgeCorrelation): void {
  res.setHeader(EDGE_INTERNAL_REQUEST_ID_HEADER, correlation.requestId);
}

function clientIpHash(
  deps: Pick<ResolvedEdgeDeps, "trustedProxies" | "trustedProxyChain">,
  req: Request,
): string | null {
  return hashClientAddress(resolveClientIp(req, deps.trustedProxies, deps.trustedProxyChain));
}

function routeRisk(route: ProtectedEdgeRoute): EdgeOperationRisk {
  if (route.risk !== undefined) return route.risk;
  if (route.action === "publication:execute") return "execute";
  return route.method === "post" ? "mutating" : "read";
}

function edgeResourceLabel(resource: EdgeResourceRef): string {
  return `${resource.kind}:${resource.id ?? ""}`.slice(0, 255);
}

function nowOf(deps: EdgeDeps): number {
  return (deps.clock ?? Date.now)();
}

export type { EdgeAuditSink };

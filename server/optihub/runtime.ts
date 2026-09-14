/**
 * OPTIHUB EDGE - runtime wiring.
 *
 * Selects the real (MySQL) stores when `DATABASE_URL` is configured and fails
 * closed in production without one. In development only, it falls back to the
 * in-memory reference stores with a loud warning.
 *
 * There is deliberately no credential-management HTTP surface here. Provisioning
 * and rotation are internal operations (`provisioning.ts`); the public API only
 * consumes credentials.
 */

import type { Express } from "express";

import { InMemoryEdgeAuditSink, type EdgeAuditSink } from "./audit";
import { DEFAULT_EDGE_AUDIT_POLICY, type EdgeAuditPolicy } from "./auditPolicy";
import { loadAliasRegistryFromEnv } from "./alias";
import { parseTrustedProxies, parseTrustedProxyChainMode } from "./clientIp";
import { createOptiHubConnectFacade } from "./connectFacade";
import { registerOptiHubEdge, type EdgeDeps } from "./edge";
import { MySqlEdgeAuditSink } from "./mysql/mysqlAuditSink";
import { MySqlEdgeCredentialStore } from "./mysql/mysqlCredentialStore";
import { MySqlEdgeRateLimiter } from "./mysql/mysqlRateLimiter";
import { createOptiHubDbPool, type OptiHubDbPool } from "./mysql/pool";
import { ensureOptiHubEdgeSchema } from "./mysql/schema";
import { EdgePreAuthLimiter } from "./preAuth";
import { originAuthConfigFrom } from "./originAuth";
import { registerEdgeCredential } from "./provisioning";
import { InMemoryEdgeRateLimiter, type EdgeRateLimiter } from "./rateLimit";
import { InMemoryEdgeCredentialStore, type EdgeCredentialStore } from "./store";

let sharedStore: InMemoryEdgeCredentialStore | null = null;
let sharedAudit: InMemoryEdgeAuditSink | null = null;
let sharedLimiter: InMemoryEdgeRateLimiter | null = null;

/** Process-wide in-memory credential store (development / tests only). */
export function edgeCredentialStore(): InMemoryEdgeCredentialStore {
  sharedStore ??= new InMemoryEdgeCredentialStore();
  return sharedStore;
}

export function edgeAuditSink(): InMemoryEdgeAuditSink {
  sharedAudit ??= new InMemoryEdgeAuditSink();
  return sharedAudit;
}

export function edgeRateLimiter(): InMemoryEdgeRateLimiter {
  sharedLimiter ??= new InMemoryEdgeRateLimiter();
  return sharedLimiter;
}

export function edgeVersion(env: NodeJS.ProcessEnv = process.env): string {
  return env["RAILWAY_GIT_COMMIT_SHA"] ?? env["GIT_SHA"] ?? "dev";
}

export function parseEdgeAuditPolicy(env: NodeJS.ProcessEnv = process.env): EdgeAuditPolicy {
  const readPolicy =
    env["OPTIHUB_EDGE_READ_AUDIT_POLICY"] === "degraded_spool" ? "degraded_spool" : "fail_closed";
  return { ...DEFAULT_EDGE_AUDIT_POLICY, readPolicy };
}

function trustedProxiesFrom(env: NodeJS.ProcessEnv): readonly string[] {
  return parseTrustedProxies(env["OPTIHUB_TRUSTED_PROXIES"] ?? env["TRUSTED_PROXY_IPS"]);
}

function trustedProxyChainFrom(env: NodeJS.ProcessEnv) {
  return parseTrustedProxyChainMode(env["OPTIHUB_TRUSTED_PROXY_CHAIN"]);
}

/**
 * In-memory dependency set. Real code (not a mock), but process-local: suitable
 * for development and tests, never for a multi-instance deployment.
 */
export function createEdgeDeps(env: NodeJS.ProcessEnv = process.env): EdgeDeps {
  const limiter = edgeRateLimiter();
  return {
    store: edgeCredentialStore(),
    audit: edgeAuditSink(),
    limiter,
    preAuthLimiter: new EdgePreAuthLimiter(limiter),
    trustedProxies: trustedProxiesFrom(env),
    trustedProxyChain: trustedProxyChainFrom(env),
    auditPolicy: parseEdgeAuditPolicy(env),
    originAuth: originAuthConfigFrom(env),
    policy: {
      publicationExecuteEnabled: env["OPTIHUB_EDGE_PUBLICATION_EXECUTE_ENABLED"] === "true",
    },
    version: edgeVersion(env),
    // P2.0 enables the agent-facing mcp surface alongside api. Each surface only
    // serves the routes bound to it, so mcp cannot become a side door around the
    // REST pipeline and app/www stay declared-but-disabled.
    enabledSurfaces: ["api", "mcp"],
    additionalApiHosts: env["NODE_ENV"] === "production" ? [] : ["localhost", "127.0.0.1"],
    readiness: () => true,
    // Alias -> canonical identity. A malformed map is a startup error.
    aliases: loadAliasRegistryFromEnv(env),
  };
}

export interface EdgeRuntimeHandle {
  readonly deps: EdgeDeps;
  readonly pool: OptiHubDbPool | null;
  /** Release the database pool. Safe to call more than once. */
  close(): Promise<void>;
}

function persistentEdgeDeps(pool: OptiHubDbPool, env: NodeJS.ProcessEnv): EdgeDeps {
  const store: EdgeCredentialStore = new MySqlEdgeCredentialStore(pool);
  const auditSink = new MySqlEdgeAuditSink(pool);
  const audit: EdgeAuditSink = auditSink;
  const limiter: EdgeRateLimiter = new MySqlEdgeRateLimiter(pool);
  return {
    store,
    audit,
    limiter,
    preAuthLimiter: new EdgePreAuthLimiter(limiter),
    trustedProxies: trustedProxiesFrom(env),
    trustedProxyChain: trustedProxyChainFrom(env),
    auditPolicy: parseEdgeAuditPolicy(env),
    originAuth: originAuthConfigFrom(env),
    policy: {
      publicationExecuteEnabled: env["OPTIHUB_EDGE_PUBLICATION_EXECUTE_ENABLED"] === "true",
    },
    version: edgeVersion(env),
    enabledSurfaces: ["api", "mcp"],
    additionalApiHosts: env["NODE_ENV"] === "production" ? [] : ["localhost", "127.0.0.1"],
    // Readiness reflects the durable dependency the edge actually needs.
    readiness: () => auditSink.ping(),
    aliases: loadAliasRegistryFromEnv(env),
  };
}

/**
 * Build the dependency set for this process. Uses MySQL when `DATABASE_URL` is
 * present. Production without a database URL is a hard startup error: the edge
 * refuses to run with process-local security state.
 */
export async function createRuntimeEdgeDeps(
  env: NodeJS.ProcessEnv = process.env,
): Promise<EdgeRuntimeHandle> {
  const databaseUrl = env["DATABASE_URL"];
  if (databaseUrl === undefined || databaseUrl.trim() === "") {
    if (env["NODE_ENV"] === "production") {
      throw new Error("OPTIHUB edge requires DATABASE_URL in production");
    }
    console.warn(
      "[optihub-edge] DATABASE_URL not set - using in-memory stores (development only)",
    );
    return { deps: createEdgeDeps(env), pool: null, close: async () => undefined };
  }

  const pool = createOptiHubDbPool(databaseUrl);
  try {
    // The drizzle chain cannot be relied on to have created these (see schema.ts).
    await ensureOptiHubEdgeSchema(pool);
  } catch (error) {
    await pool.end().catch(() => undefined);
    throw error;
  }
  const deps = persistentEdgeDeps(pool, env);
  const bootstrap = await bootstrapEdgeCredentials(deps.store, env);
  if (bootstrap.skipped > 0) {
    // Count only; never the secret or the entry contents.
    console.warn(`[optihub-edge] skipped ${bootstrap.skipped} bootstrap credential(s)`);
  }
  return {
    deps,
    pool,
    close: async () => {
      await pool.end();
    },
  };
}

interface BootstrapCredential {
  readonly tenantId: string;
  readonly actorId: string;
  readonly secret: string;
  readonly scopes?: readonly string[];
  readonly expiresAt?: number | null;
  readonly metadata?: Readonly<Record<string, string>>;
}

/**
 * Seed credentials that already exist in the deployment's secret manager.
 * Disabled unless `OPTIHUB_EDGE_BOOTSTRAP_ENABLED=true`. A malformed payload is a
 * startup error; a missing one simply leaves the edge with no credentials, which
 * denies every protected request (fail closed).
 */
export async function bootstrapEdgeCredentials(
  store: EdgeCredentialStore,
  env: NodeJS.ProcessEnv = process.env,
  now: number = Date.now(),
): Promise<{ registered: number; skipped: number }> {
  if (env["OPTIHUB_EDGE_BOOTSTRAP_ENABLED"] !== "true") return { registered: 0, skipped: 0 };

  const raw = env["OPTIHUB_EDGE_BOOTSTRAP_CREDENTIALS"];
  if (raw === undefined || raw.trim() === "") return { registered: 0, skipped: 0 };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OPTIHUB_EDGE_BOOTSTRAP_CREDENTIALS is not valid JSON");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("OPTIHUB_EDGE_BOOTSTRAP_CREDENTIALS must be a JSON array");
  }

  let registered = 0;
  let skipped = 0;
  for (const entry of parsed as BootstrapCredential[]) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof entry.tenantId !== "string" ||
      typeof entry.actorId !== "string" ||
      typeof entry.secret !== "string"
    ) {
      throw new Error("OPTIHUB_EDGE_BOOTSTRAP_CREDENTIALS entry is missing required fields");
    }
    try {
      await registerEdgeCredential(
        store,
        {
          tenantId: entry.tenantId,
          actorId: entry.actorId,
          secret: entry.secret,
          scopes: Array.isArray(entry.scopes) ? entry.scopes : [],
          expiresAt: entry.expiresAt ?? null,
          metadata: entry.metadata,
        },
        now,
      );
      registered += 1;
    } catch {
      // Duplicate or invalid entry: never echo the secret, just count it.
      skipped += 1;
    }
  }
  return { registered, skipped };
}

/**
 * Build deps, seed credentials and mount the edge. Awaited by the server
 * entrypoint before it starts listening. Returns the runtime handle so the
 * caller can shut the pool down.
 */
export async function registerOptiHubEdgeRuntime(
  app: Express,
  env: NodeJS.ProcessEnv = process.env,
): Promise<EdgeRuntimeHandle> {
  const handle = await createRuntimeEdgeDeps(env);
  registerOptiHubEdge(app, handle.deps);
  // Friendly public mount of the same MCP runtime: /connect + /health on the
  // `mcp` surface. Not a second MCP server - it reuses the edge pipeline.
  app.use(createOptiHubConnectFacade(handle.deps));
  return handle;
}

/**
 * OPTIHUB EDGE - runtime wiring.
 *
 * Builds the default edge dependencies (in-memory P1 stores), optionally seeds
 * credentials from the deployment's secret manager, and mounts the router.
 *
 * There is deliberately no credential-management HTTP surface here. Provisioning
 * and rotation are internal operations (`provisioning.ts`); the public API only
 * consumes credentials.
 */

import type { Express } from "express";

import { InMemoryEdgeAuditSink } from "./audit";
import { registerOptiHubEdge, type EdgeDeps } from "./edge";
import { registerEdgeCredential } from "./provisioning";
import { InMemoryEdgeRateLimiter } from "./rateLimit";
import { InMemoryEdgeCredentialStore, type EdgeCredentialStore } from "./store";

let sharedStore: InMemoryEdgeCredentialStore | null = null;
let sharedAudit: InMemoryEdgeAuditSink | null = null;
let sharedLimiter: InMemoryEdgeRateLimiter | null = null;

/**
 * Process-wide credential store. A persistent store is a drop-in replacement
 * behind `EdgeCredentialStore`; this is the P1 reference implementation.
 */
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

export function createEdgeDeps(env: NodeJS.ProcessEnv = process.env): EdgeDeps {
  return {
    store: edgeCredentialStore(),
    audit: edgeAuditSink(),
    limiter: edgeRateLimiter(),
    policy: {
      publicationExecuteEnabled: env["OPTIHUB_EDGE_PUBLICATION_EXECUTE_ENABLED"] === "true",
    },
    version: edgeVersion(env),
    // P1 enables exactly one protected surface. mcp/app/www stay declared but
    // disabled, so they cannot become a side door around this pipeline.
    enabledSurfaces: ["api"],
    additionalApiHosts:
      env["NODE_ENV"] === "production" ? [] : ["localhost", "127.0.0.1"],
    readiness: () => true,
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
 * entrypoint before it starts listening.
 */
export async function registerOptiHubEdgeRuntime(
  app: Express,
  env: NodeJS.ProcessEnv = process.env,
): Promise<EdgeDeps> {
  const deps = createEdgeDeps(env);
  const bootstrap = await bootstrapEdgeCredentials(deps.store, env);
  if (bootstrap.skipped > 0) {
    // Count only; never the secret or the entry contents.
    console.warn(`[optihub-edge] skipped ${bootstrap.skipped} bootstrap credential(s)`);
  }
  registerOptiHubEdge(app, deps);
  return deps;
}

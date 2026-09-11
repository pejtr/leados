/**
 * Test harness for the OPTIHUB edge.
 *
 * Real Express, real pipeline, real in-memory stores. Requests are issued over
 * loopback HTTP so the Host header can be controlled (fetch forbids setting it),
 * which is exactly what the surface gate keys on.
 */

import express, { type Express } from "express";
import http from "node:http";
import type { AddressInfo } from "node:net";

import { InMemoryEdgeAuditSink } from "./audit";
import { provisionEdgeCredential, type ProvisionEdgeCredentialInput } from "./provisioning";
import { InMemoryEdgeRateLimiter } from "./rateLimit";
import { InMemoryEdgeCredentialStore } from "./store";
import { registerOptiHubEdge, type EdgeDeps, type EdgeRouterOptions } from "./edge";

export const API_HOST = "api.optihub.cz";
export const MCP_HOST = "mcp.optihub.cz";
export const APP_HOST = "app.optihub.cz";
export const WWW_HOST = "www.optihub.cz";
export const FORBIDDEN_ONYX_HOST = "onyx.optihub.cz";
export const UNKNOWN_HOST = "evil.example.com";

export interface MutableClock {
  now: number;
}

export interface EdgeHarness {
  readonly app: Express;
  readonly deps: EdgeDeps;
  readonly store: InMemoryEdgeCredentialStore;
  readonly audit: InMemoryEdgeAuditSink;
  readonly limiter: InMemoryEdgeRateLimiter;
  readonly clock: MutableClock;
}

export interface HarnessOverrides {
  readonly publicationExecuteEnabled?: boolean;
  readonly store?: InMemoryEdgeCredentialStore;
  readonly audit?: InMemoryEdgeAuditSink;
  readonly limiter?: InMemoryEdgeRateLimiter;
  readonly limiterImpl?: EdgeDeps["limiter"];
  readonly enabledSurfaces?: EdgeDeps["enabledSurfaces"];
  readonly readiness?: EdgeDeps["readiness"];
  readonly preAuthLimiter?: EdgeDeps["preAuthLimiter"];
  readonly trustedProxies?: EdgeDeps["trustedProxies"];
  readonly auditPolicy?: EdgeDeps["auditPolicy"];
}

export function createEdgeHarness(
  overrides: HarnessOverrides = {},
  options: EdgeRouterOptions = {},
): EdgeHarness {
  const clock: MutableClock = { now: 1_750_000_000_000 };
  const store = overrides.store ?? new InMemoryEdgeCredentialStore();
  const audit = overrides.audit ?? new InMemoryEdgeAuditSink();
  const limiter = overrides.limiter ?? new InMemoryEdgeRateLimiter();

  const deps: EdgeDeps = {
    store,
    audit,
    limiter: overrides.limiterImpl ?? limiter,
    preAuthLimiter: overrides.preAuthLimiter,
    trustedProxies: overrides.trustedProxies,
    auditPolicy: overrides.auditPolicy,
    policy: { publicationExecuteEnabled: overrides.publicationExecuteEnabled ?? false },
    version: "test-build",
    clock: () => clock.now,
    enabledSurfaces: overrides.enabledSurfaces ?? ["api"],
    readiness: overrides.readiness,
  };

  const app = express();
  // Mirror the production ordering: the edge is mounted before any app-wide body
  // parser, so its own strict limit is the one that applies.
  registerOptiHubEdge(app, deps, options);
  app.use((_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "not_found" } });
  });

  return { app, deps, store, audit, limiter, clock };
}

export interface StartedEdge {
  readonly url: string;
  readonly close: () => Promise<void>;
}

export async function startEdgeServer(app: Express): Promise<StartedEdge> {
  const server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      }),
  };
}

export interface EdgeHttpResponse<T = unknown> {
  readonly status: number;
  readonly headers: http.IncomingHttpHeaders;
  readonly body: T;
}

export interface EdgeRequestOptions {
  readonly method?: "GET" | "POST";
  readonly host?: string;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
  /** Raw body, used to send malformed JSON. Takes precedence over `body`. */
  readonly rawBody?: string;
}

export async function edgeRequest<T = unknown>(
  baseUrl: string,
  path: string,
  options: EdgeRequestOptions = {},
): Promise<EdgeHttpResponse<T>> {
  const url = new URL(baseUrl);
  const payload =
    options.rawBody !== undefined
      ? options.rawBody
      : options.body === undefined
        ? undefined
        : JSON.stringify(options.body);

  return new Promise<EdgeHttpResponse<T>>((resolve, reject) => {
    const request = http.request(
      {
        hostname: url.hostname,
        port: Number(url.port),
        path,
        method: options.method ?? "GET",
        headers: {
          host: options.host ?? API_HOST,
          ...(payload === undefined
            ? {}
            : { "content-type": "application/json", "content-length": Buffer.byteLength(payload) }),
          ...options.headers,
        },
      },
      response => {
        const chunks: Buffer[] = [];
        response.on("data", chunk => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let body: unknown = text;
          try {
            body = text === "" ? null : JSON.parse(text);
          } catch {
            // keep raw text
          }
          resolve({ status: response.statusCode ?? 0, headers: response.headers, body: body as T });
        });
      },
    );
    request.on("error", reject);
    if (payload !== undefined) request.write(payload);
    request.end();
  });
}

export interface SeededCredential {
  readonly secret: string;
  readonly id: string;
  readonly tenantId: string;
}

export async function seedCredential(
  store: InMemoryEdgeCredentialStore,
  input: Omit<ProvisionEdgeCredentialInput, "tenantId" | "actorId"> & {
    tenantId?: string;
    actorId?: string;
  },
  now = Date.now(),
): Promise<SeededCredential> {
  const provisioned = await provisionEdgeCredential(
    store,
    {
      tenantId: input.tenantId ?? "tenant-alpha",
      actorId: input.actorId ?? "actor-alpha",
      scopes: input.scopes,
      expiresAt: input.expiresAt ?? null,
      metadata: input.metadata,
    },
    now,
  );
  return {
    secret: provisioned.secret,
    id: provisioned.record.id,
    tenantId: provisioned.record.tenantId,
  };
}

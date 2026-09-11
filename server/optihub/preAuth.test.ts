/**
 * OPTIHUB EDGE - pre-auth abuse limiting tests.
 *
 * The pre-auth limiter must run before credential hashing/verification and must
 * fail closed on its own outage.
 */

import { describe, expect, it } from "vitest";

import { InMemoryEdgeRateLimiter, type EdgeRateLimiter } from "./rateLimit";
import { EdgePreAuthLimiter } from "./preAuth";
import { InMemoryEdgeCredentialStore } from "./store";
import {
  API_HOST,
  createEdgeHarness,
  edgeRequest,
  startEdgeServer,
  type EdgeRequestOptions,
} from "./testing";

class CountingStore extends InMemoryEdgeCredentialStore {
  lookups = 0;
  override async findBySecretHash(secretHash: string) {
    this.lookups += 1;
    return super.findBySecretHash(secretHash);
  }
}

function preAuthLimiter(perIpLimit: number, globalLimit = 1_000): EdgePreAuthLimiter {
  return new EdgePreAuthLimiter(
    new InMemoryEdgeRateLimiter(),
    { limit: perIpLimit, windowMs: 60_000 },
    { limit: globalLimit, windowMs: 60_000 },
  );
}

describe("EdgePreAuthLimiter", () => {
  it("limits per client ip and then globally", async () => {
    const limiter = preAuthLimiter(1, 1_000);
    const now = Date.now();
    expect((await limiter.evaluate("ip_a", "api", now)).allowed).toBe(true);
    expect((await limiter.evaluate("ip_a", "api", now)).allowed).toBe(false);
    // A different address still has its own per-ip budget...
    expect((await limiter.evaluate("ip_b", "api", now)).allowed).toBe(true);

    const global = preAuthLimiter(100, 1);
    expect((await global.evaluate("ip_c", "api", now)).allowed).toBe(true);
    expect((await global.evaluate("ip_d", "api", now)).allowed).toBe(false);
  });
});

describe("pre-auth limiting in the pipeline", () => {
  it("denies before any credential work and never calls the handler", async () => {
    const store = new CountingStore();
    let handlerCalls = 0;
    const harness = createEdgeHarness(
      { store, preAuthLimiter: preAuthLimiter(1), trustedProxies: ["127.0.0.1"] },
      {
        protectedRoutes: [
          {
            method: "get",
            path: "/v1/guarded",
            action: "projects:read",
            requiredScope: "projects:read",
            handler: () => {
              handlerCalls += 1;
              return { ok: true };
            },
          },
        ],
      },
    );
    const server = await startEdgeServer(harness.app);
    const options: EdgeRequestOptions = {
      host: API_HOST,
      headers: { "x-forwarded-for": "203.0.113.9" },
    };
    try {
      const first = await edgeRequest(server.url, "/api/optihub/v1/guarded", options);
      expect(first.status).toBe(401);
      expect((first.body as { error: { code: string } }).error.code).toBe("MISSING_CREDENTIAL");

      const second = await edgeRequest(server.url, "/api/optihub/v1/guarded", options);
      expect(second.status).toBe(429);
      const error = (second.body as { error: { code: string; reason: string } }).error;
      expect(error.code).toBe("RATE_LIMITED");
      expect(error.reason).toBe("preauth_abuse_limit");
      expect(second.headers["retry-after"]).toBeDefined();

      expect(store.lookups).toBe(0);
      expect(handlerCalls).toBe(0);
    } finally {
      await server.close();
    }
  }, 20_000);

  it("keeps separate budgets per forwarded client address behind a trusted proxy", async () => {
    const harness = createEdgeHarness({
      preAuthLimiter: preAuthLimiter(1),
      trustedProxies: ["127.0.0.1"],
    });
    const server = await startEdgeServer(harness.app);
    try {
      const fromA = await edgeRequest(server.url, "/api/optihub/v1/context", {
        host: API_HOST,
        headers: { "x-forwarded-for": "203.0.113.9" },
      });
      const fromB = await edgeRequest(server.url, "/api/optihub/v1/context", {
        host: API_HOST,
        headers: { "x-forwarded-for": "203.0.113.10" },
      });
      expect(fromA.status).toBe(401);
      expect(fromB.status).toBe(401);
    } finally {
      await server.close();
    }
  }, 20_000);

  it("fails closed when the pre-auth limiter is unavailable", async () => {
    const failing: EdgeRateLimiter = {
      async evaluate() {
        throw new Error("shared limiter down");
      },
    };
    const harness = createEdgeHarness({ preAuthLimiter: new EdgePreAuthLimiter(failing) });
    const server = await startEdgeServer(harness.app);
    try {
      const response = await edgeRequest(server.url, "/api/optihub/v1/context", {
        host: API_HOST,
      });
      expect(response.status).toBe(503);
      const error = (response.body as { error: { code: string; reason: string } }).error;
      expect(error.code).toBe("RATE_LIMIT_UNAVAILABLE");
      expect(error.reason).toBe("preauth_limiter_unavailable");
    } finally {
      await server.close();
    }
  }, 20_000);
});

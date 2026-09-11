import { afterEach, describe, expect, it } from "vitest";

import {
  API_HOST,
  createEdgeHarness,
  edgeRequest,
  startEdgeServer,
  type EdgeHarness,
} from "./testing";
import {
  ORIGIN_AUTH_DEFAULT_HEADER,
  evaluateOriginAuth,
  originAuthConfigFrom,
  parseOriginAuthMode,
  type OriginAuthConfig,
} from "./originAuth";

const SECRET = "s3cr3t-origin-auth-value-0123456789";

function enabled(overrides: Partial<OriginAuthConfig> = {}): OriginAuthConfig {
  return {
    mode: "cloudflare_static_header",
    headerName: ORIGIN_AUTH_DEFAULT_HEADER,
    expectedSecret: SECRET,
    ...overrides,
  };
}

const openServers: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (openServers.length > 0) {
    const close = openServers.pop();
    if (close) await close();
  }
});

async function withOriginAuth(
  originAuth: OriginAuthConfig | undefined,
  run: (harness: EdgeHarness, url: string) => Promise<void>,
): Promise<void> {
  const harness = createEdgeHarness({ originAuth });
  const server = await startEdgeServer(harness.app);
  openServers.push(server.close);
  await run(harness, server.url);
}

describe("parseOriginAuthMode", () => {
  it("defaults missing or empty to off", () => {
    expect(parseOriginAuthMode(undefined)).toBe("off");
    expect(parseOriginAuthMode(null)).toBe("off");
    expect(parseOriginAuthMode("")).toBe("off");
    expect(parseOriginAuthMode("off")).toBe("off");
  });

  it("recognizes cloudflare_static_header", () => {
    expect(parseOriginAuthMode("cloudflare_static_header")).toBe("cloudflare_static_header");
  });

  it("throws on an explicit unknown mode (typo cannot silently disable auth)", () => {
    expect(() => parseOriginAuthMode("bogus")).toThrow();
    expect(() => parseOriginAuthMode("cloudflare_statc_header")).toThrow();
  });
});

describe("originAuthConfigFrom", () => {
  it("defaults to off with no env", () => {
    expect(originAuthConfigFrom({}).mode).toBe("off");
  });

  it("throws when enabled without a secret", () => {
    expect(() => originAuthConfigFrom({ OPTIHUB_ORIGIN_AUTH_MODE: "cloudflare_static_header" })).toThrow();
  });

  it("throws on an unknown explicit mode", () => {
    expect(() => originAuthConfigFrom({ OPTIHUB_ORIGIN_AUTH_MODE: "bogus" })).toThrow();
  });

  it("returns a valid enabled config when mode and secret are present", () => {
    const cfg = originAuthConfigFrom({
      OPTIHUB_ORIGIN_AUTH_MODE: "cloudflare_static_header",
      OPTIHUB_ORIGIN_AUTH_SECRET: SECRET,
    });
    expect(cfg.mode).toBe("cloudflare_static_header");
    expect(cfg.expectedSecret).toBe(SECRET);
  });
});

describe("evaluateOriginAuth", () => {
  it("always allows when off", () => {
    const off: OriginAuthConfig = { mode: "off", headerName: "x", expectedSecret: null };
    expect(evaluateOriginAuth(off, undefined).ok).toBe(true);
    expect(evaluateOriginAuth(off, "client value").ok).toBe(true);
  });

  it("fails closed when enabled but no secret configured", () => {
    expect(evaluateOriginAuth(enabled({ expectedSecret: null }), SECRET)).toEqual({
      ok: false,
      reason: "origin_auth_misconfigured",
    });
  });

  it("denies missing, empty, duplicated and wrong values", () => {
    expect(evaluateOriginAuth(enabled(), undefined)).toEqual({ ok: false, reason: "origin_auth_missing" });
    expect(evaluateOriginAuth(enabled(), "")).toEqual({ ok: false, reason: "origin_auth_missing" });
    // A duplicated header arrives as an array and is never a valid single secret.
    expect(evaluateOriginAuth(enabled(), ["a", "b"])).toEqual({ ok: false, reason: "origin_auth_missing" });
    expect(evaluateOriginAuth(enabled(), "wrong")).toEqual({ ok: false, reason: "origin_auth_invalid" });
  });

  it("accepts the exact secret", () => {
    expect(evaluateOriginAuth(enabled(), SECRET)).toEqual({ ok: true });
  });
});

describe("origin auth in the edge pipeline", () => {
  it("disabled mode retains current behavior", async () => {
    await withOriginAuth(undefined, async (_harness, url) => {
      const res = await edgeRequest(url, "/api/optihub/v1/context", { host: API_HOST });
      expect(res.status).toBe(401);
      expect((res.body as { error: { code: string } }).error.code).toBe("MISSING_CREDENTIAL");
    });
  });

  it("enabled: a direct-origin request without the secret is ORIGIN_DENIED before credential work", async () => {
    await withOriginAuth(enabled(), async (harness, url) => {
      const res = await edgeRequest(url, "/api/optihub/v1/context", { host: API_HOST });
      expect(res.status).toBe(403);
      expect((res.body as { error: { code: string } }).error.code).toBe("ORIGIN_DENIED");
      const last = harness.audit.entries[harness.audit.entries.length - 1];
      expect(last?.code).toBe("ORIGIN_DENIED");
      expect(JSON.stringify(harness.audit.entries)).not.toContain(SECRET);
    });
  });

  it("enabled: incorrect secret denied", async () => {
    await withOriginAuth(enabled(), async (_harness, url) => {
      const res = await edgeRequest(url, "/api/optihub/v1/context", {
        host: API_HOST,
        headers: { "x-optihub-origin-auth": "wrong" },
      });
      expect(res.status).toBe(403);
      expect((res.body as { error: { code: string } }).error.code).toBe("ORIGIN_DENIED");
    });
  });

  it("enabled: valid secret proceeds to the credential check", async () => {
    await withOriginAuth(enabled(), async (_harness, url) => {
      const res = await edgeRequest(url, "/api/optihub/v1/context", {
        host: API_HOST,
        headers: { "x-optihub-origin-auth": SECRET },
      });
      expect(res.status).toBe(401);
      expect((res.body as { error: { code: string } }).error.code).toBe("MISSING_CREDENTIAL");
    });
  });

  it("enabled: health and readiness stay reachable without origin auth", async () => {
    await withOriginAuth(enabled(), async (_harness, url) => {
      const health = await edgeRequest(url, "/api/optihub/health", { host: API_HOST });
      expect(health.status).toBe(200);
      const ready = await edgeRequest(url, "/api/optihub/ready", { host: API_HOST });
      expect(ready.status).toBe(200);
    });
  });
});

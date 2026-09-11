/**
 * OPTIHUB EDGE - trusted proxy / forwarding-header tests.
 *
 * Forwarding headers may only be used when the TCP peer is a configured trusted
 * proxy. Anything a client sends is otherwise ignored, and no security authority
 * is derived from a client-supplied header.
 */

import type { Request } from "express";
import { describe, expect, it } from "vitest";

import { hashClientAddress } from "./audit";
import {
  isTrustedProxy,
  normalizeIp,
  parseTrustedProxies,
  parseTrustedProxyChainMode,
  readForwardedChain,
  resolveClientIp,
} from "./clientIp";
import {
  API_HOST,
  FORBIDDEN_ONYX_HOST,
  edgeRequest,
  createEdgeHarness,
  seedCredential,
  startEdgeServer,
} from "./testing";

function fakeRequest(remoteAddress: string, headers: Record<string, unknown> = {}): Request {
  return { socket: { remoteAddress }, headers } as unknown as Request;
}

describe("trusted proxy model", () => {
  it("ignores X-Forwarded-For entirely when no proxy is trusted", () => {
    const request = fakeRequest("198.51.100.7", { "x-forwarded-for": "9.9.9.9" });
    expect(resolveClientIp(request, [])).toBe("198.51.100.7");
  });

  it("ignores X-Forwarded-For when the socket peer is not a trusted proxy", () => {
    const request = fakeRequest("198.51.100.7", { "x-forwarded-for": "9.9.9.9" });
    expect(resolveClientIp(request, ["10.0.0.5"])).toBe("198.51.100.7");
  });

  it("takes the right-most untrusted hop behind a trusted proxy", () => {
    const request = fakeRequest("10.0.0.5", {
      "x-forwarded-for": "203.0.113.9, 10.0.0.5",
    });
    expect(resolveClientIp(request, ["10.0.0.5"])).toBe("203.0.113.9");
  });

  it("ignores client-prepended spoofed hops to the left of the real client", () => {
    const request = fakeRequest("10.0.0.5", {
      "x-forwarded-for": "1.2.3.4, 203.0.113.9, 10.0.0.5",
    });
    // 1.2.3.4 was injected by the client; the real client appended by our proxy
    // is 203.0.113.9.
    expect(resolveClientIp(request, ["10.0.0.5"])).toBe("203.0.113.9");
  });

  it("flattens duplicated forwarding headers and normalises IPv6-mapped IPv4", () => {
    const request = fakeRequest("10.0.0.5", {
      "x-forwarded-for": ["::ffff:203.0.113.9", "10.0.0.5"],
    });
    expect(readForwardedChain(request.headers["x-forwarded-for"])).toEqual([
      "203.0.113.9",
      "10.0.0.5",
    ]);
    expect(resolveClientIp(request, ["10.0.0.5"])).toBe("203.0.113.9");
  });

  it("matches trusted proxies by CIDR", () => {
    expect(isTrustedProxy("10.4.5.6", ["10.0.0.0/8"])).toBe(true);
    expect(isTrustedProxy("11.0.0.1", ["10.0.0.0/8"])).toBe(false);
    expect(isTrustedProxy("192.168.1.5", ["192.168.1.0/24"])).toBe(true);
  });

  it("matches trusted proxies by IPv6 CIDR", () => {
    expect(isTrustedProxy("fd12:0:8:0:1000:9f:8000:1", ["fd12:0:8:0:1000::/80"])).toBe(true);
    expect(isTrustedProxy("fd12:0:8:0:1000:a7:8000:1", ["fd12:0:8:0:1000::/80"])).toBe(true);
    expect(isTrustedProxy("fd12:9581:ee5a:1:b000:c:c7ef:fc4", ["fd12:0:8:0:1000::/80"])).toBe(false);
    expect(isTrustedProxy("fd12:0:8:0:ffff:9f:8000:1", ["fd12:0:8:0:1000::/80"])).toBe(false);
    expect(isTrustedProxy("2001:db8::1", ["fd12:0:8:0:1000::/80"])).toBe(false);
    expect(isTrustedProxy("::1", ["::/0"])).toBe(true);
    expect(isTrustedProxy("::ffff:100.64.0.2", ["100.64.0.0/24"])).toBe(true);
    expect(isTrustedProxy("fd12:0:8:0:1000:9f:8000:1", ["fd12:0:8:0:1000::/129"])).toBe(false);
  });

  it("takes the real client behind a trusted IPv6 proxy and ignores spoofed hops", () => {
    const peer = "fd12:0:8:0:1000:9f:8000:1";
    const trusted = ["fd12:0:8:0:1000::/80"];
    expect(resolveClientIp(fakeRequest(peer, { "x-forwarded-for": peer }), trusted)).toBe(peer);
    expect(
      resolveClientIp(fakeRequest(peer, { "x-forwarded-for": `203.0.113.9, ${peer}` }), trusted),
    ).toBe("203.0.113.9");
    expect(
      resolveClientIp(
        fakeRequest(peer, { "x-forwarded-for": `1.2.3.4, 203.0.113.9, ${peer}` }),
        trusted,
      ),
    ).toBe("203.0.113.9");
  });

  it("defaults the chain mode to last_hop and rejects unknown values", () => {
    expect(parseTrustedProxyChainMode(undefined)).toBe("last_hop");
    expect(parseTrustedProxyChainMode("")).toBe("last_hop");
    expect(parseTrustedProxyChainMode("first_hop")).toBe("last_hop");
    expect(parseTrustedProxyChainMode("LAST_HOP")).toBe("last_hop");
    expect(parseTrustedProxyChainMode("platform_replaced_xff")).toBe("platform_replaced_xff");
  });

  it("keeps last_hop semantics by default when a trusted proxy is present", () => {
    const request = fakeRequest("10.0.0.5", {
      "x-forwarded-for": "1.2.3.4, 203.0.113.9",
    });
    expect(resolveClientIp(request, ["10.0.0.5"])).toBe("203.0.113.9");
    expect(resolveClientIp(request, ["10.0.0.5"], "last_hop")).toBe("203.0.113.9");
  });

  it("takes the left-most entry only in platform_replaced_xff mode", () => {
    const request = fakeRequest("10.0.0.5", {
      "x-forwarded-for": "203.0.113.9, 89.222.123.194",
    });
    expect(resolveClientIp(request, ["10.0.0.5"])).toBe("89.222.123.194");
    expect(resolveClientIp(request, ["10.0.0.5"], "platform_replaced_xff")).toBe("203.0.113.9");
  });

  it("platform_replaced_xff ignores headers from an untrusted peer or with no proxy", () => {
    const request = fakeRequest("198.51.100.7", { "x-forwarded-for": "203.0.113.9, 89.0.0.1" });
    expect(resolveClientIp(request, ["10.0.0.5"], "platform_replaced_xff")).toBe("198.51.100.7");
    expect(resolveClientIp(request, [], "platform_replaced_xff")).toBe("198.51.100.7");
  });

  it("platform_replaced_xff falls back to the socket peer for empty or malformed chains", () => {
    const peer = "10.0.0.5";
    expect(resolveClientIp(fakeRequest(peer, {}), [peer], "platform_replaced_xff")).toBe(peer);
    expect(
      resolveClientIp(
        fakeRequest(peer, { "x-forwarded-for": "  ,  , " }),
        [peer],
        "platform_replaced_xff",
      ),
    ).toBe(peer);
    expect(
      resolveClientIp(
        fakeRequest(peer, { "x-forwarded-for": ["", ""] }),
        [peer],
        "platform_replaced_xff",
      ),
    ).toBe(peer);
  });

  it("platform_replaced_xff uses the left-most of a duplicated header array", () => {
    const request = fakeRequest("10.0.0.5", {
      "x-forwarded-for": ["203.0.113.9", "89.222.123.194"],
    });
    expect(resolveClientIp(request, ["10.0.0.5"], "platform_replaced_xff")).toBe("203.0.113.9");
  });

  it("parses and normalises proxy configuration", () => {
    expect(parseTrustedProxies(" 10.0.0.1 , 10.0.0.2 ,, ")).toEqual(["10.0.0.1", "10.0.0.2"]);
    expect(parseTrustedProxies(undefined)).toEqual([]);
    expect(normalizeIp("::ffff:127.0.0.1")).toBe("127.0.0.1");
  });
});

describe("edge ignores spoofed forwarding headers", () => {
  it("does not let X-Forwarded-Host/Proto/X-Forwarded-For change the decision", async () => {
    const harness = createEdgeHarness({ trustedProxies: [] });
    const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
    const server = await startEdgeServer(harness.app);
    try {
      const response = await edgeRequest(server.url, "/api/optihub/v1/context", {
        host: API_HOST,
        headers: {
          authorization: `Bearer ${credential.secret}`,
          "x-forwarded-for": "9.9.9.9",
          "x-forwarded-host": FORBIDDEN_ONYX_HOST,
          "x-forwarded-proto": "https",
        },
      });
      expect(response.status).toBe(200);

      const allowed = harness.audit.entries.find(entry => entry.decision === "ALLOW");
      expect(allowed?.ipHash).toBe(hashClientAddress("127.0.0.1"));
      expect(allowed?.ipHash).not.toBe(hashClientAddress("9.9.9.9"));
    } finally {
      await server.close();
    }
  }, 20_000);

  it("denies a forbidden Host even when X-Forwarded-Host claims the API host", async () => {
    const harness = createEdgeHarness({ trustedProxies: [] });
    const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
    const server = await startEdgeServer(harness.app);
    try {
      const response = await edgeRequest(server.url, "/api/optihub/v1/context", {
        host: FORBIDDEN_ONYX_HOST,
        headers: {
          authorization: `Bearer ${credential.secret}`,
          "x-forwarded-host": API_HOST,
        },
      });
      expect(response.status).toBe(403);
      expect((response.body as { error: { code: string } }).error.code).toBe("HOST_DENIED");
    } finally {
      await server.close();
    }
  }, 20_000);
});

describe("edge trusted proxy chain mode", () => {
  it("platform_replaced_xff records the left-most client, not the transport hop", async () => {
    const harness = createEdgeHarness({
      trustedProxies: ["127.0.0.1"],
      trustedProxyChain: "platform_replaced_xff",
    });
    const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
    const server = await startEdgeServer(harness.app);
    try {
      const response = await edgeRequest(server.url, "/api/optihub/v1/context", {
        host: API_HOST,
        headers: {
          authorization: `Bearer ${credential.secret}`,
          "x-forwarded-for": "203.0.113.9, 89.222.123.194",
        },
      });
      expect(response.status).toBe(200);

      const allowed = harness.audit.entries.find(entry => entry.decision === "ALLOW");
      expect(allowed?.ipHash).toBe(hashClientAddress("203.0.113.9"));
      expect(allowed?.ipHash).not.toBe(hashClientAddress("89.222.123.194"));
    } finally {
      await server.close();
    }
  }, 20_000);

  it("default mode is unchanged for the same trusted proxy and headers", async () => {
    const harness = createEdgeHarness({ trustedProxies: ["127.0.0.1"] });
    const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
    const server = await startEdgeServer(harness.app);
    try {
      const response = await edgeRequest(server.url, "/api/optihub/v1/context", {
        host: API_HOST,
        headers: {
          authorization: `Bearer ${credential.secret}`,
          "x-forwarded-for": "203.0.113.9, 89.222.123.194",
        },
      });
      expect(response.status).toBe(200);

      const allowed = harness.audit.entries.find(entry => entry.decision === "ALLOW");
      expect(allowed?.ipHash).toBe(hashClientAddress("89.222.123.194"));
      expect(allowed?.ipHash).not.toBe(hashClientAddress("203.0.113.9"));
    } finally {
      await server.close();
    }
  }, 20_000);
});

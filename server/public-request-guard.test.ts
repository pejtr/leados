import { TRPCError } from "@trpc/server";
import { afterEach, describe, expect, it } from "vitest";
import type { Request } from "express";
import {
  enforcePublicRateLimit,
  hasValidSharedSecret,
  resetPublicRateLimitsForTests,
} from "./public-request-guard";

function request(headers: Record<string, string> = {}) {
  return {
    headers,
    socket: { remoteAddress: "127.0.0.1" },
    ip: "127.0.0.1",
  } as unknown as Request;
}

afterEach(() => resetPublicRateLimitsForTests());

describe("public request guard", () => {
  it("blocks a client after the configured number of requests", () => {
    const req = request({ "user-agent": "qa" });
    enforcePublicRateLimit(req, "chat", 2, 60_000, 1_000);
    enforcePublicRateLimit(req, "chat", 2, 60_000, 1_001);

    expect(() => enforcePublicRateLimit(req, "chat", 2, 60_000, 1_002))
      .toThrowError(TRPCError);
  });

  it("resets limits after the time window and keeps scopes separate", () => {
    const req = request();
    enforcePublicRateLimit(req, "chat", 1, 1_000, 1_000);
    enforcePublicRateLimit(req, "lead", 1, 1_000, 1_001);
    expect(() => enforcePublicRateLimit(req, "chat", 1, 1_000, 2_001)).not.toThrow();
  });

  it("compares webhook secrets without accepting missing or partial values", () => {
    expect(hasValidSharedSecret(request({ "x-manus-webhook-secret": "secret-value" }), "x-manus-webhook-secret", "secret-value")).toBe(true);
    expect(hasValidSharedSecret(request({ "x-manus-webhook-secret": "secret" }), "x-manus-webhook-secret", "secret-value")).toBe(false);
    expect(hasValidSharedSecret(request(), "x-manus-webhook-secret", "secret-value")).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { generateApiKey, hashApiKey, hasPermission } from "./apiKeys";
import type { ApiKey } from "../drizzle/schema";

describe("API Keys - Pure Functions", () => {
  describe("generateApiKey", () => {
    it("generates a key with leadOS_ prefix", () => {
      const key = generateApiKey();
      expect(key).toMatch(/^leadOS_[a-f0-9]+$/);
    });

    it("generates 71-character keys (prefix + 64 hex)", () => {
      const key = generateApiKey();
      expect(key.length).toBe(71);
    });

    it("generates unique keys on each call", () => {
      const keys = new Set(Array.from({ length: 50 }, () => generateApiKey()));
      expect(keys.size).toBe(50);
    });

    it("generates keys with only hex characters after prefix", () => {
      const key = generateApiKey();
      const hexPart = key.slice("leadOS_".length);
      expect(hexPart).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe("hashApiKey", () => {
    it("returns a 64-char hex string (SHA-256)", () => {
      const hash = hashApiKey("test-key");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("is deterministic", () => {
      const h1 = hashApiKey("my-key");
      const h2 = hashApiKey("my-key");
      expect(h1).toBe(h2);
    });

    it("produces different hashes for different inputs", () => {
      const h1 = hashApiKey("key-a");
      const h2 = hashApiKey("key-b");
      expect(h1).not.toBe(h2);
    });

      it("produces consistent output with known input", () => {
        const expected = crypto.createHash("sha256").update("hello").digest("hex");
        expect(hashApiKey("hello")).toBe(expected);
      });
  });

  describe("hasPermission", () => {
    function makeApiKey(overrides: Partial<ApiKey> = {}): ApiKey {
      return {
        id: 1,
        userId: 1,
        name: "test",
        keyHash: "abc",
        permissions: "read",
        status: "active",
        createdAt: Date.now(),
        expiresAt: null,
        lastUsedAt: null,
        ...overrides,
      } as ApiKey;
    }

    it("grants access when permission matches exactly", () => {
      const key = makeApiKey({ permissions: "read" });
      expect(hasPermission(key, "read")).toBe(true);
    });

    it("grants access for admin permission", () => {
      const key = makeApiKey({ permissions: "admin" });
      expect(hasPermission(key, "admin")).toBe(true);
    });

    it("denies access when permission doesn't match", () => {
      const key = makeApiKey({ permissions: "read" });
      expect(hasPermission(key, "write")).toBe(false);
    });

    it("admin permission grants read access", () => {
      const key = makeApiKey({ permissions: "admin" });
      expect(hasPermission(key, "read")).toBe(true);
    });

    it("admin permission grants write access", () => {
      const key = makeApiKey({ permissions: "admin" });
      expect(hasPermission(key, "write")).toBe(true);
    });

    it("read permission does not grant admin access", () => {
      const key = makeApiKey({ permissions: "read" });
      expect(hasPermission(key, "admin")).toBe(false);
    });

    it("handles comma-separated permissions", () => {
      const key = makeApiKey({ permissions: "read,write" });
      expect(hasPermission(key, "read")).toBe(true);
      expect(hasPermission(key, "write")).toBe(true);
      expect(hasPermission(key, "delete")).toBe(false);
    });
  });
});

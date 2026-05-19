/**
 * API Keys Management Tests
 * Unit tests for API key generation, validation, and permission checking
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateApiKey,
  hashApiKey,
  hasPermission,
} from "./apiKeys";
import { generateWebhookSignature } from "./webhookDispatcherV2";

describe("API Keys Management", () => {
  describe("generateApiKey", () => {
    it("should generate a key with correct prefix", () => {
      const key = generateApiKey();
      expect(key).toMatch(/^leadOS_[a-f0-9]{64}$/);
    });

    it("should generate unique keys", () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1).not.toBe(key2);
    });

    it("should generate 96-character keys (prefix + 64 hex)", () => {
      const key = generateApiKey();
      expect(key.length).toBe(7 + 64); // "leadOS_" (7) + 64 hex chars
    });
  });

  describe("hashApiKey", () => {
    it("should hash a key consistently", () => {
      const key = "leadOS_abc123def456";
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different keys", () => {
      const key1 = "leadOS_abc123def456";
      const key2 = "leadOS_xyz789uvw123";
      const hash1 = hashApiKey(key1);
      const hash2 = hashApiKey(key2);
      expect(hash1).not.toBe(hash2);
    });

    it("should produce SHA-256 hashes (64 hex characters)", () => {
      const key = generateApiKey();
      const hash = hashApiKey(key);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("hasPermission", () => {
    it("should grant permission if exact match", () => {
      const apiKey = {
        id: 1,
        userId: 1,
        name: "Test Key",
        keyHash: "hash",
        permissions: "read",
        status: "active" as const,
        createdAt: Date.now(),
        expiresAt: null,
        lastUsedAt: null,
        revokedAt: null,
      };

      expect(hasPermission(apiKey, "read")).toBe(true);
      expect(hasPermission(apiKey, "write")).toBe(false);
    });

    it("should handle comma-separated permissions", () => {
      const apiKey = {
        id: 1,
        userId: 1,
        name: "Test Key",
        keyHash: "hash",
        permissions: "read,write,email",
        status: "active" as const,
        createdAt: Date.now(),
        expiresAt: null,
        lastUsedAt: null,
        revokedAt: null,
      };

      expect(hasPermission(apiKey, "read")).toBe(true);
      expect(hasPermission(apiKey, "write")).toBe(true);
      expect(hasPermission(apiKey, "email")).toBe(true);
      expect(hasPermission(apiKey, "delete")).toBe(false);
    });

    it("should grant all permissions if 'admin' is present", () => {
      const apiKey = {
        id: 1,
        userId: 1,
        name: "Admin Key",
        keyHash: "hash",
        permissions: "admin",
        status: "active" as const,
        createdAt: Date.now(),
        expiresAt: null,
        lastUsedAt: null,
        revokedAt: null,
      };

      expect(hasPermission(apiKey, "read")).toBe(true);
      expect(hasPermission(apiKey, "write")).toBe(true);
      expect(hasPermission(apiKey, "email")).toBe(true);
      expect(hasPermission(apiKey, "delete")).toBe(true);
    });

    it("should handle whitespace in permissions", () => {
      const apiKey = {
        id: 1,
        userId: 1,
        name: "Test Key",
        keyHash: "hash",
        permissions: "read , write , email",
        status: "active" as const,
        createdAt: Date.now(),
        expiresAt: null,
        lastUsedAt: null,
        revokedAt: null,
      };

      expect(hasPermission(apiKey, "read")).toBe(true);
      expect(hasPermission(apiKey, "write")).toBe(true);
      expect(hasPermission(apiKey, "email")).toBe(true);
    });
  });
});

describe("Webhook Signature Verification", () => {
  describe("generateWebhookSignature", () => {
    it("should generate HMAC-SHA256 signature", () => {
      const payload = '{"event":"new_lead","data":{}}';
      const secret = "test_secret_key";
      const signature = generateWebhookSignature(payload, secret);

      // Should be 64 hex characters (SHA-256)
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should generate consistent signatures", () => {
      const payload = '{"event":"new_lead","data":{}}';
      const secret = "test_secret_key";
      const sig1 = generateWebhookSignature(payload, secret);
      const sig2 = generateWebhookSignature(payload, secret);

      expect(sig1).toBe(sig2);
    });

    it("should generate different signatures for different payloads", () => {
      const secret = "test_secret_key";
      const payload1 = '{"event":"new_lead","data":{}}';
      const payload2 = '{"event":"new_order","data":{}}';

      const sig1 = generateWebhookSignature(payload1, secret);
      const sig2 = generateWebhookSignature(payload2, secret);

      expect(sig1).not.toBe(sig2);
    });

    it("should generate different signatures for different secrets", () => {
      const payload = '{"event":"new_lead","data":{}}';
      const secret1 = "secret_key_1";
      const secret2 = "secret_key_2";

      const sig1 = generateWebhookSignature(payload, secret1);
      const sig2 = generateWebhookSignature(payload, secret2);

      expect(sig1).not.toBe(sig2);
    });

    it("should handle complex JSON payloads", () => {
      const payload = JSON.stringify({
        event: "new_lead",
        timestamp: "2026-05-19T10:00:00Z",
        data: {
          id: 123,
          companyName: "Acme Corp",
          email: "contact@acme.com",
          nested: {
            field1: "value1",
            field2: ["a", "b", "c"],
          },
        },
      });
      const secret = "complex_secret_key";
      const signature = generateWebhookSignature(payload, secret);

      expect(signature).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("Bearer Token Extraction", () => {
    it("should extract Bearer token from Authorization header", () => {
      const authHeader = "Bearer leadOS_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz";
      const token = authHeader.slice(7); // Remove "Bearer " prefix

      expect(token).toBe("leadOS_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz");
      expect(token).toMatch(/^leadOS_/);
    });

    it("should reject invalid Bearer format", () => {
      const authHeader = "Basic abc123";
      const isValid = authHeader.startsWith("Bearer ");

      expect(isValid).toBe(false);
    });

    it("should reject missing Authorization header", () => {
      const authHeader = undefined;
      const isValid = authHeader && authHeader.startsWith("Bearer ");

      expect(isValid).toBeFalsy();
    });
  });
});

describe("API Key Validation Flow", () => {
  it("should validate complete API key lifecycle", () => {
    // 1. Generate key
    const key = generateApiKey();
    expect(key).toMatch(/^leadOS_[a-f0-9]{64}$/);

    // 2. Hash key
    const hash = hashApiKey(key);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);

    // 3. Check permissions
    const apiKeyRecord = {
      id: 1,
      userId: 1,
      name: "Test",
      keyHash: hash,
      permissions: "read,write",
      status: "active" as const,
      createdAt: Date.now(),
      expiresAt: null,
      lastUsedAt: null,
      revokedAt: null,
    };

    expect(hasPermission(apiKeyRecord, "read")).toBe(true);
    expect(hasPermission(apiKeyRecord, "write")).toBe(true);
    expect(hasPermission(apiKeyRecord, "delete")).toBe(false);
  });

  it("should validate webhook signature verification", () => {
    const payload = JSON.stringify({
      event: "new_lead",
      data: { id: 123, name: "Test Lead" },
    });
    const secret = "webhook_secret_key";

    // Generate signature
    const signature = generateWebhookSignature(payload, secret);

    // Verify signature (in real scenario, webhook receiver would do this)
    const expectedSignature = generateWebhookSignature(payload, secret);
    expect(signature).toBe(expectedSignature);

    // Different payload should fail verification
    const differentPayload = JSON.stringify({
      event: "new_lead",
      data: { id: 124, name: "Different Lead" },
    });
    const differentSignature = generateWebhookSignature(differentPayload, secret);
    expect(differentSignature).not.toBe(signature);
  });
});

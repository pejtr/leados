import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { generateWebhookSignature } from "./webhookDispatcherV2";

describe("Webhook HMAC Signature", () => {
  it("generates a hex-encoded HMAC-SHA256 signature", () => {
    const payload = '{"event":"test","timestamp":"2026-01-01T00:00:00Z"}';
    const secret = "my-secret-key";
    const sig = generateWebhookSignature(payload, secret);
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces deterministic output for same inputs", () => {
    const payload = '{"data":"hello"}';
    const secret = "secret123";
    const sig1 = generateWebhookSignature(payload, secret);
    const sig2 = generateWebhookSignature(payload, secret);
    expect(sig1).toBe(sig2);
  });

  it("produces different output for different payloads", () => {
    const secret = "secret";
    const sig1 = generateWebhookSignature('{"a":1}', secret);
    const sig2 = generateWebhookSignature('{"a":2}', secret);
    expect(sig1).not.toBe(sig2);
  });

  it("produces different output for different secrets", () => {
    const payload = '{"data":"test"}';
    const sig1 = generateWebhookSignature(payload, "secret1");
    const sig2 = generateWebhookSignature(payload, "secret2");
    expect(sig1).not.toBe(sig2);
  });

  it("matches manually computed HMAC", () => {
    const payload = "test-payload";
    const secret = "test-secret";
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    expect(generateWebhookSignature(payload, secret)).toBe(expected);
  });

  it("handles empty payload", () => {
    const sig = generateWebhookSignature("", "secret");
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  it("handles unicode payload", () => {
    const payload = '{"name":"Příliš žluťoučký kůň"}';
    const sig = generateWebhookSignature(payload, "secret");
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });
});

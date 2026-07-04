import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validatorProvider, validateAnswer } from "./dualBrain";

const ENV_KEYS = ["CML_VALIDATOR", "DEEPSEEK_API_KEY", "GEMINI_API_KEY", "ANTHROPIC_API_KEY"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
});

describe("validatorProvider selection", () => {
  it("returns none without any key", () => {
    expect(validatorProvider()).toBe("none");
  });

  it("prefers deepseek when primary is Anthropic (different model for HERA)", () => {
    process.env.ANTHROPIC_API_KEY = "ant-test";
    process.env.DEEPSEEK_API_KEY = "ds-test";
    process.env.GEMINI_API_KEY = "gm-test";
    expect(validatorProvider()).toBe("deepseek");
  });

  it("prefers gemini when primary is DeepSeek (no Anthropic key)", () => {
    process.env.DEEPSEEK_API_KEY = "ds-test";
    process.env.GEMINI_API_KEY = "gm-test";
    expect(validatorProvider()).toBe("gemini");
  });

  it("falls back to same-model deepseek when it is the only key", () => {
    process.env.DEEPSEEK_API_KEY = "ds-test";
    expect(validatorProvider()).toBe("deepseek");
  });

  it("falls back to gemini when only gemini key is set", () => {
    process.env.GEMINI_API_KEY = "gm-test";
    expect(validatorProvider()).toBe("gemini");
  });

  it("CML_VALIDATOR=off disables validation even with keys", () => {
    process.env.DEEPSEEK_API_KEY = "ds-test";
    process.env.CML_VALIDATOR = "off";
    expect(validatorProvider()).toBe("none");
  });

  it("CML_VALIDATOR=gemini forces gemini", () => {
    process.env.DEEPSEEK_API_KEY = "ds-test";
    process.env.GEMINI_API_KEY = "gm-test";
    process.env.CML_VALIDATOR = "gemini";
    expect(validatorProvider()).toBe("gemini");
  });
});

describe("validateAnswer", () => {
  it("returns null when no provider is configured (draft stands)", async () => {
    expect(await validateAnswer("otázka", "návrh")).toBeNull();
  });

  it("returns HERA-validated text via deepseek", async () => {
    process.env.DEEPSEEK_API_KEY = "ds-test";
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "finální validovaná odpověď" } }] }),
    })));
    expect(await validateAnswer("otázka", "návrh")).toBe("finální validovaná odpověď");
    const call = (fetch as any).mock.calls[0];
    expect(call[0]).toContain("api.deepseek.com");
    const body = JSON.parse(call[1].body);
    expect(body.messages[1].content).toContain("NÁVRH ODPOVĚDI (HERMES)");
  });

  it("returns null on provider HTTP error (never throws)", async () => {
    process.env.DEEPSEEK_API_KEY = "ds-test";
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    expect(await validateAnswer("otázka", "návrh")).toBeNull();
  });

  it("returns null on network failure (never throws)", async () => {
    process.env.DEEPSEEK_API_KEY = "ds-test";
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("síť spadla"); }));
    expect(await validateAnswer("otázka", "návrh")).toBeNull();
  });
});

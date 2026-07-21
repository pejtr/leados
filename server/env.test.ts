import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ENV defaults", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("port defaults to 3000", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.port).toBe(3000);
  });

  it("isProduction defaults to false", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.isProduction).toBe(false);
  });

  it("hubPublicUrl defaults to localhost:3001", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.hubPublicUrl).toBe("http://localhost:3001");
  });

  it("cookieSecret defaults to empty string", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.cookieSecret).toBe("");
  });

  it("devAutoLogin defaults to false", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.devAutoLogin).toBe(false);
  });

  it("auditLogEnabled defaults to true", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.auditLogEnabled).toBe(true);
  });

  it("rateLimitEnabled defaults to true", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.rateLimitEnabled).toBe(true);
  });

  it("karrEnabled defaults to true (env not set to 'false')", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.karrEnabled).toBe(true);
  });

  it("mcpAllowedTools defaults to empty array", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.mcpAllowedTools).toEqual([]);
  });
});

describe("ENV with PORT set", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("parses PORT env var as number", async () => {
    process.env.PORT = "4000";
    const { ENV } = await import("./_core/env");
    expect(ENV.port).toBe(4000);
  });
});

describe("ENV with DEV_AUTO_LOGIN", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("sets devAutoLogin true when DEV_AUTO_LOGIN=true", async () => {
    process.env.DEV_AUTO_LOGIN = "true";
    const { ENV } = await import("./_core/env");
    expect(ENV.devAutoLogin).toBe(true);
  });
});

describe("ENV with MCP_ALLOWED_TOOLS", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("splits comma-separated MCP_ALLOWED_TOOLS", async () => {
    process.env.MCP_ALLOWED_TOOLS = "read, write, execute";
    const { ENV } = await import("./_core/env");
    expect(ENV.mcpAllowedTools).toEqual(["read", "write", "execute"]);
  });
});

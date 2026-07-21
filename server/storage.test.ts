import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("storage - config validation", () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    process.env.BUILT_IN_FORGE_API_URL = "";
    process.env.BUILT_IN_FORGE_API_KEY = "";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("storagePut throws when credentials missing", async () => {
    const mod = await import("./storage");
    await expect(
      mod.storagePut("test.txt", "hello")
    ).rejects.toThrow("Storage proxy credentials missing");
  });

  it("storageGet throws when credentials missing", async () => {
    const mod = await import("./storage");
    await expect(mod.storageGet("test.txt")).rejects.toThrow(
      "Storage proxy credentials missing"
    );
  });
});

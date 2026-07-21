import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { worldMonitorProvider } from "./signalProviders/worldMonitorProvider";

describe("worldMonitorProvider", () => {
  const originalEnv = { ...process.env };

  afterAll(() => {
    process.env = originalEnv;
  });

  it("has name 'WorldMonitor API'", () => {
    expect(worldMonitorProvider.name).toBe("WorldMonitor API");
  });

  it("has slug 'world_monitor'", () => {
    expect(worldMonitorProvider.slug).toBe("world_monitor");
  });

  describe("isConfigured", () => {
    beforeAll(() => {
      delete process.env.WORLD_MONITOR_API_BASE_URL;
      delete process.env.WORLD_MONITOR_API_KEY;
    });

    it("returns false when env vars not set", () => {
      expect(worldMonitorProvider.isConfigured()).toBe(false);
    });
  });

  describe("fetchSignals", () => {
    beforeAll(() => {
      delete process.env.WORLD_MONITOR_API_BASE_URL;
      delete process.env.WORLD_MONITOR_API_KEY;
    });

    it("returns empty array when not configured", async () => {
      const signals = await worldMonitorProvider.fetchSignals();
      expect(signals).toEqual([]);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getEmailSequences: vi.fn().mockResolvedValue([]),
  getSequenceEnrollments: vi.fn().mockResolvedValue([]),
}));

vi.mock("../drizzle/schema", () => ({
  emailSequenceEnrollments: {},
  emailSequenceSteps: {},
  emailSequences: {},
  leads: {},
  users: {},
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("Sequence Scheduler", () => {
  it("starts and stops without errors", async () => {
    const { startSequenceScheduler, stopSequenceScheduler } = await import("./sequenceScheduler");
    expect(() => startSequenceScheduler()).not.toThrow();
    expect(() => stopSequenceScheduler()).not.toThrow();
  });

  it("does not throw when db is unavailable", async () => {
    // getDb returns null — scheduler should handle gracefully
    const { startSequenceScheduler, stopSequenceScheduler } = await import("./sequenceScheduler");
    startSequenceScheduler();
    // Wait a tick for the async check to run
    await new Promise(r => setTimeout(r, 50));
    stopSequenceScheduler();
    // No error thrown = pass
    expect(true).toBe(true);
  });
});

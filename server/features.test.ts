import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createAnonContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

// ─── B2B Matching Router Tests ───
describe("matching router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.matching.list()).rejects.toThrow();
  });

  it("requires authentication for create", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.matching.create({
        name: "Test ICP",
        industries: "Technology",
        companySizeMin: 10,
        companySizeMax: 500,
        locations: "US",
      })
    ).rejects.toThrow();
  });

  it("validates create input schema", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Missing required fields should throw
    await expect(
      caller.matching.create({
        name: "",
        industries: "Tech",
        companySizeMin: 10,
        companySizeMax: 500,
        locations: "US",
      })
    ).rejects.toThrow();
  });

  it("delete with non-existent id returns success", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.matching.delete({ id: -1 });
    expect(result).toEqual({ success: true });
  });
});

// ─── SDR Agent Router Tests ───
describe("sdr router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.sdr.list()).rejects.toThrow();
  });

  it("requires authentication for create", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.sdr.create({
        name: "Test Campaign",
        industry: "Technology",
        location: "US",
        seniorityLevel: "C-Level",
        leadCount: 20,
        emailTone: "professional",
        followUpDays: 3,
        maxFollowUps: 2,
      })
    ).rejects.toThrow();
  });

  it("validates create input - empty name rejected", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.sdr.create({
        name: "",
        industry: "Technology",
        location: "US",
        seniorityLevel: "C-Level",
        leadCount: 20,
        emailTone: "professional",
        followUpDays: 3,
        maxFollowUps: 2,
      })
    ).rejects.toThrow();
  });

  it("validates email tone enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.sdr.create({
        name: "Test",
        industry: "Tech",
        location: "US",
        seniorityLevel: "C-Level",
        leadCount: 20,
        emailTone: "invalid_tone" as any,
        followUpDays: 3,
        maxFollowUps: 2,
      })
    ).rejects.toThrow();
  });
});

// ─── NBA (Next Best Action) Router Tests ───
describe("nba router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.nba.list({ limit: 10 })).rejects.toThrow();
  });

  it("requires authentication for generate", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.nba.generate({ leadIds: [1, 2, 3] })
    ).rejects.toThrow();
  });

  it("requires authentication for action", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.nba.action({ id: 1 })
    ).rejects.toThrow();
  });

  it("requires authentication for dismiss", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.nba.dismiss({ id: 1 })
    ).rejects.toThrow();
  });
});

// ─── Social Listening Router Tests ───
describe("social router", () => {
  it("requires authentication for monitors list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.social.monitors()).rejects.toThrow();
  });

  it("requires authentication for createMonitor", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.social.createMonitor({
        name: "Test Monitor",
        keywords: "AI, automation",
        platforms: "linkedin",
      })
    ).rejects.toThrow();
  });

  it("requires authentication for allSignals", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.social.allSignals({ limit: 10 })
    ).rejects.toThrow();
  });

  it("validates createMonitor input - empty name rejected", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.social.createMonitor({
        name: "",
        keywords: "test",
        platforms: "linkedin",
      })
    ).rejects.toThrow();
  });
});

// ─── Integrations Router Tests ───
describe("integrations router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.integrations.list()).rejects.toThrow();
  });

  it("requires authentication for create", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.integrations.create({
        name: "Test Webhook",
        type: "generic",
        webhookUrl: "https://hooks.example.com/test",
        triggerOnGenerate: true,
        triggerOnStatusChange: false,
        triggerOnDealClose: false,
      })
    ).rejects.toThrow();
  });
});

// ─── Autopilot Router Tests ───
describe("autopilot router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.autopilot.list()).rejects.toThrow();
  });

  it("requires authentication for create", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.autopilot.create({
        name: "Test Autopilot",
        industry: "Technology",
        location: "US",
        seniorityLevel: "C-Level",
        leadCount: 20,
        scheduleType: "daily",
        scheduleHour: 9,
      })
    ).rejects.toThrow();
  });
});

// ─── Router Structure Tests ───
describe("appRouter structure", () => {
  it("has all expected routers", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify all routers exist
    expect(caller.matching).toBeDefined();
    expect(caller.sdr).toBeDefined();
    expect(caller.nba).toBeDefined();
    expect(caller.social).toBeDefined();
    expect(caller.integrations).toBeDefined();
    expect(caller.autopilot).toBeDefined();
    expect(caller.leads).toBeDefined();
    expect(caller.auth).toBeDefined();
  });

  it("matching router has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.matching.list).toBe("function");
    expect(typeof caller.matching.create).toBe("function");
    expect(typeof caller.matching.update).toBe("function");
    expect(typeof caller.matching.delete).toBe("function");
    expect(typeof caller.matching.findMatches).toBe("function");
  });

  it("sdr router has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.sdr.list).toBe("function");
    expect(typeof caller.sdr.create).toBe("function");
    expect(typeof caller.sdr.update).toBe("function");
    expect(typeof caller.sdr.delete).toBe("function");
    expect(typeof caller.sdr.generateEmail).toBe("function");
  });

  it("nba router has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.nba.list).toBe("function");
    expect(typeof caller.nba.generate).toBe("function");
    expect(typeof caller.nba.action).toBe("function");
    expect(typeof caller.nba.dismiss).toBe("function");
  });

  it("social router has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.social.monitors).toBe("function");
    expect(typeof caller.social.createMonitor).toBe("function");
    expect(typeof caller.social.updateMonitor).toBe("function");
    expect(typeof caller.social.deleteMonitor).toBe("function");
    expect(typeof caller.social.signals).toBe("function");
    expect(typeof caller.social.allSignals).toBe("function");
    expect(typeof caller.social.convertToLead).toBe("function");
  });
});

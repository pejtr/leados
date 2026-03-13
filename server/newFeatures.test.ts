import { describe, expect, it, vi } from "vitest";
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
  return {
    ctx: {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    },
  };
}

function createAnonContext(): { ctx: TrpcContext } {
  return {
    ctx: {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    },
  };
}

// ─── Tracking Pixel ───
describe("trackingPixel router", () => {
  it("requires auth for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.trackingPixel.list()).rejects.toThrow();
  });

  it("requires auth for create", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.trackingPixel.create({ name: "Test", domain: "test.com" })).rejects.toThrow();
  });

  it("validates create input - empty name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.trackingPixel.create({ name: "", domain: "test.com" })).rejects.toThrow();
  });

  it("has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.trackingPixel.list).toBe("function");
    expect(typeof caller.trackingPixel.create).toBe("function");
    expect(typeof caller.trackingPixel.delete).toBe("function");
    expect(typeof caller.trackingPixel.toggle).toBe("function");
    expect(typeof caller.trackingPixel.allVisitors).toBe("function");
  });
});

// ─── Alert Rules ───
describe("alertRules router", () => {
  it("requires auth for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.alertRules.list()).rejects.toThrow();
  });

  it("requires auth for create", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.alertRules.create({ name: "Test", conditionType: "high_intent_visitor", conditionValue: "80", channel: "email", channelTarget: "test@test.com" })
    ).rejects.toThrow();
  });

  it("validates create input - empty name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.alertRules.create({ name: "", conditionType: "high_intent_visitor", conditionValue: "", channel: "email", channelTarget: "test@test.com" })
    ).rejects.toThrow();
  });

  it("has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.alertRules.list).toBe("function");
    expect(typeof caller.alertRules.create).toBe("function");
    expect(typeof caller.alertRules.update).toBe("function");
    expect(typeof caller.alertRules.delete).toBe("function");
  });
});

// ─── Smart Lists ───
describe("smartLists router", () => {
  it("requires auth for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.smartLists.list()).rejects.toThrow();
  });

  it("requires auth for create", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.smartLists.create({ name: "Test", description: "", filters: '{"industry":"SaaS"}', autoRefresh: false, refreshInterval: "daily" })
    ).rejects.toThrow();
  });

  it("has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.smartLists.list).toBe("function");
    expect(typeof caller.smartLists.create).toBe("function");
    expect(typeof caller.smartLists.update).toBe("function");
    expect(typeof caller.smartLists.delete).toBe("function");
  });
});

// ─── Email Verification ───
describe("emailVerification router", () => {
  it("requires auth for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.emailVerification.list()).rejects.toThrow();
  });

  it("requires auth for verify", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.emailVerification.verify({ email: "test@test.com" })).rejects.toThrow();
  });

  it("requires auth for bulkVerify", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.emailVerification.bulkVerify({ emails: ["a@b.com", "c@d.com"] })).rejects.toThrow();
  });

  it("has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.emailVerification.list).toBe("function");
    expect(typeof caller.emailVerification.verify).toBe("function");
    expect(typeof caller.emailVerification.bulkVerify).toBe("function");
  });
});

// ─── Campaign Rules ───
describe("campaignRules router", () => {
  it("requires auth for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.campaignRules.list()).rejects.toThrow();
  });

  it("requires auth for create", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.campaignRules.create({ name: "Test", triggerType: "lead_created", triggerValue: "", actionType: "send_email", actionValue: "test@test.com" })
    ).rejects.toThrow();
  });

  it("has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.campaignRules.list).toBe("function");
    expect(typeof caller.campaignRules.create).toBe("function");
    expect(typeof caller.campaignRules.update).toBe("function");
    expect(typeof caller.campaignRules.delete).toBe("function");
  });
});

// ─── Agency Panel ───
describe("agency router", () => {
  it("requires auth for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.agency.list()).rejects.toThrow();
  });

  it("requires auth for create", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.agency.create({ clientName: "Test", clientEmail: "test@test.com", clientDomain: "test.com", industry: "SaaS", brandColor: "#7c3aed" })
    ).rejects.toThrow();
  });

  it("has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.agency.list).toBe("function");
    expect(typeof caller.agency.create).toBe("function");
    expect(typeof caller.agency.update).toBe("function");
    expect(typeof caller.agency.delete).toBe("function");
  });
});

// ─── Speed to Lead ───
describe("speedToLead router", () => {
  it("requires auth for get", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.speedToLead.get()).rejects.toThrow();
  });

  it("requires auth for upsert", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.speedToLead.upsert({ isActive: true, autoEmailEnabled: true, responseDelaySeconds: 60, notifyOnNewLead: true, notifyChannel: "email", notifyTarget: "test@test.com" })
    ).rejects.toThrow();
  });

  it("has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.speedToLead.get).toBe("function");
    expect(typeof caller.speedToLead.upsert).toBe("function");
  });
});

// ─── ICP Builder ───
describe("icpBuilder router", () => {
  it("requires auth for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.icpBuilder.list()).rejects.toThrow();
  });

  it("requires auth for create", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.icpBuilder.create({ name: "Test", industries: "SaaS", locations: "US", companySizeMin: 10, companySizeMax: 500, revenueRange: "", technologies: "", buyingSignals: "", painPoints: "" })
    ).rejects.toThrow();
  });

  it("requires auth for aiGenerate", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.icpBuilder.aiGenerate({ description: "Test" })).rejects.toThrow();
  });

  it("has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.icpBuilder.list).toBe("function");
    expect(typeof caller.icpBuilder.create).toBe("function");
    expect(typeof caller.icpBuilder.delete).toBe("function");
    expect(typeof caller.icpBuilder.aiGenerate).toBe("function");
  });
});

// ─── Tech Stack ───
describe("techStack router", () => {
  it("requires auth for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.techStack.list()).rejects.toThrow();
  });

  it("requires auth for detect", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.techStack.detect({ domain: "example.com" })).rejects.toThrow();
  });

  it("has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.techStack.list).toBe("function");
    expect(typeof caller.techStack.detect).toBe("function");
  });
});

// ─── AI Agents ───
describe("aiAgents router", () => {
  it("requires auth for list", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.aiAgents.list()).rejects.toThrow();
  });

  it("requires auth for create", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.aiAgents.create({ name: "Test", description: "", agentType: "custom", config: '{"test":true}' })
    ).rejects.toThrow();
  });

  it("requires auth for execute", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.aiAgents.execute({ agentId: 1, input: "test" })).rejects.toThrow();
  });

  it("has expected procedures", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.aiAgents.list).toBe("function");
    expect(typeof caller.aiAgents.create).toBe("function");
    expect(typeof caller.aiAgents.update).toBe("function");
    expect(typeof caller.aiAgents.delete).toBe("function");
    expect(typeof caller.aiAgents.execute).toBe("function");
    expect(typeof caller.aiAgents.logs).toBe("function");
  });
});

// ─── Full Router Structure ───
describe("appRouter has all new routers", () => {
  it("has all 10 new feature routers", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.trackingPixel).toBeDefined();
    expect(caller.alertRules).toBeDefined();
    expect(caller.smartLists).toBeDefined();
    expect(caller.emailVerification).toBeDefined();
    expect(caller.campaignRules).toBeDefined();
    expect(caller.agency).toBeDefined();
    expect(caller.speedToLead).toBeDefined();
    expect(caller.icpBuilder).toBeDefined();
    expect(caller.techStack).toBeDefined();
    expect(caller.aiAgents).toBeDefined();
  });
});

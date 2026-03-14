import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 9999,
    openId: "crm-test-user",
    email: "crm@test.com",
    name: "CRM Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: {
      headers: {},
      cookies: {},
    } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  };
  return { ctx };
}

describe("CRM Router", () => {
  it("should have crm router in appRouter", () => {
    expect(appRouter._def.procedures).toBeDefined();
    // Check that crm procedures exist
    const procedureKeys = Object.keys(appRouter._def.procedures);
    const crmKeys = procedureKeys.filter(k => k.startsWith("crm."));
    expect(crmKeys.length).toBeGreaterThan(0);
  });

  it("should expose listDeals procedure", () => {
    const procedureKeys = Object.keys(appRouter._def.procedures);
    expect(procedureKeys).toContain("crm.listDeals");
  });

  it("should expose createDeal procedure", () => {
    const procedureKeys = Object.keys(appRouter._def.procedures);
    expect(procedureKeys).toContain("crm.createDeal");
  });

  it("should expose updateDeal procedure", () => {
    const procedureKeys = Object.keys(appRouter._def.procedures);
    expect(procedureKeys).toContain("crm.updateDeal");
  });

  it("should expose deleteDeal procedure", () => {
    const procedureKeys = Object.keys(appRouter._def.procedures);
    expect(procedureKeys).toContain("crm.deleteDeal");
  });

  it("should expose getDealStats procedure", () => {
    const procedureKeys = Object.keys(appRouter._def.procedures);
    expect(procedureKeys).toContain("crm.getDealStats");
  });

  it("should expose listQuotas procedure", () => {
    const procedureKeys = Object.keys(appRouter._def.procedures);
    expect(procedureKeys).toContain("crm.listQuotas");
  });

  it("should expose upsertQuota procedure", () => {
    const procedureKeys = Object.keys(appRouter._def.procedures);
    expect(procedureKeys).toContain("crm.upsertQuota");
  });

  it("should expose listCommissions procedure", () => {
    const procedureKeys = Object.keys(appRouter._def.procedures);
    expect(procedureKeys).toContain("crm.listCommissions");
  });

  it("should expose createCommission procedure", () => {
    const procedureKeys = Object.keys(appRouter._def.procedures);
    expect(procedureKeys).toContain("crm.createCommission");
  });
});

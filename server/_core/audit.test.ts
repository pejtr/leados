import { describe, it, expect, vi } from "vitest";

vi.mock("../db/audit", () => ({
  insertAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import { logAuditEvent, diffValues } from "./audit";

describe("logAuditEvent", () => {
  it("should call insertAuditEvent with correct data", async () => {
    const { insertAuditEvent } = await import("../db/audit");
    await logAuditEvent(1, "login", "user", 1, undefined, { lastSignedIn: new Date().toISOString() });
    expect(insertAuditEvent).toHaveBeenCalledTimes(1);
    const callArg = (insertAuditEvent as any).mock.calls[0][0];
    expect(callArg.userId).toBe(1);
    expect(callArg.eventType).toBe("login");
    expect(callArg.resourceType).toBe("user");
    expect(callArg.resourceId).toBe(1);
  });

  it("should not throw on failure", async () => {
    const { insertAuditEvent } = await import("../db/audit");
    (insertAuditEvent as any).mockRejectedValueOnce(new Error("DB error"));
    await expect(logAuditEvent(1, "test", "lead", 1, undefined, undefined)).resolves.toBeUndefined();
  });
});

describe("diffValues", () => {
  it("should return undefined when no changes", () => {
    const old = { status: "new", name: "Test" } as any;
    const result = diffValues(old, { status: "new" });
    expect(result.oldValue).toBeUndefined();
    expect(result.newValue).toBeUndefined();
  });

  it("should return partial diff when changes exist", () => {
    const old = { status: "new", name: "Test", industry: "Tech" } as any;
    const result = diffValues(old, { status: "contacted", industry: "Tech" });
    expect(result.oldValue).toEqual({ status: "new" });
    expect(result.newValue).toEqual({ status: "contacted" });
  });

  it("should return full newValue when no oldObj", () => {
    const result = diffValues(undefined, { status: "new" });
    expect(result.oldValue).toBeUndefined();
    expect(result.newValue).toEqual({ status: "new" });
  });
});

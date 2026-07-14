import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getNichePackages: vi.fn(),
  getCustomerSubscriptions: vi.fn(),
  createCustomerSubscription: vi.fn(),
  cancelCustomerSubscription: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("nichePackages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists niche packages", async () => {
    dbMocks.getNichePackages.mockResolvedValueOnce([]);
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const packages = await caller.nichePackages.list();

    expect(packages).toEqual([]);
    expect(dbMocks.getNichePackages).toHaveBeenCalledOnce();
  });
});

describe("subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists customer subscriptions", async () => {
    dbMocks.getCustomerSubscriptions.mockResolvedValueOnce([]);
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const subscriptions = await caller.subscriptions.list({ customerId: 1 });

    expect(subscriptions).toEqual([]);
    expect(dbMocks.getCustomerSubscriptions).toHaveBeenCalledWith(1);
  });

  it("creates a customer subscription", async () => {
    const inserted = { insertId: 42 };
    dbMocks.createCustomerSubscription.mockResolvedValueOnce(inserted);
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscriptions.create({
      customerId: 1,
      packageId: 1,
      monthlyPrice: 1000,
    });

    expect(result).toEqual(inserted);
    expect(dbMocks.createCustomerSubscription).toHaveBeenCalledWith({
      customerId: 1,
      packageId: 1,
      monthlyPrice: 1000,
    });
  });

  it("cancels a customer subscription", async () => {
    const updated = { affectedRows: 1 };
    dbMocks.cancelCustomerSubscription.mockResolvedValueOnce(updated);
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscriptions.cancel({
      subscriptionId: 1,
    });

    expect(result).toEqual(updated);
    expect(dbMocks.cancelCustomerSubscription).toHaveBeenCalledWith(1);
  });
});

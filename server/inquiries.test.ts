import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createInquiry, getInquiryById, listInquiries, updateInquiry } from "./db";

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock the database module
vi.mock("./db", () => ({
  createInquiry: vi.fn().mockResolvedValue({ insertId: 1 }),
  getInquiryById: vi.fn(),
  updateInquiry: vi.fn(),
  listInquiries: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      phone: "+420123456789",
      businessDescription: "Test business",
      packageType: "web-lead-gen",
      createdAt: new Date(),
      status: "new",
      notes: null,
    },
  ]),
  getPortfolioProjects: vi.fn().mockResolvedValue([]),
  getTestimonials: vi.fn().mockResolvedValue([]),
}));

const inquiryFixture = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  phone: "+420123456789",
  businessDescription: "Test business",
  packageType: "web-lead-gen",
  details: null,
  source: "test",
  createdAt: new Date(),
  status: "new" as const,
  notes: null,
};

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "owner@example.com",
      name: "Test Owner",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const ctx = createAuthContext();
  if (!ctx.user) throw new Error("Expected authenticated context");
  return { ...ctx, user: { ...ctx.user, role: "user" } };
}

function nextBookableDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("inquiries.create", () => {
  it("creates an inquiry with valid data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.create({
      name: "Jan Novák",
      email: "jan@example.com",
      phone: "+420123456789",
      businessDescription: "Elektrikářství",
      packageType: "web-lead-gen",
    });

    expect(result).toEqual({ success: true, id: 1 });
  });

  it("creates an inquiry with minimal data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.create({
      name: "Jana Svobodová",
      email: "jana@example.com",
    });

    expect(result).toEqual({ success: true, id: 1 });
  });

  it("requires name and email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.inquiries.create({
        name: "",
        email: "test@example.com",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("rejects an invalid email before writing to the database", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.inquiries.create({
      name: "Jan Novák",
      email: "not-an-email",
    })).rejects.toBeDefined();
    expect(createInquiry).not.toHaveBeenCalled();
  });
});

describe("inquiries.list", () => {
  it("returns list of inquiries for authenticated users", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.inquiries.list();
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("rejects authenticated non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());

    await expect(caller.inquiries.list()).rejects.toThrow("Unauthorized");
  });
});

describe("inquiries.bookCall", () => {
  it("stores an available weekday slot", async () => {
    const date = nextBookableDate();
    vi.mocked(getInquiryById).mockResolvedValueOnce(inquiryFixture);
    vi.mocked(listInquiries).mockResolvedValueOnce([inquiryFixture]);
    vi.mocked(updateInquiry).mockResolvedValueOnce({
      ...inquiryFixture,
      status: "contacted",
    });
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.inquiries.bookCall({
      inquiryId: 1,
      email: "TEST@example.com",
      date,
      time: "09:00",
    });

    expect(result.scheduledFor).toBe(`${date}T09:00`);
    expect(updateInquiry).toHaveBeenCalledOnce();
  });

  it("rejects an occupied slot", async () => {
    const date = nextBookableDate();
    vi.mocked(getInquiryById).mockResolvedValueOnce(inquiryFixture);
    vi.mocked(listInquiries).mockResolvedValueOnce([
      inquiryFixture,
      {
        ...inquiryFixture,
        id: 2,
        email: "other@example.com",
        details: JSON.stringify({ lifecycle: { call_booked: { scheduledFor: `${date}T13:00` } } }),
      },
    ]);
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.inquiries.bookCall({
      inquiryId: 1,
      email: "test@example.com",
      date,
      time: "13:00",
    })).rejects.toThrow("Booking slot is no longer available");
    expect(updateInquiry).not.toHaveBeenCalled();
  });
});

describe("portfolio.list", () => {
  it("returns portfolio projects for public access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portfolio.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("testimonials.list", () => {
  it("returns testimonials for public access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.testimonials.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("A/B analytics access", () => {
  it("rejects public access to internal metrics", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.ab.getMetrics()).rejects.toBeDefined();
    await expect(caller.ab.getSummary()).rejects.toBeDefined();
  });

  it("rejects non-admin access to internal metrics", async () => {
    const caller = appRouter.createCaller(createUserContext());

    await expect(caller.ab.getMetrics()).rejects.toThrow("Unauthorized");
    await expect(caller.ab.getSummary()).rejects.toThrow("Unauthorized");
  });
});

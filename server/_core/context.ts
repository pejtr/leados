import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Dev-only auto-login: bypass Manus OAuth when DEV_AUTO_LOGIN=true
  if (ENV.devAutoLogin && !ENV.isProduction) {
    const ownerOpenId = ENV.ownerOpenId || "dev-owner";
    const now = new Date();
    user = {
      id: 1,
      openId: ownerOpenId,
      name: "Dev User",
      email: "dev@local.test",
      loginMethod: "dev",
      role: "admin",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
      onboardingCompleted: true,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: "free",
      subscriptionPlan: "free",
      dailyTokenLimit: null,
      monthlyTokenLimit: null,
    };
    return { req: opts.req, res: opts.res, user };
  }

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

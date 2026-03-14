import { describe, it, expect } from "vitest";
import Stripe from "stripe";

const PRICE_IDS = {
  STRIPE_PRICE_STARTER_MONTHLY: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  STRIPE_PRICE_STARTER_YEARLY: process.env.STRIPE_PRICE_STARTER_YEARLY,
  STRIPE_PRICE_GROWTH_MONTHLY: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
  STRIPE_PRICE_GROWTH_YEARLY: process.env.STRIPE_PRICE_GROWTH_YEARLY,
  STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
  STRIPE_PRICE_PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY,
};

describe("Stripe Price IDs", () => {
  it("all 6 price ID env vars are set", () => {
    for (const [key, val] of Object.entries(PRICE_IDS)) {
      expect(val, `${key} should be set`).toBeTruthy();
      expect(val, `${key} should start with price_`).toMatch(/^price_/);
    }
  });

  it("Stripe secret key is set and starts with sk_test_", () => {
    const key = process.env.STRIPE_SECRET_KEY;
    expect(key).toBeTruthy();
    expect(key).toMatch(/^sk_test_/);
  });

  it("Price IDs are valid Stripe prices (API check)", async () => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // Only check the Starter monthly price to avoid rate limits
    const price = await stripe.prices.retrieve(PRICE_IDS.STRIPE_PRICE_STARTER_MONTHLY!);
    expect(price.id).toBe(PRICE_IDS.STRIPE_PRICE_STARTER_MONTHLY);
    expect(price.unit_amount).toBe(4900);
    expect(price.currency).toBe("usd");
    expect(price.recurring?.interval).toBe("month");
  }, 15000);
});

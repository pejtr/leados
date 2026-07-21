import { describe, it, expect } from "vitest";
import { STRIPE_PRODUCTS } from "./stripeProducts";
import type { PlanKey, BillingInterval } from "./stripeProducts";

describe("STRIPE_PRODUCTS", () => {
  const plans: PlanKey[] = ["starter", "growth", "pro"];

  it("has 3 plans", () => {
    expect(Object.keys(STRIPE_PRODUCTS)).toHaveLength(3);
  });

  for (const key of plans) {
    describe(`${key} plan`, () => {
      const plan = STRIPE_PRODUCTS[key];

      it("has a name", () => {
        expect(typeof plan.name).toBe("string");
        expect(plan.name.length).toBeGreaterThan(0);
      });

      it("has a description", () => {
        expect(typeof plan.description).toBe("string");
      });

      it("has priceMonthly > 0", () => {
        expect(plan.priceMonthly).toBeGreaterThan(0);
      });

      it("has priceYearly > 0", () => {
        expect(plan.priceYearly).toBeGreaterThan(0);
      });

      it("yearly is cheaper than 12× monthly", () => {
        expect(plan.priceYearly).toBeLessThan(plan.priceMonthly * 12);
      });

      it("has non-empty features array", () => {
        expect(plan.features.length).toBeGreaterThan(0);
      });

      it("has priceIdMonthly fallback", () => {
        expect(plan.priceIdMonthly).toContain("price_");
      });

      it("has priceIdYearly fallback", () => {
        expect(plan.priceIdYearly).toContain("price_");
      });
    });
  }

  it("starter costs less than growth", () => {
    expect(STRIPE_PRODUCTS.starter.priceMonthly).toBeLessThan(
      STRIPE_PRODUCTS.growth.priceMonthly
    );
  });

  it("growth costs less than pro", () => {
    expect(STRIPE_PRODUCTS.growth.priceMonthly).toBeLessThan(
      STRIPE_PRODUCTS.pro.priceMonthly
    );
  });
});

describe("PlanKey type", () => {
  it("accepts valid keys", () => {
    const valid: PlanKey[] = ["starter", "growth", "pro"];
    expect(valid).toHaveLength(3);
  });
});

describe("BillingInterval type", () => {
  it("accepts valid intervals", () => {
    const valid: BillingInterval[] = ["monthly", "yearly"];
    expect(valid).toHaveLength(2);
  });
});

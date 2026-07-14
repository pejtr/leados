import { describe, expect, it } from "vitest";
import { calculateDeposit, calculateRemaining, toStripeMinorUnits } from "./stripe-products";

describe("Stripe price calculations", () => {
  it("calculates a 30 percent deposit in CZK", () => {
    expect(calculateDeposit(3_490, 30)).toBe(1_047);
    expect(calculateRemaining(3_490, 1_047)).toBe(2_443);
  });

  it("converts CZK to Stripe minor units", () => {
    expect(toStripeMinorUnits(1_047)).toBe(104_700);
    expect(toStripeMinorUnits(1_499.5)).toBe(149_950);
  });
});

import { CHECKOUT_OFFERS } from "../shared/service-catalog";

/** Stripe uses the same source of truth as customer-facing pricing. */
export const ONYXWEB_PRODUCTS = CHECKOUT_OFFERS;

export const calculateDeposit = (priceInCzk: number, depositPercentage: number = 30): number => {
  return Math.round((priceInCzk * depositPercentage) / 100);
};

export const calculateRemaining = (priceInCzk: number, depositAmount: number): number => {
  return priceInCzk - depositAmount;
};

export const toStripeMinorUnits = (amountInCzk: number): number => {
  return Math.round(amountInCzk * 100);
};

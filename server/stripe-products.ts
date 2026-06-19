/**
 * Stripe Products Configuration
 * Define all products and prices for ONYX WEB services
 */

export const ONYXWEB_PRODUCTS = {
  // Web packages
  LITE_WEB: {
    name: "Lite Web",
    description: "Jednoduchý web bez automatizace",
    priceInCzk: 3490,
    depositPercentage: 30,
  },
  BASIC_WEB: {
    name: "Basic Web",
    description: "Profesionální web se základními funkcemi",
    priceInCzk: 4999,
    depositPercentage: 30,
  },
  WEB_LEAD_GEN: {
    name: "Web + Lead Gen",
    description: "Web s integrací ONYX OS",
    priceInCzk: 6990,
    depositPercentage: 30,
  },
  WEB_AUTOMATION: {
    name: "Web + Automatizace",
    description: "Web s plnou automatizací a správou sítí",
    priceInCzk: 9990,
    depositPercentage: 30,
  },
} as const;

export const calculateDeposit = (priceInCzk: number, depositPercentage: number = 30): number => {
  return Math.round((priceInCzk * depositPercentage) / 100);
};

export const calculateRemaining = (priceInCzk: number, depositAmount: number): number => {
  return priceInCzk - depositAmount;
};

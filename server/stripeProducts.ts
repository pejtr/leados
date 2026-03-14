export const STRIPE_PRODUCTS = {
  starter: {
    name: "LeadOS Starter",
    description: "Ideální pro freelancery a malé obchodní týmy",
    priceMonthly: 14900, // €149/month in cents
    priceYearly: 119000, // €1190/year in cents (~€99/mo)
    features: [
      "1 000 leadů/měsíc",
      "AI icebreakery",
      "Ověřování e-mailů",
      "Export CSV & Google Sheets",
      "Kanban pipeline",
      "1 uživatel",
    ],
    priceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "price_starter_monthly",
    priceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? "price_starter_yearly",
  },
  growth: {
    name: "LeadOS Growth",
    description: "Pro rostouci obchodní týmy, které potřebují více výkonu",
    priceMonthly: 39900, // €399/month in cents
    priceYearly: 319000, // €3190/year in cents (~€266/mo)
    features: [
      "5 000 leadů/měsíc",
      "AI SDR Agent (automatické oslovení)",
      "E-mailové sekvence",
      "LinkedIn scraping",
      "Social listening",
      "Tržní inteligence",
      "5 uživatelů",
    ],
    priceIdMonthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY ?? "price_growth_monthly",
    priceIdYearly: process.env.STRIPE_PRICE_GROWTH_YEARLY ?? "price_growth_yearly",
  },
  pro: {
    name: "LeadOS Pro",
    description: "Pro agentury a enterprise obchodní týmy",
    priceMonthly: 79900, // €799/month in cents
    priceYearly: 639000, // €6390/year in cents (~€532/mo)
    features: [
      "Neomezené leady",
      "Všechny AI funkce",
      "Competitive intelligence",
      "Znalostni báze (AI)",
      "Autopilot kampaňe",
      "Neomezení uživatelé",
      "Agency panel",
      "Prioritní podpora",
    ],
    priceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "price_pro_monthly",
    priceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? "price_pro_yearly",
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PRODUCTS;
export type BillingInterval = "monthly" | "yearly";

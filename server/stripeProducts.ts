export const STRIPE_PRODUCTS = {
  starter: {
    name: "Starter",
    description: "Perfect for solo founders and small sales teams",
    priceMonthly: 4900, // $49/month in cents
    priceYearly: 39000, // $390/year in cents
    features: [
      "500 leads/month",
      "AI icebreakers",
      "Email verification",
      "CSV export",
      "1 user",
    ],
    priceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "price_starter_monthly",
    priceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? "price_starter_yearly",
  },
  growth: {
    name: "Growth",
    description: "For growing sales teams that need more power",
    priceMonthly: 9900, // $99/month in cents
    priceYearly: 79000, // $790/year in cents
    features: [
      "2,500 leads/month",
      "AI SDR Agent",
      "Email sequences",
      "Capture planning",
      "Market intelligence",
      "5 users",
      "CRM integrations",
    ],
    priceIdMonthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY ?? "price_growth_monthly",
    priceIdYearly: process.env.STRIPE_PRICE_GROWTH_YEARLY ?? "price_growth_yearly",
  },
  pro: {
    name: "Pro",
    description: "For agencies and enterprise sales teams",
    priceMonthly: 24900, // $249/month in cents
    priceYearly: 199000, // $1990/year in cents
    features: [
      "Unlimited leads",
      "All AI features",
      "Competitive intelligence",
      "Knowledge base",
      "Autopilot campaigns",
      "Unlimited users",
      "Agency panel",
      "Priority support",
    ],
    priceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "price_pro_monthly",
    priceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? "price_pro_yearly",
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PRODUCTS;
export type BillingInterval = "monthly" | "yearly";

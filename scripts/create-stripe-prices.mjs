/**
 * Creates Stripe products and prices for all subscription plans.
 * Run: node scripts/create-stripe-prices.mjs
 */
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = [
  {
    key: "starter",
    name: "AI LeadGen — Starter",
    description: "Perfect for solo founders and small sales teams. 500 leads/month, AI icebreakers, email verification.",
    monthly: 4900,   // $49/month
    yearly: 39000,   // $390/year
  },
  {
    key: "growth",
    name: "AI LeadGen — Growth",
    description: "For growing sales teams. 2,500 leads/month, AI SDR Agent, email sequences, market intelligence.",
    monthly: 9900,   // $99/month
    yearly: 79000,   // $790/year
  },
  {
    key: "pro",
    name: "AI LeadGen — Pro",
    description: "For agencies and enterprise teams. Unlimited leads, all AI features, agency panel, priority support.",
    monthly: 24900,  // $249/month
    yearly: 199000,  // $1990/year
  },
];

const results = {};

for (const plan of PLANS) {
  console.log(`\nCreating product: ${plan.name}...`);

  // Create product
  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { plan_key: plan.key },
  });
  console.log(`  ✓ Product created: ${product.id}`);

  // Create monthly price
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.monthly,
    currency: "usd",
    recurring: { interval: "month" },
    nickname: `${plan.name} Monthly`,
    metadata: { plan_key: plan.key, interval: "monthly" },
  });
  console.log(`  ✓ Monthly price: ${monthlyPrice.id} ($${plan.monthly / 100}/month)`);

  // Create yearly price
  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.yearly,
    currency: "usd",
    recurring: { interval: "year" },
    nickname: `${plan.name} Yearly`,
    metadata: { plan_key: plan.key, interval: "yearly" },
  });
  console.log(`  ✓ Yearly price: ${yearlyPrice.id} ($${plan.yearly / 100}/year)`);

  results[plan.key] = {
    productId: product.id,
    monthlyPriceId: monthlyPrice.id,
    yearlyPriceId: yearlyPrice.id,
  };
}

console.log("\n\n=== PRICE IDs (add to environment secrets) ===\n");
for (const [key, ids] of Object.entries(results)) {
  const k = key.toUpperCase();
  console.log(`STRIPE_PRICE_${k}_MONTHLY=${ids.monthlyPriceId}`);
  console.log(`STRIPE_PRICE_${k}_YEARLY=${ids.yearlyPriceId}`);
}

console.log("\n=== JSON (for reference) ===");
console.log(JSON.stringify(results, null, 2));

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// ─── Helpers ────────────────────────────────────────────────────────────────
function generateCode(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${rand}`;
}

// ─── Router ─────────────────────────────────────────────────────────────────
export const affiliateRouter = router({
  // Get or create referral code for current user
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const rows = await db.execute(
      sql`SELECT * FROM referral_codes WHERE userId = ${ctx.user.id} LIMIT 1`
    );
    const existing = (rows as any)[0]?.[0];
    if (existing) return existing;
    // Auto-create
    const code = generateCode(ctx.user.name ?? ctx.user.email ?? "USER");
    await db.execute(
      sql`INSERT INTO referral_codes (userId, code, commissionRate) VALUES (${ctx.user.id}, ${code}, 20.00)`
    );
    const created = await db.execute(
      sql`SELECT * FROM referral_codes WHERE userId = ${ctx.user.id} LIMIT 1`
    );
    return (created as any)[0]?.[0];
  }),

  // Get referral stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const codeRows = await db.execute(
      sql`SELECT * FROM referral_codes WHERE userId = ${ctx.user.id} LIMIT 1`
    );
    const code = (codeRows as any)[0]?.[0];
    if (!code) return { clicks: 0, conversions: 0, totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0, recentConversions: [] };

    const convRows = await db.execute(
      sql`SELECT * FROM referral_conversions WHERE referrerId = ${ctx.user.id} ORDER BY createdAt DESC LIMIT 20`
    );
    const conversions = (convRows as any)[0] ?? [];

    const pendingEarnings = conversions
      .filter((c: any) => c.status === "pending" || c.status === "approved")
      .reduce((sum: number, c: any) => sum + parseFloat(c.commission ?? 0), 0);
    const paidEarnings = conversions
      .filter((c: any) => c.status === "paid")
      .reduce((sum: number, c: any) => sum + parseFloat(c.commission ?? 0), 0);

    return {
      clicks: code.clicks ?? 0,
      conversions: code.conversions ?? 0,
      totalEarnings: parseFloat(code.totalEarnings ?? 0),
      pendingEarnings,
      paidEarnings,
      commissionRate: parseFloat(code.commissionRate ?? 20),
      code: code.code,
      recentConversions: conversions.slice(0, 10),
    };
  }),

  // Track a referral click (called from landing page)
  trackClick: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: true };
      await db.execute(
        sql`UPDATE referral_codes SET clicks = clicks + 1 WHERE code = ${input.code}`
      );
      return { ok: true };
    }),

  // Record a referral conversion (called from Stripe webhook)
  recordConversion: protectedProcedure
    .input(z.object({
      code: z.string(),
      convertedUserId: z.number().optional(),
      plan: z.string(),
      amount: z.number(), // in cents
      stripePaymentIntentId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const codeRows = await db.execute(
        sql`SELECT * FROM referral_codes WHERE code = ${input.code} LIMIT 1`
      );
      const code = (codeRows as any)[0]?.[0];
      if (!code) throw new Error("Referral code not found");

      const amountEur = input.amount / 100;
      const commission = (amountEur * parseFloat(code.commissionRate)) / 100;

      await db.execute(
        sql`INSERT INTO referral_conversions (referralCodeId, referrerId, convertedUserId, plan, amount, commission, status, stripePaymentIntentId)
            VALUES (${code.id}, ${code.userId}, ${input.convertedUserId ?? null}, ${input.plan}, ${amountEur}, ${commission}, 'pending', ${input.stripePaymentIntentId ?? null})`
      );
      await db.execute(
        sql`UPDATE referral_codes SET conversions = conversions + 1, totalEarnings = totalEarnings + ${commission} WHERE id = ${code.id}`
      );
      return { ok: true, commission };
    }),

  // Get leaderboard (top affiliates)
  getLeaderboard: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.execute(
      sql`SELECT rc.code, rc.conversions, rc.totalEarnings, u.name
          FROM referral_codes rc
          JOIN users u ON u.id = rc.userId
          WHERE rc.status = 'active'
          ORDER BY rc.totalEarnings DESC
          LIMIT 10`
    );
    return (rows as any)[0] ?? [];
  }),

  // Revenue Intelligence Dashboard data
  getRevenueIntelligence: protectedProcedure
    .input(z.object({ period: z.enum(["30d", "90d", "1y"]).default("30d") }))
    .query(async () => {
      const db = await getDb();
      if (!db) return {
        mrr: 0, ltv: 0, cac: 0, churnRate: 0, newCustomers: 0, totalCustomers: 0,
        revenueGrowth: 0, mrrHistory: [], affiliateRevenue: 0, affiliateConversions: 0,
        planBreakdown: { starter: 0, growth: 0, pro: 0 }, cohorts: [],
      };

      // Total active subscribers
      const subsRows = await db.execute(
        sql`SELECT subscriptionPlan, COUNT(*) as cnt FROM users
            WHERE subscriptionStatus IN ('active', 'trialing')
            GROUP BY subscriptionPlan`
      );
      const subs = (subsRows as any)[0] ?? [];

      const planPrices: Record<string, number> = { starter: 149, growth: 399, pro: 799 };
      let mrr = 0;
      const planBreakdown: Record<string, number> = { starter: 0, growth: 0, pro: 0 };
      for (const row of subs) {
        const plan = row.subscriptionPlan as string;
        const price = planPrices[plan] ?? 0;
        const count = parseInt(row.cnt ?? 0);
        mrr += price * count;
        if (plan in planBreakdown) planBreakdown[plan] = price * count;
      }

      // Total customers
      const totalRows = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM users WHERE subscriptionStatus IN ('active', 'trialing')`
      );
      const totalCustomers = parseInt((totalRows as any)[0]?.[0]?.cnt ?? 0);

      // New customers in period
      const daysMap: Record<string, number> = { "30d": 30, "90d": 90, "1y": 365 };
      const newRows = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM users
            WHERE subscriptionStatus IN ('active', 'trialing')
            AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
      );
      const newCustomers = parseInt((newRows as any)[0]?.[0]?.cnt ?? 0);

      // Affiliate revenue
      const affRows = await db.execute(
        sql`SELECT COALESCE(SUM(commission), 0) as total, COUNT(*) as cnt
            FROM referral_conversions WHERE status IN ('approved', 'paid')`
      );
      const affiliateRevenue = parseFloat((affRows as any)[0]?.[0]?.total ?? 0);
      const affiliateConversions = parseInt((affRows as any)[0]?.[0]?.cnt ?? 0);

      // Estimated LTV (avg MRR per customer * avg lifetime)
      const avgMrr = totalCustomers > 0 ? mrr / totalCustomers : 0;
      const churnRate = totalCustomers > 0 ? Math.max(0, Math.round((1 / Math.max(totalCustomers, 1)) * 100 * 10) / 10) : 0;
      const avgLifetimeMonths = churnRate > 0 ? 100 / churnRate : 24;
      const ltv = Math.round(avgMrr * avgLifetimeMonths);
      const cac = newCustomers > 0 ? Math.round(mrr * 0.15 / Math.max(newCustomers, 1)) : 0;

      // MRR history (last 7 data points — simulated from current)
      const mrrHistory = [mrr * 0.6, mrr * 0.7, mrr * 0.75, mrr * 0.82, mrr * 0.88, mrr * 0.95, mrr]
        .map(v => Math.round(v));

      // Cohorts (last 3 months)
      const cohortRows = await db.execute(
        sql`SELECT DATE_FORMAT(createdAt, '%Y-%m') as cohort,
                   COUNT(*) as customers,
                   SUM(CASE WHEN subscriptionPlan = 'starter' THEN 149
                            WHEN subscriptionPlan = 'growth' THEN 399
                            WHEN subscriptionPlan = 'pro' THEN 799 ELSE 0 END) as mrr
            FROM users
            WHERE subscriptionStatus IN ('active', 'trialing')
            GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
            ORDER BY cohort DESC
            LIMIT 6`
      );
      const cohorts = ((cohortRows as any)[0] ?? []).map((row: any) => ({
        cohort: row.cohort,
        customers: parseInt(row.customers ?? 0),
        mrr: parseInt(row.mrr ?? 0),
        ltv: Math.round(parseInt(row.mrr ?? 0) * avgLifetimeMonths),
        churnRate: churnRate,
      }));

      return {
        mrr, ltv, cac, churnRate, newCustomers, totalCustomers,
        revenueGrowth: newCustomers > 0 ? Math.round((newCustomers / Math.max(totalCustomers - newCustomers, 1)) * 100) : 0,
        mrrHistory, affiliateRevenue, affiliateConversions,
        planBreakdown: planBreakdown as { starter: number; growth: number; pro: number },
        cohorts,
      };
    }),
});

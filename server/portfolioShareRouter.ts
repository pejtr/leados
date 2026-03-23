/**
 * Portfolio Share Router
 * - createToken / listTokens / revokeToken (protected)
 * - getPublicReport (public, token-based)
 */
import { z } from "zod";
import crypto from "crypto";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { portfolioShareTokens, adCampaigns, connectedProjects, projectEvents } from "../drizzle/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { getAllProjectsStats } from "./projectsDb";

// ── helpers ────────────────────────────────────────────────────────
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const portfolioShareRouter = router({
  // Create a new share token
  createToken: protectedProcedure
    .input(z.object({
      label: z.string().max(128).optional(),
      expiresInDays: z.number().min(1).max(365).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const token = generateToken();
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;
      await db.insert(portfolioShareTokens).values({
        userId: ctx.user.id,
        token,
        label: input.label ?? "Portfolio ROAS Report",
        expiresAt: expiresAt ?? undefined,
        isActive: true,
      });
      return { token, shareUrl: `/portfolio/share/${token}` };
    }),

  // List all tokens for the user
  listTokens: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(portfolioShareTokens)
      .where(eq(portfolioShareTokens.userId, ctx.user.id))
      .orderBy(desc(portfolioShareTokens.createdAt));
  }),

  // Revoke (deactivate) a token
  revokeToken: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(portfolioShareTokens)
        .set({ isActive: false })
        .where(and(
          eq(portfolioShareTokens.id, input.id),
          eq(portfolioShareTokens.userId, ctx.user.id),
        ));
      return { ok: true };
    }),

  // Public: get portfolio data by token (no auth required)
  getPublicReport: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Validate token
      const [shareToken] = await db
        .select()
        .from(portfolioShareTokens)
        .where(and(
          eq(portfolioShareTokens.token, input.token),
          eq(portfolioShareTokens.isActive, true),
        ))
        .limit(1);

      if (!shareToken) throw new Error("Invalid or expired share link");
      if (shareToken.expiresAt && shareToken.expiresAt < new Date()) {
        throw new Error("This share link has expired");
      }

      const userId = shareToken.userId;

      // Get all project stats (last 30 days)
      const allStats = await getAllProjectsStats(userId, 30);

      // Get all campaigns
      const campaigns = await db
        .select()
        .from(adCampaigns)
        .where(eq(adCampaigns.userId, userId))
        .orderBy(desc(adCampaigns.createdAt));

      // Aggregate portfolio totals
      let totalRevenue = 0, totalAdSpend = 0, totalSales = 0;
      for (const { stats } of allStats) {
        totalRevenue += stats.netRevenue;
        totalAdSpend += stats.totalAdSpend;
        totalSales += stats.salesCount;
      }
      let adSpendTotal = 0, adRevenueTotal = 0, adConversions = 0;
      for (const c of campaigns) {
        adSpendTotal += parseFloat(c.adSpend as string) || 0;
        adRevenueTotal += parseFloat(c.revenue as string) || 0;
        adConversions += c.conversions;
      }
      const roas = adSpendTotal > 0 ? adRevenueTotal / adSpendTotal : null;
      const pno = adRevenueTotal > 0 ? (adSpendTotal / adRevenueTotal) * 100 : null;

      return {
        label: shareToken.label,
        generatedAt: new Date().toISOString(),
        portfolio: { totalRevenue, totalAdSpend, totalSales, adSpendTotal, adRevenueTotal, adConversions, roas, pno },
        projects: allStats.map(({ project, stats }) => ({
          id: project.id,
          name: project.name,
          url: project.url,
          category: project.category,
          stats,
        })),
        campaigns: campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          platform: c.platform,
          adSpend: parseFloat(c.adSpend as string) || 0,
          revenue: parseFloat(c.revenue as string) || 0,
          conversions: c.conversions,
          clicks: c.clicks,
          currency: c.currency,
          roas: (parseFloat(c.adSpend as string) || 0) > 0
            ? (parseFloat(c.revenue as string) || 0) / (parseFloat(c.adSpend as string) || 0)
            : null,
        })),
      };
    }),
});

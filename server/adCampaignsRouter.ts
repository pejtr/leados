import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { adCampaigns } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

const campaignInput = z.object({
  name: z.string().min(1).max(255),
  platform: z.enum(["meta", "google", "linkedin", "other"]).default("meta"),
  projectId: z.number().int().nullable().optional(),
  externalCampaignId: z.string().optional(),
  adSpend: z.number().min(0).default(0),
  revenue: z.number().min(0).default(0),
  conversions: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  impressions: z.number().int().min(0).default(0),
  currency: z.string().max(10).default("EUR"),
  periodStart: z.number().optional(),
  periodEnd: z.number().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

function calcMetrics(c: { adSpend: unknown; revenue: unknown; conversions: number; clicks: number; impressions: number }) {
  const spend = parseFloat(c.adSpend as string) || 0;
  const rev = parseFloat(c.revenue as string) || 0;
  const roas = spend > 0 ? rev / spend : 0;
  const pno = rev > 0 ? (spend / rev) * 100 : 0;
  const cpa = c.conversions > 0 ? spend / c.conversions : 0;
  const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
  return { roas, pno, cpa, ctr };
}

export const adCampaignsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const campaigns = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.userId, ctx.user.id))
      .orderBy(desc(adCampaigns.createdAt));
    return campaigns.map((c) => ({ ...c, ...calcMetrics(c) }));
  }),

  create: protectedProcedure.input(campaignInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const [result] = await db.insert(adCampaigns).values({
      userId: ctx.user.id,
      name: input.name,
      platform: input.platform,
      projectId: input.projectId ?? null,
      externalCampaignId: input.externalCampaignId ?? null,
      adSpend: input.adSpend.toString(),
      revenue: input.revenue.toString(),
      conversions: input.conversions,
      clicks: input.clicks,
      impressions: input.impressions,
      currency: input.currency,
      periodStart: input.periodStart ?? null,
      periodEnd: input.periodEnd ?? null,
      notes: input.notes ?? null,
      isActive: input.isActive,
    });
    return { id: (result as any).insertId };
  }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: campaignInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [existing] = await db
        .select()
        .from(adCampaigns)
        .where(and(eq(adCampaigns.id, input.id), eq(adCampaigns.userId, ctx.user.id)));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updateData: Record<string, unknown> = {};
      if (input.data.name !== undefined) updateData.name = input.data.name;
      if (input.data.platform !== undefined) updateData.platform = input.data.platform;
      if (input.data.projectId !== undefined) updateData.projectId = input.data.projectId;
      if (input.data.externalCampaignId !== undefined) updateData.externalCampaignId = input.data.externalCampaignId;
      if (input.data.adSpend !== undefined) updateData.adSpend = input.data.adSpend.toString();
      if (input.data.revenue !== undefined) updateData.revenue = input.data.revenue.toString();
      if (input.data.conversions !== undefined) updateData.conversions = input.data.conversions;
      if (input.data.clicks !== undefined) updateData.clicks = input.data.clicks;
      if (input.data.impressions !== undefined) updateData.impressions = input.data.impressions;
      if (input.data.currency !== undefined) updateData.currency = input.data.currency;
      if (input.data.periodStart !== undefined) updateData.periodStart = input.data.periodStart;
      if (input.data.periodEnd !== undefined) updateData.periodEnd = input.data.periodEnd;
      if (input.data.notes !== undefined) updateData.notes = input.data.notes;
      if (input.data.isActive !== undefined) updateData.isActive = input.data.isActive;

      await db.update(adCampaigns).set(updateData).where(eq(adCampaigns.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [existing] = await db
        .select()
        .from(adCampaigns)
        .where(and(eq(adCampaigns.id, input.id), eq(adCampaigns.userId, ctx.user.id)));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      await db.delete(adCampaigns).where(eq(adCampaigns.id, input.id));
      return { success: true };
    }),

  summary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalSpend: 0, totalRevenue: 0, totalConversions: 0, totalClicks: 0, totalImpressions: 0, roas: 0, pno: 0, cpa: 0, ctr: 0, campaignCount: 0 };
    const campaigns = await db
      .select()
      .from(adCampaigns)
      .where(and(eq(adCampaigns.userId, ctx.user.id), eq(adCampaigns.isActive, true)));

    let totalSpend = 0, totalRevenue = 0, totalConversions = 0, totalClicks = 0, totalImpressions = 0;
    for (const c of campaigns) {
      totalSpend += parseFloat(c.adSpend as string) || 0;
      totalRevenue += parseFloat(c.revenue as string) || 0;
      totalConversions += c.conversions;
      totalClicks += c.clicks;
      totalImpressions += c.impressions;
    }

    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const pno = totalRevenue > 0 ? (totalSpend / totalRevenue) * 100 : 0;
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return { totalSpend, totalRevenue, totalConversions, totalClicks, totalImpressions, roas, pno, cpa, ctr, campaignCount: campaigns.length };
  }),
});

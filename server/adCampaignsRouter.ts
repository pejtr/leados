import { z } from "zod";
import { eq, and, desc, asc } from "drizzle-orm";
import { getDb } from "./db";
import { adCampaigns, adCampaignSnapshots } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ── Meta MCP helper ────────────────────────────────────────────────
function callMetaMCP(toolName: string, inputJson: object): any {
  const tmpIn = path.join(os.tmpdir(), `mcp_in_${Date.now()}.json`);
  fs.writeFileSync(tmpIn, JSON.stringify(inputJson));
  try {
    const result = execSync(
      `manus-mcp-cli tool call ${toolName} --server meta-marketing --input '${JSON.stringify(inputJson).replace(/'/g, "'\\''")}' 2>&1`,
      { timeout: 30000, encoding: "utf-8" }
    );
    // Extract JSON result file path from output
    const match = result.match(/saved to:\s*(\S+\.json)/);
    if (match && fs.existsSync(match[1])) {
      return JSON.parse(fs.readFileSync(match[1], "utf-8"));
    }
    return null;
  } catch (e: any) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Meta MCP error: ${e.message}` });
  } finally {
    if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
  }
}

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

      // Auto-snapshot: record a data point whenever a campaign is updated
      const today = new Date().toISOString().slice(0, 10);
      const merged = { ...existing, ...updateData };
      const spend = parseFloat(merged.adSpend as string) || 0;
      const rev = parseFloat(merged.revenue as string) || 0;
      const roasVal = spend > 0 ? rev / spend : 0;
      const pnoVal = rev > 0 ? (spend / rev) * 100 : 0;
      // Upsert snapshot for today (delete existing today's snapshot then insert)
      await db.delete(adCampaignSnapshots).where(
        and(
          eq(adCampaignSnapshots.campaignId, input.id),
          eq(adCampaignSnapshots.snapshotDate, today)
        )
      );
      await db.insert(adCampaignSnapshots).values({
        campaignId: input.id,
        userId: ctx.user.id,
        snapshotDate: today,
        adSpend: spend.toString(),
        revenue: rev.toString(),
        conversions: (merged.conversions as number) || 0,
        clicks: (merged.clicks as number) || 0,
        roas: roasVal.toFixed(4),
        pno: pnoVal.toFixed(4),
      });

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

  // ── Meta Ads import ─────────────────────────────────────────────
  getMetaAccounts: protectedProcedure.query(async () => {
    try {
      const result = callMetaMCP("meta_marketing_get_ad_accounts", { keywords: [] });
      if (!result || result.error) {
        return { accounts: [], error: result?.error || "Meta Ads not connected. Please re-authorize in Settings → Connectors." };
      }
      const accounts = (result.data || result.accounts || result || []).filter((a: any) => a.id || a.account_id);
      return { accounts, error: null };
    } catch (e: any) {
      return { accounts: [], error: e.message };
    }
  }),

  importFromMeta: protectedProcedure
    .input(z.object({
      adAccountId: z.string().min(1),
      datePreset: z.enum(["last_7d", "last_14d", "last_30d", "last_90d", "last_month", "this_month"]).default("last_30d"),
      projectId: z.number().int().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // 1. Fetch campaigns from Meta
      let campaignsResult: any;
      try {
        campaignsResult = callMetaMCP("meta_marketing_get_campaigns", {
          ad_account_id: input.adAccountId,
          limit: 50,
        });
      } catch (e: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message });
      }

      const metaCampaigns = campaignsResult?.data || campaignsResult?.campaigns || [];
      if (!Array.isArray(metaCampaigns) || metaCampaigns.length === 0) {
        return { imported: 0, skipped: 0, message: "No campaigns found in this ad account." };
      }

      // 2. Fetch insights for each campaign
      let imported = 0;
      let skipped = 0;

      for (const campaign of metaCampaigns) {
        const campaignId = campaign.id;
        const campaignName = campaign.name || `Campaign ${campaignId}`;

        let spend = 0, revenue = 0, conversions = 0, clicks = 0, impressions = 0;

        try {
          const insightsResult = callMetaMCP("meta_marketing_get_insights", {
            object_id: campaignId,
            object_type: "campaign",
            level: "campaign",
            date_preset: input.datePreset,
            limit: 1,
          });
          const insight = (insightsResult?.data || insightsResult?.insights || [])[0];
          if (insight) {
            spend = parseFloat(insight.spend || "0") || 0;
            clicks = parseInt(insight.clicks || "0") || 0;
            impressions = parseInt(insight.impressions || "0") || 0;
            // Conversions from actions
            const actions = insight.actions || [];
            const purchaseAction = actions.find((a: any) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase");
            conversions = purchaseAction ? parseInt(purchaseAction.value || "0") : 0;
            // Revenue from action_values
            const actionValues = insight.action_values || [];
            const purchaseValue = actionValues.find((a: any) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase");
            revenue = purchaseValue ? parseFloat(purchaseValue.value || "0") : 0;
          }
        } catch {
          // insights failed for this campaign, use zeros
        }

        // Check if already imported (by externalCampaignId)
        const [existing] = await db
          .select()
          .from(adCampaigns)
          .where(and(
            eq(adCampaigns.userId, ctx.user.id),
            eq(adCampaigns.externalCampaignId, campaignId)
          ));

        if (existing) {
          // Update existing
          await db.update(adCampaigns).set({
            adSpend: spend.toString(),
            revenue: revenue.toString(),
            conversions,
            clicks,
            impressions,
            isActive: campaign.effective_status !== "DELETED",
          }).where(eq(adCampaigns.id, existing.id));
          skipped++;
        } else {
          // Insert new
          await db.insert(adCampaigns).values({
            userId: ctx.user.id,
            name: campaignName,
            platform: "meta",
            projectId: input.projectId ?? null,
            externalCampaignId: campaignId,
            adSpend: spend.toString(),
            revenue: revenue.toString(),
            conversions,
            clicks,
            impressions,
            currency: "EUR",
            isActive: campaign.effective_status !== "DELETED",
          });
          imported++;
        }
      }

      return { imported, skipped, message: `Importováno ${imported} nových kampaní, aktualizováno ${skipped} existujících.` };
    }),

  // ── Historical snapshots ─────────────────────────────────────────
  getHistory: protectedProcedure
    .input(z.object({
      campaignIds: z.array(z.number()).optional(), // empty = all user campaigns
      days: z.number().int().min(7).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - input.days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const snapshots = await db
        .select()
        .from(adCampaignSnapshots)
        .where(eq(adCampaignSnapshots.userId, ctx.user.id))
        .orderBy(asc(adCampaignSnapshots.snapshotDate));

      // Filter by date and optional campaign IDs
      return snapshots
        .filter((s) => s.snapshotDate >= cutoffStr)
        .filter((s) => !input.campaignIds?.length || input.campaignIds.includes(s.campaignId))
        .map((s) => ({
          ...s,
          roas: parseFloat(s.roas as string) || 0,
          pno: parseFloat(s.pno as string) || 0,
          adSpend: parseFloat(s.adSpend as string) || 0,
          revenue: parseFloat(s.revenue as string) || 0,
        }));
    }),

  addSnapshot: protectedProcedure
    .input(z.object({
      campaignId: z.number().int(),
      snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      adSpend: z.number().min(0),
      revenue: z.number().min(0),
      conversions: z.number().int().min(0).default(0),
      clicks: z.number().int().min(0).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      // Verify campaign belongs to user
      const [campaign] = await db.select().from(adCampaigns)
        .where(and(eq(adCampaigns.id, input.campaignId), eq(adCampaigns.userId, ctx.user.id)));
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      const roas = input.adSpend > 0 ? input.revenue / input.adSpend : 0;
      const pno = input.revenue > 0 ? (input.adSpend / input.revenue) * 100 : 0;

      // Upsert: delete existing snapshot for that date then insert
      await db.delete(adCampaignSnapshots).where(
        and(
          eq(adCampaignSnapshots.campaignId, input.campaignId),
          eq(adCampaignSnapshots.snapshotDate, input.snapshotDate)
        )
      );
      await db.insert(adCampaignSnapshots).values({
        campaignId: input.campaignId,
        userId: ctx.user.id,
        snapshotDate: input.snapshotDate,
        adSpend: input.adSpend.toString(),
        revenue: input.revenue.toString(),
        conversions: input.conversions,
        clicks: input.clicks,
        roas: roas.toFixed(4),
        pno: pno.toFixed(4),
      });
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

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { logAuditEvent } from "../_core/audit";
import {
  createLeadSession,
  deleteLeadsBySession,
  getLeadStats,
  getLeads,
  getLeadsByIds,
  getLeadById,
  getLeadSessionsByUser,
  insertLeads,
  updateLeadSession,
  updateLeadStatus,
  bulkUpdateLeadStatus,
  bulkDeleteLeads,
  updateLeadQuality,
  closeDeal,
  assignLead,
  getDb,
} from "../db";
import { runLeadPipeline, SUPPORTED_INDUSTRIES, SEGMENT_PRESETS } from "../leadPipeline";
import { dispatchWebhooks } from "../webhookDispatcher";
import { leads, predictiveScores } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const leadsInlineRouter = router({
  // ── Industries & Segments ──────────────────────────────────
  industries: publicProcedure.query(() => SUPPORTED_INDUSTRIES),
  segments: publicProcedure.query(() => SEGMENT_PRESETS),

  // ── Generate leads (full pipeline) ────────────────────────
  generate: protectedProcedure
    .input(
      z.object({
        industry: z.string().min(1),
        location: z.string().min(1).default("United States"),
        count: z.number().int().min(1).max(50).default(10),
        seniorityLevel: z.string().default("Manager"),
        apifyToken: z.string().optional(),
        useApify: z.boolean().default(true),
        enrichEmails: z.boolean().default(true),
        segment: z.string().optional(),
        dataSource: z.enum(["linkedin", "xing", "mock"]).default("linkedin"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const sessionId = await createLeadSession({
        userId,
        industry: input.industry,
        location: input.location,
        seniorityLevel: input.seniorityLevel,
        requestedCount: input.count,
        status: "running",
      });

      try {
        const result = await runLeadPipeline({
          industry: input.industry,
          location: input.location,
          count: input.count,
          seniorityLevel: input.seniorityLevel,
          apifyToken: input.apifyToken || process.env.APIFY_TOKEN,
          useApify: input.useApify,
          enrichEmails: input.enrichEmails,
          segment: input.segment,
          dataSource: input.dataSource,
        });

        const leadsToInsert = result.leads.map((l) => ({
          sessionId,
          userId,
          companyName: l.companyName,
          email: l.email ?? null,
          website: l.website ?? null,
          industry: l.industry,
          location: l.location ?? null,
          companySize: l.companySize ?? null,
          seniorityLevel: l.seniorityLevel ?? null,
          contactName: l.contactName ?? null,
          linkedinUrl: l.linkedinUrl ?? null,
          companyDescription: l.companyDescription ?? null,
          icebreaker: l.icebreaker ?? null,
          isEnriched: !!l.icebreaker,
          dataSource: l.dataSource as "mock" | "linkedin_apify" | "xing_apify",
          status: "new" as const,
          segment: input.segment ?? null,
        }));

        await insertLeads(leadsToInsert);
        await updateLeadSession(sessionId, {
          status: "done",
          generatedCount: result.leads.length,
          enrichedCount: result.leads.filter((l) => l.icebreaker).length,
          completedAt: new Date(),
        });

        // Dispatch webhooks for newly generated leads
        dispatchWebhooks(ctx.user.id, "generate", leadsToInsert as any, {
          source: "manual_generation",
          sessionId,
          industry: input.industry,
          location: input.location,
        }).catch(console.error);

        return { sessionId, leads: result.leads, count: result.leads.length };
      } catch (err: any) {
        await updateLeadSession(sessionId, {
          status: "error",
          errorMessage: err?.message ?? "Unknown error",
          completedAt: new Date(),
        });
        throw err;
      }
    }),

  // ── List leads ────────────────────────────────────────────
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        industry: z.string().optional(),
        sessionId: z.number().int().optional(),
        status: z.string().optional(),
        qualityRating: z.string().optional(),
        segment: z.string().optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return getLeads({ userId: ctx.user.id, ...input });
    }),

  // ── Sessions ──────────────────────────────────────────────
  sessions: protectedProcedure.query(async ({ ctx }) => {
    return getLeadSessionsByUser(ctx.user.id);
  }),

  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteLeadsBySession(input.sessionId, ctx.user.id);
      return { success: true };
    }),

  // ── Stats ─────────────────────────────────────────────────
  stats: protectedProcedure.query(async ({ ctx }) => {
    return getLeadStats(ctx.user.id);
  }),

  // ── Export JSON ───────────────────────────────────────────
  export: protectedProcedure
    .input(
      z.object({
        sessionId: z.number().int().optional(),
        industry: z.string().optional(),
        status: z.string().optional(),
        ids: z.array(z.number().int()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.ids && input.ids.length > 0) {
        return getLeadsByIds(input.ids, ctx.user.id);
      }
      const { items } = await getLeads({
        userId: ctx.user.id,
        industry: input.industry,
        sessionId: input.sessionId,
        status: input.status,
        limit: 1000,
        offset: 0,
      });
      return items;
    }),

  // ── Export CSV ────────────────────────────────────────────
  exportCsv: protectedProcedure
    .input(
      z.object({
        sessionId: z.number().int().optional(),
        industry: z.string().optional(),
        status: z.string().optional(),
        ids: z.array(z.number().int()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let items;
      if (input.ids && input.ids.length > 0) {
        items = await getLeadsByIds(input.ids, ctx.user.id);
      } else {
        const result = await getLeads({
          userId: ctx.user.id,
          industry: input.industry,
          sessionId: input.sessionId,
          status: input.status,
          limit: 1000,
          offset: 0,
        });
        items = result.items;
      }
      const headers = [
        "Company Name", "Email", "Website", "Industry", "Location",
        "Company Size", "Seniority Level", "Contact Name", "LinkedIn URL",
        "Status", "Quality Rating", "Deal Closed", "Deal Value", "Currency",
        "Data Source", "Segment", "AI Enriched", "Icebreaker", "Created At",
      ];
      const escape = (v: string | null | undefined | boolean | Date) => {
        if (v === null || v === undefined) return "";
        const s = v instanceof Date ? v.toISOString() : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const rows = items.map((l) => [
        escape(l.companyName), escape(l.email), escape(l.website),
        escape(l.industry), escape(l.location), escape(l.companySize),
        escape(l.seniorityLevel), escape(l.contactName), escape(l.linkedinUrl),
        escape(l.status), escape(l.qualityRating), escape(l.dealClosed),
        escape(l.dealValue), escape(l.currency), escape(l.dataSource),
        escape(l.segment), escape(l.isEnriched), escape(l.icebreaker), escape(l.createdAt),
      ].join(","));
      return [headers.join(","), ...rows].join("\n");
    }),

  // ── Update lead status ────────────────────────────────────
  updateStatus: protectedProcedure
    .input(
      z.object({
        leadId: z.number().int(),
        status: z.enum(["new", "contacted", "replied", "qualified", "disqualified"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await getLeadById(input.leadId, ctx.user.id);
      await updateLeadStatus(input.leadId, ctx.user.id, input.status);
      logAuditEvent(ctx.user.id, "lead.status_changed", "lead", input.leadId,
        lead ? { status: lead.status } : undefined, { status: input.status },
        undefined, ctx.req?.ip).catch(() => {});
      // Dispatch webhook on status change
      dispatchWebhooks(ctx.user.id, "status_change", [{ id: input.leadId, status: input.status }] as any, {
        source: "status_change",
      }).catch(console.error);
      return { success: true };
    }),

  // ── Bulk actions ──────────────────────────────────────────
  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        leadIds: z.array(z.number().int()).min(1),
        status: z.enum(["new", "contacted", "replied", "qualified", "disqualified"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await bulkUpdateLeadStatus(input.leadIds, ctx.user.id, input.status);
      logAuditEvent(ctx.user.id, "lead.bulk_status_changed", "lead", undefined,
        undefined, { leadIds: input.leadIds, status: input.status },
        { count: input.leadIds.length }, ctx.req?.ip).catch(() => {});
      return { success: true, count: input.leadIds.length };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ leadIds: z.array(z.number().int()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      await bulkDeleteLeads(input.leadIds, ctx.user.id);
      logAuditEvent(ctx.user.id, "lead.bulk_deleted", "lead", undefined,
        undefined, undefined, { leadIds: input.leadIds, count: input.leadIds.length }, ctx.req?.ip).catch(() => {});
      return { success: true, count: input.leadIds.length };
    }),

  // ── Quality rating ────────────────────────────────────────
  rateQuality: protectedProcedure
    .input(
      z.object({
        leadId: z.number().int(),
        rating: z.enum(["good", "bad"]),
        note: z.string().max(256).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await getLeadById(input.leadId, ctx.user.id);
      await updateLeadQuality(input.leadId, ctx.user.id, input.rating, input.note);
      logAuditEvent(ctx.user.id, "lead.quality_rated", "lead", input.leadId,
        lead ? { qualityRating: lead.qualityRating } : undefined,
        { qualityRating: input.rating, qualityNote: input.note },
        undefined, ctx.req?.ip).catch(() => {});
      return { success: true };
    }),

  // ── ROI: close deal ───────────────────────────────────────
  closeDeal: protectedProcedure
    .input(
      z.object({
        leadId: z.number().int(),
        dealValue: z.string().min(1),
        currency: z.string().length(3).default("USD"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await getLeadById(input.leadId, ctx.user.id);
      await closeDeal(input.leadId, ctx.user.id, input.dealValue, input.currency);
      logAuditEvent(ctx.user.id, "lead.deal_closed", "lead", input.leadId,
        lead ? { dealClosed: lead.dealClosed, dealValue: lead.dealValue } : undefined,
        { dealClosed: true, dealValue: input.dealValue, currency: input.currency },
        undefined, ctx.req?.ip).catch(() => {});
      // Dispatch webhook on deal close
      dispatchWebhooks(ctx.user.id, "deal_close", [{ id: input.leadId, dealValue: input.dealValue, currency: input.currency }] as any, {
        source: "deal_close",
      }).catch(console.error);
      return { success: true };
    }),

  // ── Assign lead ───────────────────────────────────────────
  assign: protectedProcedure
    .input(z.object({ leadId: z.number().int(), assignedTo: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await assignLead(input.leadId, ctx.user.id, input.assignedTo);
      logAuditEvent(ctx.user.id, "lead.assigned", "lead", input.leadId,
        undefined, { assignedTo: input.assignedTo },
        undefined, ctx.req?.ip).catch(() => {});
      return { success: true };
    }),
  // ── Predictive Scoring ────────────────────────────────────
  getPredictiveScores: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const scores = await db.select().from(predictiveScores).where(eq(predictiveScores.userId, ctx.user.id));
    return scores;
  }),
  computePredictiveScores: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { scored: 0 };
    const userLeads = await db.select().from(leads).where(eq(leads.userId, ctx.user.id));
    if (userLeads.length === 0) return { scored: 0 };
    const statusWeights: Record<string, number> = { new: 30, contacted: 50, replied: 70, qualified: 90, disqualified: 5 };
    let scored = 0;
    for (const lead of userLeads) {
      const baseScore = statusWeights[lead.status] ?? 30;
      const enrichBonus = lead.isEnriched ? 10 : 0;
      const linkedinBonus = lead.linkedinUrl ? 8 : 0;
      const qualityBonus = lead.qualityRating === 'good' ? 12 : lead.qualityRating === 'bad' ? -15 : 0;
      const emailBonus = lead.email ? 5 : 0;
      const rawScore = Math.min(100, Math.max(0, baseScore + enrichBonus + linkedinBonus + qualityBonus + emailBonus));
      const scoreLabel = rawScore >= 70 ? 'hot' as const : rawScore >= 40 ? 'warm' as const : 'cold' as const;
      const factors = JSON.stringify([
        { factor: 'Pipeline Status', weight: baseScore },
        { factor: 'Email Available', weight: emailBonus },
        { factor: 'LinkedIn Profile', weight: linkedinBonus },
        { factor: 'Enriched', weight: enrichBonus },
        { factor: 'Quality Rating', weight: qualityBonus },
      ]);
      const existing = await db.select({ id: predictiveScores.id })
        .from(predictiveScores).where(eq(predictiveScores.leadId, lead.id)).limit(1);
      if (existing.length > 0) {
        await db.update(predictiveScores)
          .set({ score: rawScore.toFixed(2), scoreLabel, factors, calculatedAt: new Date() })
          .where(eq(predictiveScores.id, existing[0].id));
      } else {
        await db.insert(predictiveScores).values({
          userId: ctx.user.id, leadId: lead.id,
          score: rawScore.toFixed(2) as any, scoreLabel, factors,
        });
      }
      scored++;
    }
    return { scored };
  }),
});

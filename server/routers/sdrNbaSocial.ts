import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getSdrCampaigns,
  getSdrCampaignById,
  createSdrCampaign,
  updateSdrCampaign,
  deleteSdrCampaign,
  getSdrActivities,
} from "../db";
import {
  getNbaRecommendations,
  createNbaRecommendation,
  updateNbaRecommendation,
} from "../db";
import {
  getSocialMonitors,
  getSocialMonitorById,
  createSocialMonitor,
  updateSocialMonitor,
  deleteSocialMonitor,
  getSocialSignals,
  getSocialSignalsByUser,
  updateSocialSignal,
} from "../db";
import { getLeadsByIds } from "../db";
import { invokeLLM } from "../_core/llm";

// ── AI SDR Agent ─────────────────────────────────────────────────
export const sdrInlineRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getSdrCampaigns(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const r = await getSdrCampaignById(input.id, ctx.user.id); return r ?? null;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      industry: z.string().min(1),
      location: z.string().min(1),
      seniorityLevel: z.string().default("C-Level"),
      leadCount: z.number().int().min(1).max(100).default(20),
      emailSubject: z.string().optional(),
      emailTone: z.enum(["professional", "friendly", "direct"]).default("professional"),
      followUpDays: z.number().int().min(1).max(30).default(3),
      maxFollowUps: z.number().int().min(0).max(10).default(2),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await createSdrCampaign({
        userId: ctx.user.id,
        ...input,
        emailSubject: input.emailSubject ?? null,
      });
      return { success: true, id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      name: z.string().optional(),
      status: z.enum(["draft", "active", "paused", "completed"]).optional(),
      emailSubject: z.string().optional().nullable(),
      emailTone: z.enum(["professional", "friendly", "direct"]).optional(),
      followUpDays: z.number().int().optional(),
      maxFollowUps: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateSdrCampaign(id, ctx.user.id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteSdrCampaign(input.id, ctx.user.id);
      return { success: true };
    }),

  activities: protectedProcedure
    .input(z.object({ campaignId: z.number().int(), limit: z.number().int().default(50) }))
    .query(async ({ ctx, input }) => {
      return getSdrActivities(input.campaignId, input.limit);
    }),

  generateEmail: protectedProcedure
    .input(z.object({
      companyName: z.string(),
      contactName: z.string().optional(),
      industry: z.string(),
      tone: z.enum(["professional", "friendly", "direct"]).default("professional"),
      icebreaker: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are an expert B2B sales email writer. Write a concise, personalized cold outreach email. Tone: ${input.tone}. Return JSON with subject and body fields.` },
          { role: "user", content: `Write a cold outreach email to ${input.contactName || "the decision maker"} at ${input.companyName} (${input.industry}).${input.icebreaker ? " Icebreaker: " + input.icebreaker : ""}` },
        ],
        response_format: { type: "json_object" },
      });
      const content = response.choices[0]?.message?.content;
      try {
        return JSON.parse(typeof content === "string" ? content : "");
      } catch {
        return { subject: "Partnership Opportunity", body: typeof content === "string" ? content : "" };
      }
    }),
});

// ── Next Best Action ─────────────────────────────────────────────
export const nbaInlineRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().int().default(20),
    }))
    .query(async ({ ctx, input }) => {
      return getNbaRecommendations(ctx.user.id, input.status, input.limit);
    }),

  generate: protectedProcedure
    .input(z.object({ leadIds: z.array(z.number().int()).min(1).max(20) }))
    .mutation(async ({ ctx, input }) => {
      const leadsData = await getLeadsByIds(input.leadIds, ctx.user.id);
      if (leadsData.length === 0) throw new Error("No leads found");

      const leadsSummary = leadsData.map(l => ({
        id: l.id, company: l.companyName, status: l.status, email: l.email,
        industry: l.industry, quality: l.qualityRating, dealValue: l.dealValue,
      }));

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a sales strategy AI. For each lead, recommend the single best next action. Return JSON array with fields: leadId, action (call/email/linkedin/qualify/disqualify/wait), priority (1-100), reason, aiScore (1-100)." },
          { role: "user", content: `Analyze these leads and recommend next best actions:\n${JSON.stringify(leadsSummary)}` },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      let recommendations: any[] = [];
      try {
        const parsed = JSON.parse(typeof content === "string" ? content : "");
        recommendations = parsed.recommendations || parsed.actions || parsed;
      } catch { recommendations = []; }

      const created: number[] = [];
      for (const rec of (Array.isArray(recommendations) ? recommendations : [])) {
        if (!rec.leadId || !rec.action) continue;
        const id = await createNbaRecommendation({
          userId: ctx.user.id,
          leadId: rec.leadId,
          action: rec.action,
          priority: rec.priority || 50,
          reason: rec.reason || "AI recommendation",
          aiScore: rec.aiScore || 50,
        });
        created.push(id);
      }
      return { success: true, count: created.length };
    }),

  action: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await updateNbaRecommendation(input.id, ctx.user.id, {
        status: "actioned",
        actionedAt: new Date(),
      });
      return { success: true };
    }),

  dismiss: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await updateNbaRecommendation(input.id, ctx.user.id, {
        status: "dismissed",
      });
      return { success: true };
    }),
});

// ── Social Listening ────────────────────────────────────────────
export const socialInlineRouter = router({
  monitors: protectedProcedure.query(async ({ ctx }) => {
    return getSocialMonitors(ctx.user.id);
  }),

  getMonitor: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const r = await getSocialMonitorById(input.id, ctx.user.id); return r ?? null;
    }),

  createMonitor: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      keywords: z.string().min(1),
      platforms: z.string().default("linkedin"),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await createSocialMonitor({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true, id };
    }),

  updateMonitor: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      name: z.string().optional(),
      keywords: z.string().optional(),
      platforms: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateSocialMonitor(id, ctx.user.id, data as any);
      return { success: true };
    }),

  deleteMonitor: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteSocialMonitor(input.id, ctx.user.id);
      return { success: true };
    }),

  signals: protectedProcedure
    .input(z.object({ monitorId: z.number().int(), limit: z.number().int().default(50) }))
    .query(async ({ ctx, input }) => {
      return getSocialSignals(input.monitorId, input.limit);
    }),

  allSignals: protectedProcedure
    .input(z.object({ limit: z.number().int().default(50) }))
    .query(async ({ ctx, input }) => {
      return getSocialSignalsByUser(ctx.user.id, input.limit);
    }),

  convertToLead: protectedProcedure
    .input(z.object({ signalId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      // This would create a lead from a social signal
      // For now, mark as converted
      await updateSocialSignal(input.signalId, { convertedToLead: true });
      return { success: true };
    }),
});

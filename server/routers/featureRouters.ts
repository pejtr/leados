import { z } from "zod";
import { randomBytes } from "node:crypto";
import { router, protectedProcedure } from "../_core/trpc";
import { invokeLLM, extractText } from "../_core/llm";
import {
  createTrackingPixel,
  getTrackingPixelsByUser,
  deleteTrackingPixel,
  updateTrackingPixel,
  getVisitorSessionsByPixel,
  getVisitorSessionsByUser,
  getPageViewsBySession,
  createAlertRule,
  getAlertRulesByUser,
  updateAlertRule,
  deleteAlertRule,
  createSmartList,
  getSmartListsByUser,
  updateSmartList,
  deleteSmartList,
  createEmailVerification,
  getEmailVerificationsByUser,
  createCampaignRule,
  getCampaignRulesByUser,
  updateCampaignRule,
  deleteCampaignRule,
  createAgencyClient,
  getAgencyClientsByUser,
  updateAgencyClient,
  deleteAgencyClient,
  getSpeedToLeadConfig,
  upsertSpeedToLeadConfig,
  createIcpProfile,
  getIcpProfilesByUser,
  updateIcpProfile,
  deleteIcpProfile,
  getLinkedinConnectionsByLead,
  getTechStackByUser,
  getTechStackByDomain,
  createTechStackDetection,
  getAiAgentsByUser,
  getAiAgentById,
  updateAiAgent,
  deleteAiAgent,
  createAiAgent,
  createAiAgentLog,
  getAiAgentLogsByAgent,
  getOnboardingStatus,
  completeOnboarding,
  createWebhookConfig,
} from "../db";

// ─── Tracking Pixel ─────────────────────────────────────────
export const trackingPixelRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getTrackingPixelsByUser(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), domain: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const pixelCode = `<script>!function(){var e="${input.domain}",t=document.createElement("script");t.src="https://px.leadgenai.com/t.js?d="+e+"&u=${ctx.user.id}",t.async=!0,document.head.appendChild(t)}();</script>`;
      await createTrackingPixel({ userId: ctx.user.id, name: input.name, domain: input.domain, pixelCode });
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteTrackingPixel(input.id, ctx.user.id);
      return { success: true };
    }),
  toggle: protectedProcedure
    .input(z.object({ id: z.number().int(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await updateTrackingPixel(input.id, { isActive: input.isActive });
      return { success: true };
    }),
  visitors: protectedProcedure
    .input(z.object({ pixelId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return getVisitorSessionsByPixel(input.pixelId, ctx.user.id);
    }),
  allVisitors: protectedProcedure.query(async ({ ctx }) => {
    return getVisitorSessionsByUser(ctx.user.id);
  }),
  pageViews: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return getPageViewsBySession(input.sessionId);
    }),
});

// ─── Smart Alert Rules ─────────────────────────────────────
export const alertRulesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getAlertRulesByUser(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      conditionType: z.enum(["high_intent_visitor", "new_lead_generated", "lead_status_change", "deal_closed", "visitor_returning", "keyword_match"]),
      conditionValue: z.string().optional(),
      channel: z.enum(["email", "slack", "webhook"]),
      channelTarget: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await createAlertRule({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({ id: z.number().int(), isActive: z.boolean().optional(), name: z.string().optional(), conditionValue: z.string().optional(), channelTarget: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateAlertRule(id, data);
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteAlertRule(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Smart Lists ───────────────────────────────────────────
export const smartListsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getSmartListsByUser(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      filters: z.string().min(1),
      autoRefresh: z.boolean().default(false),
      refreshInterval: z.enum(["hourly", "daily", "weekly"]).default("daily"),
    }))
    .mutation(async ({ ctx, input }) => {
      await createSmartList({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({ id: z.number().int(), name: z.string().optional(), filters: z.string().optional(), autoRefresh: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateSmartList(id, data);
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteSmartList(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Email Verification ────────────────────────────────────
export const emailVerificationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getEmailVerificationsByUser(ctx.user.id);
  }),
  verify: protectedProcedure
    .input(z.object({ email: z.string().email(), leadId: z.number().int().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Simulate verification (in production, call Bouncer API)
      const score = Math.floor(Math.random() * 40) + 60;
      const status = score > 80 ? "valid" as const : score > 60 ? "risky" as const : "invalid" as const;
      await createEmailVerification({ userId: ctx.user.id, email: input.email, leadId: input.leadId, status, score, reason: status === "valid" ? "Mailbox exists" : "Catch-all domain" });
      return { success: true, status, score };
    }),
  bulkVerify: protectedProcedure
    .input(z.object({ emails: z.array(z.string().email()) }))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      for (const email of input.emails) {
        const score = Math.floor(Math.random() * 40) + 60;
        const status = score > 80 ? "valid" as const : score > 60 ? "risky" as const : "invalid" as const;
        await createEmailVerification({ userId: ctx.user.id, email, status, score, reason: status === "valid" ? "Mailbox exists" : "Catch-all domain" });
        results.push({ email, status, score });
      }
      return { success: true, results };
    }),
});

// ─── Campaign Rules (If/Then) ──────────────────────────────
export const campaignRulesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getCampaignRulesByUser(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      triggerType: z.enum(["lead_created", "status_changed", "email_opened", "email_replied", "intent_score_above", "visitor_returned", "deal_value_above"]),
      triggerValue: z.string().optional(),
      actionType: z.enum(["send_email", "change_status", "assign_to", "add_to_list", "send_webhook", "send_slack", "create_task"]),
      actionValue: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await createCampaignRule({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({ id: z.number().int(), isActive: z.boolean().optional(), name: z.string().optional(), triggerValue: z.string().optional(), actionValue: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateCampaignRule(id, data);
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteCampaignRule(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Agency Panel ──────────────────────────────────────────
export const agencyRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getAgencyClientsByUser(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({
      clientName: z.string().min(1),
      clientEmail: z.string().email().optional(),
      clientDomain: z.string().optional(),
      industry: z.string().optional(),
      brandColor: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await createAgencyClient({ agencyUserId: ctx.user.id, ...input });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({ id: z.number().int(), clientName: z.string().optional(), clientEmail: z.string().optional(), industry: z.string().optional(), brandColor: z.string().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateAgencyClient(id, data);
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteAgencyClient(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Speed-to-Lead ─────────────────────────────────────────
export const speedToLeadRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const cfg = await getSpeedToLeadConfig(ctx.user.id); return cfg ?? null;
  }),
  upsert: protectedProcedure
    .input(z.object({
      isActive: z.boolean().default(true),
      autoEmailEnabled: z.boolean().default(true),
      autoEmailTemplateId: z.number().int().optional(),
      responseDelaySeconds: z.number().int().min(10).max(3600).default(60),
      notifyOnNewLead: z.boolean().default(true),
      notifyChannel: z.enum(["email", "slack", "both"]).default("email"),
      notifyTarget: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await upsertSpeedToLeadConfig({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
});

// ─── ICP Builder ───────────────────────────────────────────
export const icpBuilderRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getIcpProfilesByUser(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      industries: z.string().min(1),
      locations: z.string().min(1),
      companySizeMin: z.number().int().optional(),
      companySizeMax: z.number().int().optional(),
      revenueRange: z.string().optional(),
      technologies: z.string().optional(),
      buyingSignals: z.string().optional(),
      painPoints: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await createIcpProfile({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({ id: z.number().int(), name: z.string().optional(), industries: z.string().optional(), locations: z.string().optional(), technologies: z.string().optional(), buyingSignals: z.string().optional(), painPoints: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateIcpProfile(id, data);
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteIcpProfile(input.id, ctx.user.id);
      return { success: true };
    }),
  aiGenerate: protectedProcedure
    .input(z.object({ description: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an ICP (Ideal Customer Profile) expert. Generate a structured ICP based on the user's description. Return JSON with fields: name, industries (comma-separated), locations (comma-separated), companySizeMin, companySizeMax, revenueRange, technologies (comma-separated), buyingSignals (comma-separated), painPoints (comma-separated)." },
          { role: "user", content: input.description },
        ],
        response_format: { type: "json_schema", json_schema: { name: "icp", strict: true, schema: { type: "object", properties: { name: { type: "string" }, industries: { type: "string" }, locations: { type: "string" }, companySizeMin: { type: "integer" }, companySizeMax: { type: "integer" }, revenueRange: { type: "string" }, technologies: { type: "string" }, buyingSignals: { type: "string" }, painPoints: { type: "string" } }, required: ["name", "industries", "locations", "companySizeMin", "companySizeMax", "revenueRange", "technologies", "buyingSignals", "painPoints"], additionalProperties: false } } },
      });
      const content = extractText(response.choices?.[0]?.message?.content || '');
      if (!content) throw new Error("Failed to generate ICP");
      return JSON.parse(content);
    }),
});

// ─── Tech Stack Detection ──────────────────────────────────
export const techStackRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getTechStackByUser(ctx.user.id);
  }),
  detect: protectedProcedure
    .input(z.object({ domain: z.string().min(1), leadId: z.number().int().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Check if already scanned
      const existing = await getTechStackByDomain(input.domain, ctx.user.id);
      if (existing) {
        return { technologies: JSON.parse(existing.technologies), categories: existing.categories ? JSON.parse(existing.categories) : null, cached: true };
      }
      // Use LLM to estimate tech stack based on domain
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a tech stack detection expert. Given a domain, estimate the likely technologies used. Return JSON with: technologies (array of strings), categories (object with keys: cms, analytics, marketing, hosting, framework, ecommerce, each being a string or null)." },
          { role: "user", content: `Detect the tech stack for: ${input.domain}` },
        ],
        response_format: { type: "json_schema", json_schema: { name: "techstack", strict: true, schema: { type: "object", properties: { technologies: { type: "array", items: { type: "string" } }, categories: { type: "object", properties: { cms: { type: ["string", "null"] }, analytics: { type: ["string", "null"] }, marketing: { type: ["string", "null"] }, hosting: { type: ["string", "null"] }, framework: { type: ["string", "null"] }, ecommerce: { type: ["string", "null"] } }, required: ["cms", "analytics", "marketing", "hosting", "framework", "ecommerce"], additionalProperties: false } }, required: ["technologies", "categories"], additionalProperties: false } } },
      });
      const content = extractText(response.choices?.[0]?.message?.content || '');
      if (!content) throw new Error("Failed to detect tech stack");
      const parsed = JSON.parse(content);
      await createTechStackDetection({ userId: ctx.user.id, domain: input.domain, leadId: input.leadId, technologies: JSON.stringify(parsed.technologies), categories: JSON.stringify(parsed.categories) });
      return { ...parsed, cached: false };
    }),
});

// ─── AI Agent Builder ──────────────────────────────────────
export const aiAgentsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getAiAgentsByUser(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      agentType: z.enum(["lead_qualifier", "email_writer", "data_enricher", "meeting_scheduler", "custom"]).default("custom"),
      config: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await createAiAgent({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({ id: z.number().int(), name: z.string().optional(), description: z.string().optional(), config: z.string().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateAiAgent(id, data);
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteAiAgent(input.id, ctx.user.id);
      return { success: true };
    }),
  execute: protectedProcedure
    .input(z.object({ agentId: z.number().int(), input: z.string().min(1) }))
    .mutation(async ({ ctx, input: reqInput }) => {
      const agent = await getAiAgentById(reqInput.agentId);
      if (!agent) throw new Error("Agent not found");
      const config = JSON.parse(agent.config);
      const startTime = Date.now();
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: config.systemPrompt || `You are an AI agent: ${agent.name}. ${agent.description || ""}` },
            { role: "user", content: reqInput.input },
          ],
        });
        const output = extractText(response.choices?.[0]?.message?.content || "");
        const duration = Date.now() - startTime;
        await createAiAgentLog({ agentId: agent.id, userId: ctx.user.id, input: reqInput.input, output, status: "success", durationMs: duration });
        await updateAiAgent(agent.id, { totalExecutions: agent.totalExecutions + 1, lastExecutedAt: new Date() });
        return { success: true, output, durationMs: duration };
      } catch (err: any) {
        const duration = Date.now() - startTime;
        await createAiAgentLog({ agentId: agent.id, userId: ctx.user.id, input: reqInput.input, output: err.message, status: "failed", durationMs: duration });
        throw new Error(`Agent execution failed: ${err.message}`);
      }
    }),
  logs: protectedProcedure
    .input(z.object({ agentId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return getAiAgentLogsByAgent(input.agentId);
    }),
});

// ─── LinkedIn Connections ──────────────────────────────────
export const linkedinConnectionsRouter = router({
  byLead: protectedProcedure
    .input(z.object({ leadId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return getLinkedinConnectionsByLead(input.leadId);
    }),
});

// ─── Onboarding ──────────────────────────────────────────────
export const onboardingRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const completed = await getOnboardingStatus(ctx.user.id);
    return { completed };
  }),
  complete: protectedProcedure.mutation(async ({ ctx }) => {
    await completeOnboarding(ctx.user.id);
    return { success: true };
  }),
  // Save ICP during onboarding (reuses icpProfiles table)
  saveIcp: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        industry: z.string().min(1),
        companySize: z.string().optional(),
        location: z.string().optional(),
        seniorityLevel: z.string().optional(),
        keywords: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createIcpProfile({
        userId: ctx.user.id,
        name: input.name,
        industries: input.industry,
        locations: input.location ?? "",
        technologies: input.keywords ?? null,
      });
    }),
  // Save webhook during onboarding (reuses webhookConfigs table)
  saveWebhook: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
        type: z.enum(["webhook", "generic", "clickup"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createWebhookConfig({
        userId: ctx.user.id,
        name: input.name,
        url: input.url,
        type: input.type === "webhook" ? "generic" : input.type,
        secret: randomBytes(32).toString("hex"),
        events: "new_lead",
        status: "active",
      });
    }),
});

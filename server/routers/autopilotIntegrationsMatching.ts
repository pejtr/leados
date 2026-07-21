import { z } from "zod";
import { randomBytes } from "node:crypto";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getAutopilotConfigs,
  getAutopilotConfigById,
  createAutopilotConfig,
  updateAutopilotConfig,
  deleteAutopilotConfig,
  getAutopilotRuns,
  getRecentAutopilotRuns,
} from "../db";
import {
  getWebhookConfigs,
  getWebhookConfigById,
  createWebhookConfig,
  updateWebhookConfig,
  deleteWebhookConfig,
  getIntegrationLogs,
  getLeadsByIds,
} from "../db";
import {
  getMatchProfiles,
  getMatchProfileById,
  createMatchProfile,
  updateMatchProfile,
  deleteMatchProfile,
} from "../db";
import { dispatchWebhooks, testWebhook } from "../webhookDispatcher";
import { invokeLLM } from "../_core/llm";

// ── Autopilot ──────────────────────────────────────────────────
export const autopilotInlineRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getAutopilotConfigs(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const r = await getAutopilotConfigById(input.id, ctx.user.id); return r ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        industry: z.string().min(1),
        location: z.string().min(1),
        seniorityLevel: z.string().min(1),
        leadCount: z.number().int().min(1).max(100).default(10),
        segment: z.string().optional(),
        scheduleType: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
        scheduleDayOfWeek: z.number().int().min(0).max(6).default(1),
        scheduleHour: z.number().int().min(0).max(23).default(9),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Compute first nextRunAt
      const now = new Date();
      const next = new Date(now);
      next.setMinutes(0, 0, 0);
      next.setHours(input.scheduleHour);
      if (input.scheduleType === "daily") {
        next.setDate(next.getDate() + 1);
      } else {
        do { next.setDate(next.getDate() + 1); } while (next.getDay() !== input.scheduleDayOfWeek);
      }
      const id = await createAutopilotConfig({
        userId: ctx.user.id,
        ...input,
        nextRunAt: next,
      });
      return { success: true, id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(1).max(128).optional(),
        industry: z.string().optional(),
        location: z.string().optional(),
        seniorityLevel: z.string().optional(),
        leadCount: z.number().int().min(1).max(100).optional(),
        segment: z.string().optional().nullable(),
        scheduleType: z.enum(["daily", "weekly", "monthly"]).optional(),
        scheduleDayOfWeek: z.number().int().min(0).max(6).optional(),
        scheduleHour: z.number().int().min(0).max(23).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateAutopilotConfig(id, ctx.user.id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteAutopilotConfig(input.id, ctx.user.id);
      return { success: true };
    }),

  runs: protectedProcedure
    .input(z.object({ configId: z.number().int(), limit: z.number().int().default(20) }))
    .query(async ({ ctx, input }) => {
      return getAutopilotRuns(input.configId, input.limit);
    }),

  recentRuns: protectedProcedure
    .input(z.object({ limit: z.number().int().default(10) }))
    .query(async ({ ctx, input }) => {
      return getRecentAutopilotRuns(ctx.user.id, input.limit);
    }),
});

// ── Integrations (Webhooks, ClickUp, Slack) ──────────────────────
export const integrationsInlineRouter = router({
  // List all webhook configs for user
  list: protectedProcedure.query(async ({ ctx }) => {
    return getWebhookConfigs(ctx.user.id);
  }),

  // Get single config
  get: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const r = await getWebhookConfigById(input.id, ctx.user.id); return r ?? null;
    }),

  // Create new webhook config
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        type: z.enum(["generic", "clickup", "slack"]),
        webhookUrl: z.string().url().optional(),
        clickupApiKey: z.string().optional(),
        clickupListId: z.string().optional(),
        slackWebhookUrl: z.string().url().optional(),
        triggerOnGenerate: z.boolean().default(true),
        triggerOnStatusChange: z.boolean().default(false),
        triggerOnDealClose: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const url = input.type === "slack" ? input.slackWebhookUrl : input.webhookUrl;
      if (input.type !== "clickup" && !url) {
        throw new Error("Webhook URL is required");
      }
      const events = new Set<string>();
      if (input.triggerOnGenerate || input.triggerOnStatusChange) events.add("new_lead");
      if (input.triggerOnDealClose) events.add("new_order");
      if (events.size === 0) events.add("new_lead");
      const id = await createWebhookConfig({
        userId: ctx.user.id,
        name: input.name,
        type: input.type,
        url: url ?? "",
        secret: randomBytes(32).toString("hex"),
        events: Array.from(events).join(","),
        status: "active",
        clickupApiKey: input.clickupApiKey ?? null,
        clickupListId: input.clickupListId ?? null,
      });
      return { success: true, id };
    }),

  // Update webhook config
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(1).max(128).optional(),
        type: z.enum(["generic", "clickup", "slack"]).optional(),
        webhookUrl: z.string().optional().nullable(),
        clickupApiKey: z.string().optional().nullable(),
        clickupListId: z.string().optional().nullable(),
        slackWebhookUrl: z.string().optional().nullable(),
        triggerOnGenerate: z.boolean().optional(),
        triggerOnStatusChange: z.boolean().optional(),
        triggerOnDealClose: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateWebhookConfig(id, ctx.user.id, data as any);
      return { success: true };
    }),

  // Delete webhook config
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteWebhookConfig(input.id, ctx.user.id);
      return { success: true };
    }),

  // Test webhook
  test: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const config = await getWebhookConfigById(input.id, ctx.user.id);
      if (!config) throw new Error("Webhook config not found");
      const result = await testWebhook(config, ctx.user.id);
      return result;
    }),

  // Get integration logs
  logs: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      return getIntegrationLogs(ctx.user.id, input.limit);
    }),

  // Export leads to ClickUp (one-time, without saved config)
  exportToClickUp: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        listId: z.string().min(1),
        leadIds: z.array(z.number().int()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const leadsData = await getLeadsByIds(input.leadIds, ctx.user.id);
      if (leadsData.length === 0) throw new Error("No leads found");

      const tempConfig = {
        id: 0,
        userId: ctx.user.id,
        name: "One-time ClickUp export",
        type: "clickup" as const,
        url: "",
        secret: "",
        events: "new_lead",
        status: "active" as const,
        maxRetries: 0,
        retryDelaySeconds: 0,
        headers: {},
        clickupApiKey: input.apiKey,
        clickupListId: input.listId,
        lastTriggeredAt: null,
        failureCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await testWebhook(tempConfig, ctx.user.id);
      if (!result.success) {
        throw new Error(`ClickUp export failed: ${result.error || `HTTP ${result.status}`}`);
      }

      // Now send actual leads
      await dispatchWebhooks(ctx.user.id, "generate", leadsData as any, { source: "manual_clickup_export" });
      return { success: true, count: leadsData.length };
    }),
});

// ── B2B Matching ─────────────────────────────────────────────────
export const matchingInlineRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getMatchProfiles(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const r = await getMatchProfileById(input.id, ctx.user.id); return r ?? null;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      industries: z.string().min(1),
      companySizeMin: z.number().int().default(10),
      companySizeMax: z.number().int().default(500),
      revenueMin: z.string().optional(),
      revenueMax: z.string().optional(),
      locations: z.string().min(1),
      keywords: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await createMatchProfile({
        userId: ctx.user.id,
        ...input,
        revenueMin: input.revenueMin ?? null,
        revenueMax: input.revenueMax ?? null,
        keywords: input.keywords ?? null,
      });
      return { success: true, id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      name: z.string().min(1).max(128).optional(),
      industries: z.string().optional(),
      companySizeMin: z.number().int().optional(),
      companySizeMax: z.number().int().optional(),
      revenueMin: z.string().optional().nullable(),
      revenueMax: z.string().optional().nullable(),
      locations: z.string().optional(),
      keywords: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateMatchProfile(id, ctx.user.id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteMatchProfile(input.id, ctx.user.id);
      return { success: true };
    }),

  findMatches: protectedProcedure
    .input(z.object({ profileId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getMatchProfileById(input.profileId, ctx.user.id);
      if (!profile) throw new Error("Profile not found");

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a B2B company matching expert. Given an Ideal Customer Profile (ICP), generate a list of 5 fictional but realistic company matches. Return valid JSON array." },
          { role: "user", content: `ICP: Industries: ${profile.industries}, Size: ${profile.companySizeMin}-${profile.companySizeMax} employees, Locations: ${profile.locations}, Keywords: ${profile.keywords || "none"}. Generate 5 matching companies as JSON array with fields: companyName, industry, size, location, matchScore (0-100), matchReason.` },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      try {
        const parsed = JSON.parse(typeof content === "string" ? content : "");
        return parsed.matches || parsed.companies || parsed;
      } catch {
        return [];
      }
    }),
});

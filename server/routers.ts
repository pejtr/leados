import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createLeadSession,
  deleteLeadsBySession,
  getLeadStats,
  getLeads,
  getLeadsByIds,
  getLeadsBySession,
  getLeadSessionsByUser,
  insertLeads,
  updateLeadSession,
  updateLeadStatus,
  bulkUpdateLeadStatus,
  bulkDeleteLeads,
  updateLeadQuality,
  closeDeal,
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getTeamMembers,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  assignLead,
} from "./db";
import { runLeadPipeline, SUPPORTED_INDUSTRIES, SEGMENT_PRESETS } from "./leadPipeline";
import { exportLeadsToSheet, extractSpreadsheetId } from "./googleSheets";
import {
  getWebhookConfigs,
  getWebhookConfigById,
  createWebhookConfig,
  updateWebhookConfig,
  deleteWebhookConfig,
  getIntegrationLogs,
  getEmailSequences,
  createEmailSequence,
  deleteEmailSequence,
  getSequenceSteps,
  upsertSequenceSteps,
  enrollLeadInSequence,
  getSequenceEnrollments,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getCapturePlans,
  createCapturePlan,
  updateCapturePlan,
  deleteCapturePlan,
  getMarketIntelReports,
  saveMarketIntelReport,
  getKnowledgeArticles,
  seedKnowledgeArticles,
  getCompetitiveMaps,
  saveCompetitiveMap,
} from "./db";
import { dispatchWebhooks, testWebhook } from "./webhookDispatcher";
import {
  getAutopilotConfigs,
  getAutopilotConfigById,
  createAutopilotConfig,
  updateAutopilotConfig,
  deleteAutopilotConfig,
  getAutopilotRuns,
  getRecentAutopilotRuns,
} from "./db";
import {
  getMatchProfiles,
  getMatchProfileById,
  createMatchProfile,
  updateMatchProfile,
  deleteMatchProfile,
} from "./db";
import {
  getSdrCampaigns,
  getSdrCampaignById,
  createSdrCampaign,
  updateSdrCampaign,
  deleteSdrCampaign,
  getSdrActivities,
  createSdrActivity,
} from "./db";
import {
  getNbaRecommendations,
  createNbaRecommendation,
  updateNbaRecommendation,
  deleteNbaRecommendation,
} from "./db";
import {
  getSocialMonitors,
  getSocialMonitorById,
  createSocialMonitor,
  updateSocialMonitor,
  deleteSocialMonitor,
  getSocialSignals,
  getSocialSignalsByUser,
  createSocialSignal,
  updateSocialSignal,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { getDb, getAiMemory, upsertAiMemory, logAiPerformance, getAiPerformanceLogs, saveChatMessage, getChatHistory, clearChatHistory } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  createTrackingPixel, getTrackingPixelsByUser, deleteTrackingPixel, updateTrackingPixel,
  getVisitorSessionsByPixel, getVisitorSessionsByUser, createVisitorSession,
  getPageViewsBySession,
  createAlertRule, getAlertRulesByUser, updateAlertRule, deleteAlertRule,
  createSmartList, getSmartListsByUser, updateSmartList, deleteSmartList,
  createEmailVerification, getEmailVerificationsByUser, updateEmailVerification,
  createCampaignRule, getCampaignRulesByUser, updateCampaignRule, deleteCampaignRule,
  createAgencyClient, getAgencyClientsByUser, updateAgencyClient, deleteAgencyClient,
  getSpeedToLeadConfig, upsertSpeedToLeadConfig,
  createIcpProfile, getIcpProfilesByUser, updateIcpProfile, deleteIcpProfile,
  getLinkedinConnectionsByLead, createLinkedinConnection,
  createTechStackDetection, getTechStackByUser, getTechStackByDomain, updateTechStackDetection,
  createAiAgent, getAiAgentsByUser, updateAiAgent, deleteAiAgent, getAiAgentById,
  createAiAgentLog, getAiAgentLogsByAgent,
  getOnboardingStatus, completeOnboarding,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  leads: router({
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
            dataSource: l.dataSource as "mock" | "linkedin_apify",
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
        await updateLeadStatus(input.leadId, ctx.user.id, input.status);
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
        return { success: true, count: input.leadIds.length };
      }),

    bulkDelete: protectedProcedure
      .input(z.object({ leadIds: z.array(z.number().int()).min(1) }))
      .mutation(async ({ ctx, input }) => {
        await bulkDeleteLeads(input.leadIds, ctx.user.id);
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
        await updateLeadQuality(input.leadId, ctx.user.id, input.rating, input.note);
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
        await closeDeal(input.leadId, ctx.user.id, input.dealValue, input.currency);
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
        return { success: true };
      }),
  }),

  // ── Email Templates ───────────────────────────────────────────
  templates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getEmailTemplates(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(128),
        subject: z.string().min(1).max(256),
        body: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createEmailTemplate({ userId: ctx.user.id, ...input });
        return { success: true, id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        name: z.string().min(1).max(128).optional(),
        subject: z.string().min(1).max(256).optional(),
        body: z.string().min(1).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateEmailTemplate(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        await deleteEmailTemplate(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ── Google Sheets Export ─────────────────────────────────────────
  sheets: router({
    // Returns the service account email users must share their sheet with
    serviceEmail: publicProcedure.query(() => {
      const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      if (!json) return null;
      try {
        const parsed = JSON.parse(json);
        return parsed.client_email as string;
      } catch {
        return null;
      }
    }),

    export: protectedProcedure
      .input(z.object({
        spreadsheetUrl: z.string().min(1),
        sheetName: z.string().default("Leads"),
        leadIds: z.array(z.number().int()).optional(),
        sessionId: z.number().int().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const spreadsheetId = extractSpreadsheetId(input.spreadsheetUrl);
        // Get leads to export
        let leadsToExport: any[];
        if (input.leadIds && input.leadIds.length > 0) {
          leadsToExport = await getLeadsByIds(input.leadIds, ctx.user.id);
        } else if (input.sessionId) {
          leadsToExport = await getLeadsBySession(input.sessionId);
        } else {
          const result = await getLeads({ userId: ctx.user.id, limit: 1000, offset: 0 });
          leadsToExport = result.items ?? [];
        }
        if (leadsToExport.length === 0) {
          throw new Error("No leads found to export");
        }
        const sheetLeads = leadsToExport.map((l: any) => ({
          companyName: l.companyName ?? "",
          email: l.email ?? "",
          website: l.website ?? "",
          industry: l.industry ?? "",
          location: l.location ?? "",
          companySize: l.companySize ?? "",
          seniorityLevel: l.seniorityLevel ?? "",
          icebreaker: l.icebreaker ?? "",
          status: l.status ?? "new",
          qualityRating: l.qualityRating ?? "",
          dealValue: l.dealValue ?? null,
          dataSource: l.dataSource ?? "mock",
          createdAt: l.createdAt,
        }));
        return exportLeadsToSheet(spreadsheetId, input.sheetName, sheetLeads);
      }),
  }),

  // ── Team Management ────────────────────────────────────────────────
  team: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getTeamMembers(ctx.user.id);
    }),

    invite: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        role: z.enum(["admin", "agent", "viewer"]).default("agent"),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await addTeamMember({
          ownerId: ctx.user.id,
          email: input.email,
          role: input.role,
          status: "pending",
        });
        return { success: true, id };
      }),

    updateRole: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        role: z.enum(["admin", "agent", "viewer"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateTeamMemberRole(input.id, ctx.user.id, input.role);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        await removeTeamMember(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ── Autopilot ──────────────────────────────────────────────────
  autopilot: router({
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
  }),

  // ── Integrations (Webhooks, ClickUp, Slack) ──────────────────────
  integrations: router({
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
        const id = await createWebhookConfig({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          webhookUrl: input.webhookUrl ?? null,
          clickupApiKey: input.clickupApiKey ?? null,
          clickupListId: input.clickupListId ?? null,
          slackWebhookUrl: input.slackWebhookUrl ?? null,
          triggerOnGenerate: input.triggerOnGenerate,
          triggerOnStatusChange: input.triggerOnStatusChange,
          triggerOnDealClose: input.triggerOnDealClose,
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
          webhookUrl: null,
          clickupApiKey: input.apiKey,
          clickupListId: input.listId,
          slackWebhookUrl: null,
          triggerOnGenerate: false,
          triggerOnStatusChange: false,
          triggerOnDealClose: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await testWebhook(tempConfig, ctx.user.id);
        if (!result.success) {
          throw new Error(`ClickUp export failed: ${result.error || `HTTP ${result.status}`}`);
        }

        // Now send actual leads
        await dispatchWebhooks(ctx.user.id, "generate", leadsData as any, { source: "manual_clickup_export" });
        return { success: true, count: leadsData.length };
      }),
  }),

  // ── B2B Matching ─────────────────────────────────────────────────
  matching: router({
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
  }),

  // ── AI SDR Agent ─────────────────────────────────────────────────
  sdr: router({
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
  }),

  // ── Next Best Action ─────────────────────────────────────────────
  nba: router({
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
  }),

  // ── Social Listening ────────────────────────────────────────────
  social: router({
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
  }),

  // ─── Tracking Pixel ─────────────────────────────────────────
  trackingPixel: router({
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
  }),

  // ─── Smart Alert Rules ─────────────────────────────────────
  alertRules: router({
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
  }),

  // ─── Smart Lists ───────────────────────────────────────────
  smartLists: router({
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
  }),

  // ─── Email Verification ────────────────────────────────────
  emailVerification: router({
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
  }),

  // ─── Campaign Rules (If/Then) ──────────────────────────────
  campaignRules: router({
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
  }),

  // ─── Agency Panel ──────────────────────────────────────────
  agency: router({
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
  }),

  // ─── Speed-to-Lead ─────────────────────────────────────────
  speedToLead: router({
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
  }),

  // ─── ICP Builder ───────────────────────────────────────────
  icpBuilder: router({
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
        const content = response.choices?.[0]?.message?.content;
        if (!content) throw new Error("Failed to generate ICP");
        return JSON.parse(content);
      }),
  }),

  // ─── Tech Stack Detection ──────────────────────────────────
  techStack: router({
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
        const content = response.choices?.[0]?.message?.content;
        if (!content) throw new Error("Failed to detect tech stack");
        const parsed = JSON.parse(content);
        await createTechStackDetection({ userId: ctx.user.id, domain: input.domain, leadId: input.leadId, technologies: JSON.stringify(parsed.technologies), categories: JSON.stringify(parsed.categories) });
        return { ...parsed, cached: false };
      }),
  }),

  // ─── AI Agent Builder ──────────────────────────────────────
  aiAgents: router({
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
          const output = response.choices?.[0]?.message?.content || "";
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
  }),

  // ─── LinkedIn Connections ──────────────────────────────────
  linkedinConnections: router({
    byLead: protectedProcedure
      .input(z.object({ leadId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        return getLinkedinConnectionsByLead(input.leadId);
      }),
  }),

  // ─── Onboarding ──────────────────────────────────────────────
  onboarding: router({
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
          industry: input.industry,
          companySize: input.companySize ?? null,
          location: input.location ?? null,
          seniorityLevel: input.seniorityLevel ?? null,
          keywords: input.keywords ?? null,
          description: `Onboarding ICP: ${input.industry}`,
        });
      }),
    // Save webhook during onboarding (reuses webhookConfigs table)
    saveWebhook: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          url: z.string().url(),
          type: z.enum(["webhook", "clickup"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createWebhookConfig({
          userId: ctx.user.id,
          name: input.name,
          url: input.url,
          type: input.type,
          isActive: true,
        });
      }),
  }),

  // ─── Email Sequences ────────────────────────────────────────────
  sequences: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getEmailSequences(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        return createEmailSequence({ userId: ctx.user.id, name: input.name, description: input.description });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteEmailSequence(input.id, ctx.user.id);
        return { success: true };
      }),
    getSteps: protectedProcedure
      .input(z.object({ sequenceId: z.number() }))
      .query(async ({ input }) => {
        return getSequenceSteps(input.sequenceId);
      }),
    saveSteps: protectedProcedure
      .input(z.object({
        sequenceId: z.number(),
        steps: z.array(z.object({
          stepNumber: z.number(),
          delayDays: z.number(),
          subject: z.string(),
          body: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        await upsertSequenceSteps(input.sequenceId, input.steps);
        return { success: true };
      }),
    enroll: protectedProcedure
      .input(z.object({ sequenceId: z.number(), leadId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await enrollLeadInSequence({ sequenceId: input.sequenceId, leadId: input.leadId, userId: ctx.user.id });
        return { success: true };
      }),
    enrollments: protectedProcedure.query(async ({ ctx }) => {
      return getSequenceEnrollments(ctx.user.id);
    }),
  }),

  // ─── Tasks / Activity Tracker ───────────────────────────────────
  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getTasks(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["call", "email", "meeting", "follow_up", "other"]).default("other"),
        leadId: z.number().optional(),
        dueAt: z.date().optional(),
        reminderAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createTask({
          userId: ctx.user.id,
          title: input.title,
          description: input.description ?? null,
          type: input.type,
          leadId: input.leadId ?? null,
          dueAt: input.dueAt ?? null,
          reminderAt: input.reminderAt ?? null,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(["call", "email", "meeting", "follow_up", "other"]).optional(),
        status: z.enum(["pending", "done", "cancelled"]).optional(),
        dueAt: z.date().optional(),
        reminderAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateTask(id, ctx.user.id, data as any);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteTask(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Capture Plans ──────────────────────────────────────────────
  capturePlans: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getCapturePlans(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        companyName: z.string().optional(),
        leadId: z.number().optional(),
        stage: z.enum(["identify", "research", "outreach", "qualify", "propose", "close"]).default("identify"),
        notes: z.string().optional(),
        estimatedValue: z.string().optional(),
        probability: z.number().min(0).max(100).optional(),
        expectedCloseAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createCapturePlan({
          userId: ctx.user.id,
          title: input.title,
          companyName: input.companyName ?? null,
          leadId: input.leadId ?? null,
          stage: input.stage,
          notes: input.notes ?? null,
          estimatedValue: input.estimatedValue ?? null,
          probability: input.probability ?? 10,
          expectedCloseAt: input.expectedCloseAt ?? null,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        companyName: z.string().optional(),
        stage: z.enum(["identify", "research", "outreach", "qualify", "propose", "close"]).optional(),
        notes: z.string().optional(),
        estimatedValue: z.string().optional(),
        probability: z.number().optional(),
        expectedCloseAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateCapturePlan(id, ctx.user.id, data as any);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCapturePlan(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Market Intelligence ────────────────────────────────────────
  marketIntel: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getMarketIntelReports(ctx.user.id);
    }),
    generate: protectedProcedure
      .input(z.object({ industry: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const prompt = `You are a B2B market intelligence analyst. Generate a comprehensive market intelligence report for the ${input.industry} industry. Include:
1. Market Overview (size, growth rate, key trends)
2. Top 5 Competitors (name, strengths, weaknesses, market position)
3. Buyer Personas (2-3 decision maker profiles with pain points)
4. Sales Signals (what triggers a buying decision)
5. Outreach Strategy (best channels, timing, messaging angle)
6. Key Opportunities (3 specific opportunities to exploit)

Format as structured JSON with keys: overview, competitors, buyerPersonas, salesSignals, outreachStrategy, opportunities`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a B2B market intelligence expert. Always respond with valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });
        const reportData = response.choices[0].message.content ?? "{}";
        return saveMarketIntelReport(ctx.user.id, input.industry, reportData);
      }),
  }),

  // ─── Knowledge Base ─────────────────────────────────────────────
  knowledge: router({
    list: protectedProcedure.query(async () => {
      await seedKnowledgeArticles();
      return getKnowledgeArticles();
    }),
  }),

  // ─── Stripe Billing ────────────────────────────────────────────
  billing: router({
    getSubscription: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (rows.length === 0) return null;
      const u = rows[0] as any;
      return {
        status: u.subscriptionStatus ?? "free",
        plan: u.subscriptionPlan ?? "free",
        stripeCustomerId: u.stripeCustomerId ?? null,
        stripeSubscriptionId: u.stripeSubscriptionId ?? null,
      };
    }),
    createCheckout: protectedProcedure
      .input(z.object({
        plan: z.enum(["starter", "growth", "pro"]),
        interval: z.enum(["monthly", "yearly"]),
        origin: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2025-01-27.acacia" } as any);
        const { STRIPE_PRODUCTS } = await import("./stripeProducts");
        const product = STRIPE_PRODUCTS[input.plan];
        const priceId = input.interval === "monthly" ? product.priceIdMonthly : product.priceIdYearly;
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          customer_email: ctx.user.email ?? undefined,
          allow_promotion_codes: true,
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${input.origin}/billing?success=1`,
          cancel_url: `${input.origin}/billing?canceled=1`,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            plan: input.plan,
            customer_email: ctx.user.email ?? "",
            customer_name: ctx.user.name ?? "",
          },
        });
        return { url: session.url };
      }),
    createPortal: protectedProcedure
      .input(z.object({ origin: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const rows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        const u = rows[0] as any;
        if (!u?.stripeCustomerId) throw new Error("No Stripe customer found. Please subscribe first.");
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2025-01-27.acacia" } as any);
        const session = await stripe.billingPortal.sessions.create({
          customer: u.stripeCustomerId,
          return_url: `${input.origin}/billing`,
        });
        return { url: session.url };
      }),
  }),

  // ─── AI Assistant Chat ─────────────────────────────────────────
  aiChat: router({
    // Get all available personas
    getPersonas: publicProcedure.query(async () => {
      const { AI_PERSONAS } = await import("./aiPersonas");
      return AI_PERSONAS.map(({ id, name, title, specialty, emoji, color, tags, category }) => ({
        id, name, title, specialty, emoji, color, tags, category,
      }));
    }),
    // Get chat history
    history: protectedProcedure.query(async ({ ctx }) => {
      return getChatHistory(ctx.user.id, 50);
    }),

    // Clear chat history
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await clearChatHistory(ctx.user.id);
      return { success: true };
    }),

    // Get AI performance logs
    performanceLogs: protectedProcedure.query(async ({ ctx }) => {
      return getAiPerformanceLogs(ctx.user.id, 10);
    }),

    // Get AI memory/learnings
    memory: protectedProcedure.query(async ({ ctx }) => {
      return getAiMemory(ctx.user.id);
    }),

    // Main chat endpoint with full tool-calling
    sendMessage: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(4000),
        personaId: z.string().optional(),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).default([]),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;

        // Gather full platform context
        const [stats, memory, recentLogs] = await Promise.all([
          getLeadStats(userId),
          getAiMemory(userId),
          getAiPerformanceLogs(userId, 3),
        ]);

        const memoryContext = memory.length > 0
          ? `\nLearned preferences & insights:\n${memory.slice(0, 10).map((m: any) => `- [${m.memoryType}] ${m.key}: ${m.value}`).join("\n")}`
          : "";

        const perfContext = recentLogs.length > 0
          ? `\nRecent AI performance cycles: ${recentLogs.length} cycles run, latest score: ${recentLogs[0]?.score ?? "N/A"}/100`
          : "";

         // Build platform context string
        const platformContext = `
Current user: ${ctx.user.name} (${ctx.user.email}) | Plan: ${(ctx.user as any).subscriptionPlan ?? "free"}
Live platform stats:
- Total leads: ${stats.totalLeads} | Enriched: ${stats.enrichedLeads} | Sessions: ${stats.totalSessions}
- Pipeline: ${stats.statusBreakdown.map((s: any) => `${s.status}(${s.count})`).join(", ") || "empty"}
- Top industries: ${stats.industryBreakdown.slice(0, 3).map((i: any) => `${i.industry}(${i.count})`).join(", ") || "none"}
- Revenue: $${stats.roiStats.totalRevenue.toFixed(0)} from ${stats.roiStats.closedDeals} closed deals | Close rate: ${stats.roiStats.closeRate.toFixed(1)}%
- Quality: ${stats.qualityBreakdown.good} good / ${stats.qualityBreakdown.bad} bad / ${stats.qualityBreakdown.unrated} unrated${memoryContext}${perfContext}
Your capabilities: ANALYZE pipeline health, ADVISE on strategy, NAVIGATE the app, OPTIMIZE sequences/ICP, REPORT performance, LEARN preferences.
Be concise: max 3-4 sentences unless asked for more. Use numbers from stats above. Proactively call out problems.`;

        // Resolve persona system prompt
        const { getPersonaById, DEFAULT_PERSONA_ID } = await import("./aiPersonas");
        const persona = getPersonaById(input.personaId ?? DEFAULT_PERSONA_ID);
        const systemPrompt = persona
          ? persona.systemPrompt(platformContext)
          : `You are an autonomous AI sales assistant for LeadGen AI.${platformContext}`;

        // Build messages array
        const messages: any[] = [
          { role: "system", content: systemPrompt },
          ...input.conversationHistory.slice(-10), // last 10 messages for context
          { role: "user", content: input.message },
        ];

        const response = await invokeLLM({ messages });
        const assistantContent = response.choices[0].message.content ?? "I couldn't generate a response. Please try again.";

        // Save both messages to history
        await Promise.all([
          saveChatMessage({ userId, role: "user", content: input.message }),
          saveChatMessage({ userId, role: "assistant", content: assistantContent }),
        ]);

        // Extract and store learnings from the conversation
        const lowerMsg = input.message.toLowerCase();
        if (lowerMsg.includes("prefer") || lowerMsg.includes("always") || lowerMsg.includes("never")) {
          await upsertAiMemory(userId, `user_preference_${Date.now()}`, input.message, "preference", 0.8);
        }

        return {
          content: assistantContent,
          role: "assistant" as const,
          stats: {
            totalLeads: stats.totalLeads,
            closedDeals: stats.roiStats.closedDeals,
            revenue: stats.roiStats.totalRevenue,
          },
        };
      }),

    // Onboarding progress
    setupProgress: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const user = ctx.user as any;
      const stats = await getLeadStats(userId);

      const steps = [
        { id: "profile", label: "Complete your profile", done: !!(user.name && user.email), link: "/settings" },
        { id: "icp", label: "Define your ICP", done: false, link: "/icp-builder" },
        { id: "first_leads", label: "Generate your first leads", done: stats.totalLeads > 0, link: "/generate" },
        { id: "sequence", label: "Create an email sequence", done: false, link: "/sequences" },
        { id: "integration", label: "Set up an integration", done: false, link: "/integrations" },
        { id: "deal", label: "Close your first deal", done: stats.roiStats.closedDeals > 0, link: "/pipeline" },
      ];

      // Check ICP
      const db = await getDb();
      if (db) {
        const { icpProfiles, emailSequences, webhookConfigs } = await import("../drizzle/schema");
        const [icpResult, seqResult, webhookResult] = await Promise.all([
          db.select({ count: eq(icpProfiles.userId, userId) }).from(icpProfiles).where(eq(icpProfiles.userId, userId)).limit(1),
          db.select({ count: eq(emailSequences.userId, userId) }).from(emailSequences).where(eq(emailSequences.userId, userId)).limit(1),
          db.select({ count: eq(webhookConfigs.userId, userId) }).from(webhookConfigs).where(eq(webhookConfigs.userId, userId)).limit(1),
        ]);
        if (icpResult.length > 0) steps[1].done = true;
        if (seqResult.length > 0) steps[3].done = true;
        if (webhookResult.length > 0) steps[4].done = true;
      }

      const completed = steps.filter((s) => s.done).length;
      const percentage = Math.round((completed / steps.length) * 100);
      return { steps, completed, total: steps.length, percentage };
    }),
    // AI Insights: aggregated performance logs + memory learnings
    insights: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const [perfLogs, memory, chatHistory] = await Promise.all([
        getAiPerformanceLogs(userId, 5),
        getAiMemory(userId),
        getChatHistory(userId, 100),
      ]);
      const recentActions = perfLogs.flatMap((log: any) => {
        try {
          const actions = JSON.parse(log.actionsPerformed || '[]');
          return actions.slice(0, 3).map((a: any) => ({
            action: typeof a === 'string' ? a : (a.action || a.description || JSON.stringify(a)),
            score: Number(log.score) || 0,
            cycleType: log.cycleType,
            timestamp: log.createdAt,
          }));
        } catch { return []; }
      }).slice(0, 8);
      const learnings = memory.slice(0, 8).map((m: any) => ({
        id: m.id,
        type: m.memoryType,
        key: m.key,
        value: m.value,
        confidence: Number(m.confidence) || 0.5,
        usageCount: m.usageCount || 0,
        createdAt: m.createdAt,
      }));
      const scoreTrend = perfLogs.map((log: any) => ({
        score: Number(log.score) || 0,
        cycleType: log.cycleType,
        timestamp: log.createdAt,
      }));
      const totalMessages = chatHistory.length;
      const userMessages = chatHistory.filter((m: any) => m.role === 'user').length;
      const lastActivity = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].createdAt : null;
      return {
        recentActions,
        learnings,
        scoreTrend,
        stats: {
          totalMessages,
          userMessages,
          lastActivity,
          totalCycles: perfLogs.length,
          avgScore: perfLogs.length > 0
            ? Math.round(perfLogs.reduce((s: number, l: any) => s + Number(l.score || 0), 0) / perfLogs.length)
            : 0,
        },
      };
    }),
    // Search chat history
    searchHistory: protectedProcedure
      .input(z.object({
        query: z.string().optional(),
        limit: z.number().int().min(1).max(200).default(100),
      }))
      .query(async ({ ctx, input }) => {
        const history = await getChatHistory(ctx.user.id, input.limit);
        if (!input.query) return history;
        const q = input.query.toLowerCase();
        return history.filter((m: any) => m.content.toLowerCase().includes(q));
      }),
    // Toggle persona favorite
    toggleFavorite: protectedProcedure
      .input(z.object({ personaId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { favorited: false };
        const { userPersonaFavorites } = await import('../drizzle/schema');
        const existing = await db.select()
          .from(userPersonaFavorites)
          .where(and(eq(userPersonaFavorites.userId, ctx.user.id), eq(userPersonaFavorites.personaId, input.personaId)))
          .limit(1);
        if (existing.length > 0) {
          await db.delete(userPersonaFavorites)
            .where(and(eq(userPersonaFavorites.userId, ctx.user.id), eq(userPersonaFavorites.personaId, input.personaId)));
          return { favorited: false };
        } else {
          await db.insert(userPersonaFavorites).values({ userId: ctx.user.id, personaId: input.personaId });
          return { favorited: true };
        }
      }),
    // Get user's favorite persona IDs
    getFavorites: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [] as string[];
      const { userPersonaFavorites } = await import('../drizzle/schema');
      const rows = await db.select()
        .from(userPersonaFavorites)
        .where(eq(userPersonaFavorites.userId, ctx.user.id));
      return rows.map((r: any) => r.personaId as string);
    }),
  }),
  // ─── Competitive Landscapepe ──────────────────────────────────────
  competitiveMap: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getCompetitiveMaps(ctx.user.id);
    }),
    generate: protectedProcedure
      .input(z.object({ companyName: z.string().min(1), industry: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const prompt = `Analyze the competitive landscape for a company called "${input.companyName}" in the ${input.industry} industry. Return a JSON object with:
- competitors: array of objects with { name, strengths, weaknesses, marketShare (0-100), pricePosition ("budget"|"mid"|"premium"), targetSegment }
- positioning: object with { xAxis: "Price", yAxis: "Features", ourPosition: { x: 0-100, y: 0-100 } }
- differentiators: array of strings (our unique advantages)
- threats: array of strings
- opportunities: array of strings
Include 4-6 real or realistic competitors.`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a competitive intelligence expert. Always respond with valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });
        const mapData = response.choices[0].message.content ?? "{}";
        return saveCompetitiveMap(ctx.user.id, input.companyName, input.industry, mapData);
      }),
  }),
});
export type AppRouter = typeof appRouter;

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
});
export type AppRouter = typeof appRouter;

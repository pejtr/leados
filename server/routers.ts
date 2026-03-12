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
  getLeadsBySession,
  getLeadSessionsByUser,
  insertLeads,
  updateLeadSession,
} from "./db";
import { runLeadPipeline, SUPPORTED_INDUSTRIES } from "./leadPipeline";

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
    // ── List supported industries ──────────────────────────────
    industries: publicProcedure.query(() => SUPPORTED_INDUSTRIES),

    // ── Generate leads (full pipeline) ────────────────────────
    generate: protectedProcedure
      .input(
        z.object({
          industry: z.string().min(1),
          location: z.string().min(1).default("United States"),
          count: z.number().int().min(1).max(50).default(10),
          seniorityLevel: z.string().default("Manager"),
          apifyToken: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;

        // Create session record
        const sessionId = await createLeadSession({
          userId,
          industry: input.industry,
          location: input.location,
          seniorityLevel: input.seniorityLevel,
          requestedCount: input.count,
          status: "running",
        });

        try {
          await updateLeadSession(sessionId, { status: "running" });

          const rawLeads = await runLeadPipeline({
            industry: input.industry,
            location: input.location,
            count: input.count,
            seniorityLevel: input.seniorityLevel,
            apifyToken: input.apifyToken,
          });

          // Persist leads
          await insertLeads(
            rawLeads.map((l) => ({
              sessionId,
              userId,
              companyName: l.companyName,
              email: l.email || null,
              website: l.website || null,
              industry: l.industry,
              location: l.location || null,
              companySize: l.companySize || null,
              seniorityLevel: l.seniorityLevel || null,
              contactName: l.contactName || null,
              linkedinUrl: l.linkedinUrl || null,
              companyDescription: l.companyDescription || null,
              icebreaker: l.icebreaker || null,
              isEnriched: l.isEnriched,
            }))
          );

          const enrichedCount = rawLeads.filter((l) => l.isEnriched).length;
          await updateLeadSession(sessionId, {
            status: "done",
            generatedCount: rawLeads.length,
            enrichedCount,
            completedAt: new Date(),
          });

          // Return the saved leads
          const saved = await getLeadsBySession(sessionId);
          return { success: true, sessionId, leads: saved, count: saved.length };
        } catch (err: any) {
          await updateLeadSession(sessionId, {
            status: "error",
            errorMessage: err?.message ?? "Unknown error",
          });
          throw err;
        }
      }),

    // ── List leads with search/filter/pagination ──────────────
    list: protectedProcedure
      .input(
        z.object({
          search: z.string().optional(),
          industry: z.string().optional(),
          sessionId: z.number().int().optional(),
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return getLeads({ userId: ctx.user.id, ...input });
      }),

    // ── Get leads for a specific session ─────────────────────
    bySession: protectedProcedure
      .input(z.object({ sessionId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        return getLeadsBySession(input.sessionId);
      }),

    // ── List generation sessions ──────────────────────────────
    sessions: protectedProcedure.query(async ({ ctx }) => {
      return getLeadSessionsByUser(ctx.user.id);
    }),

    // ── Delete a session and its leads ────────────────────────
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

    // ── Export (returns JSON-serialisable array) ──────────────
    export: protectedProcedure
      .input(
        z.object({
          sessionId: z.number().int().optional(),
          industry: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const { items } = await getLeads({
          userId: ctx.user.id,
          industry: input.industry,
          sessionId: input.sessionId,
          limit: 1000,
          offset: 0,
        });
        return items;
      }),
  }),
});

export type AppRouter = typeof appRouter;

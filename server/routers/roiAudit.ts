import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { roiAuditSessions } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

const ProcessSchema = z.object({
  name: z.string(),
  description: z.string(),
  timePerWeekHours: z.number(),
  valueRating: z.number().min(1).max(5),
});

export const roiAuditRouter = router({
  // List all audit sessions for user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(roiAuditSessions)
      .where(eq(roiAuditSessions.userId, ctx.user.id))
      .orderBy(desc(roiAuditSessions.createdAt));
  }),

  // Get single audit session
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db.select().from(roiAuditSessions)
        .where(eq(roiAuditSessions.id, input.id));
      if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),

  // Create new audit session
  create: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(256) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const now = Date.now();
      const [result] = await db.insert(roiAuditSessions).values({
        userId: ctx.user.id,
        title: input.title,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      });
      return { id: (result as any).insertId };
    }),

  // Save processes (step 1 & 2 of the 4-step framework)
  saveProcesses: protectedProcedure
    .input(z.object({
      id: z.number(),
      processes: z.array(ProcessSchema),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db.select().from(roiAuditSessions).where(eq(roiAuditSessions.id, input.id));
      if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.update(roiAuditSessions).set({
        processes: input.processes,
        status: "processes_saved",
        updatedAt: Date.now(),
      }).where(eq(roiAuditSessions.id, input.id));
      return { ok: true };
    }),

  // Run AI feasibility analysis (step 3 & 4 of the 4-step framework)
  analyze: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db.select().from(roiAuditSessions).where(eq(roiAuditSessions.id, input.id));
      if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (!session.processes || (session.processes as any[]).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No processes to analyze" });
      }

      const processes = session.processes as Array<{name: string; description: string; timePerWeekHours: number; valueRating: number}>;

      const prompt = `You are an AI automation consultant specializing in B2B sales and lead generation workflows.

Analyze these business processes and determine automation feasibility using current AI tools (Claude, n8n, Make, Zapier, LeadOS).

Processes to analyze:
${processes.map((p, i) => `${i + 1}. **${p.name}**
   Description: ${p.description}
   Time per week: ${p.timePerWeekHours}h
   Business value rating: ${p.valueRating}/5`).join("\n\n")}

For each process, provide a JSON analysis. Respond ONLY with valid JSON array:
[
  {
    "processName": "exact name from input",
    "feasibilityScore": 0-100,
    "roiScore": 0-100,
    "automationType": "full|partial|human_in_loop",
    "recommendation": "2-3 sentence specific recommendation",
    "tools": ["tool1", "tool2"],
    "estimatedTimeSavedHoursMonthly": number,
    "estimatedCostSavingEurMonthly": number,
    "implementationEffort": "low|medium|high",
    "firstStep": "concrete first action"
  }
]

Prioritize by ROI score descending. Be realistic and specific.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert AI automation consultant. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      });

      let analysis: any[] = [];
      try {
        const content = response.choices?.[0]?.message?.content || "[]";
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to parse AI analysis" });
      }

      // Sort by ROI score descending
      analysis.sort((a, b) => (b.roiScore || 0) - (a.roiScore || 0));

      const totalTimeSaved = analysis.reduce((sum, a) => sum + (a.estimatedTimeSavedHoursMonthly || 0), 0);
      const totalSaving = analysis.reduce((sum, a) => sum + (a.estimatedCostSavingEurMonthly || 0), 0);
      const topPriority = analysis[0]?.processName || "";

      await db.update(roiAuditSessions).set({
        feasibilityAnalysis: analysis,
        status: "analyzed",
        totalTimeSavedHours: Math.round(totalTimeSaved),
        estimatedMonthlySavingEur: Math.round(totalSaving),
        topPriorityProcess: topPriority,
        updatedAt: Date.now(),
      }).where(eq(roiAuditSessions.id, input.id));

      return { analysis, totalTimeSavedHours: Math.round(totalTimeSaved), estimatedMonthlySavingEur: Math.round(totalSaving), topPriority };
    }),

  // Delete audit session
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db.select().from(roiAuditSessions).where(eq(roiAuditSessions.id, input.id));
      if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(roiAuditSessions).where(eq(roiAuditSessions.id, input.id));
      return { ok: true };
    }),
});

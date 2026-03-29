import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { dailyReportConfigs } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendDailyReport } from "./dailyReportScheduler";

export const dailyReportRouter = router({
  // Get current user's report config
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [config] = await db
      .select()
      .from(dailyReportConfigs)
      .where(eq(dailyReportConfigs.userId, ctx.user.id))
      .limit(1);
    return config ?? null;
  }),

  // Upsert report config
  save: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        isActive: z.boolean().default(true),
        sendHour: z.number().int().min(0).max(23).default(8),
        includeProjects: z.boolean().default(true),
        includeCampaigns: z.boolean().default(true),
        includeLeads: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
    if (!db) throw new Error("DB unavailable");
      const [existing] = await db
        .select()
        .from(dailyReportConfigs)
        .where(eq(dailyReportConfigs.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db
          .update(dailyReportConfigs)
          .set({ ...input, updatedAt: Date.now() })
          .where(eq(dailyReportConfigs.id, existing.id));
        return { id: existing.id };
      } else {
        const [result] = await db
          .insert(dailyReportConfigs)
          .values({ ...input, userId: ctx.user.id });
        return { id: (result as any).insertId };
      }
    }),

  // Toggle active state
  toggle: protectedProcedure
    .input(z.object({ isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
    if (!db) throw new Error("DB unavailable");
      await db
        .update(dailyReportConfigs)
        .set({ isActive: input.isActive, updatedAt: Date.now() })
        .where(eq(dailyReportConfigs.userId, ctx.user.id));
      return { success: true };
    }),

  // Send test report immediately
  sendNow: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [config] = await db
      .select()
      .from(dailyReportConfigs)
      .where(eq(dailyReportConfigs.userId, ctx.user.id))
      .limit(1);

    if (!config) {
      throw new Error("No report config found. Please save settings first.");
    }

    await sendDailyReport(config);
    return { success: true };
  }),
});

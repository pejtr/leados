import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getLlmUsageStats, getLlmUsageHistory } from "../db/llm-usage";
import { getUserTokenLimits, setUserTokenLimits } from "../db/users";

export const llmUsageRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    return getLlmUsageStats(ctx.user.role === "admin" ? undefined : ctx.user.id);
  }),

  history: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return getLlmUsageHistory({
        userId: ctx.user.role === "admin" ? undefined : ctx.user.id,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  getBudget: protectedProcedure
    .input(z.object({ userId: z.number().int().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const targetUserId = input?.userId;
      if (targetUserId && ctx.user.role !== "admin" && targetUserId !== ctx.user.id) {
        throw new Error("Not authorized to view another user's budget");
      }
      return getUserTokenLimits(targetUserId ?? ctx.user.id);
    }),

  setBudget: adminProcedure
    .input(
      z.object({
        userId: z.number().int(),
        dailyTokenLimit: z.number().int().min(0).nullable(),
        monthlyTokenLimit: z.number().int().min(0).nullable(),
      })
    )
    .mutation(async ({ input }) => {
      await setUserTokenLimits(input.userId, input.dailyTokenLimit, input.monthlyTokenLimit);
      return { success: true };
    }),
});
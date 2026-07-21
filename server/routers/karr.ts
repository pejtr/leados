import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getKarrReviews } from "../db/karr";

export const karrRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["email", "lead", "message", "workflow", "campaign", "mission"]).optional(),
        targetId: z.number().int().optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return getKarrReviews({
        userId: ctx.user.id,
        targetType: input.targetType,
        targetId: input.targetId,
        limit: input.limit,
        offset: input.offset,
      });
    }),
});
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getAuditEvents, getAuditStats } from "../db/audit";

export const auditRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventType: z.string().optional(),
        resourceType: z.string().optional(),
        resourceId: z.number().int().optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return getAuditEvents({
        userId: ctx.user.role === "admin" ? undefined : ctx.user.id,
        eventType: input.eventType,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    return getAuditStats(ctx.user.role === "admin" ? undefined : ctx.user.id);
  }),
});

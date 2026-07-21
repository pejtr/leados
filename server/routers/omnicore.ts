import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getModuleRegistry, getActiveModules, getModuleById, getOmnicoreInfo } from "../omnicore";
import { getProvenanceStats } from "../db/source-data-harmonizer";

export const omnicoreRouter = router({
  info: publicProcedure.query(() => {
    return getOmnicoreInfo();
  }),

  modules: publicProcedure.query(() => {
    return getModuleRegistry();
  }),

  activeModules: publicProcedure.query(() => {
    return getActiveModules();
  }),

  getModule: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return getModuleById(input.id) ?? null;
    }),

  hubStatus: protectedProcedure.query(async ({ ctx }) => {
    const provenanceStats = await getProvenanceStats(ctx.user.id);
    return {
      hub: getOmnicoreInfo(),
      provenance: provenanceStats
        ? {
            totalEntries: provenanceStats.totalEntries,
            bySourceType: provenanceStats.bySourceType,
          }
        : null,
    };
  }),
});

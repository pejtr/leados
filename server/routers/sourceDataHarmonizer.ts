import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getProvenanceEntries,
  getProvenanceById,
  updateProvenance,
  getProvenanceStats,
  getAttributionsByProvenance,
  getAttributionsByEntity,
} from "../db/source-data-harmonizer";
import { harmonizeRecord, calculateConfidence } from "../sourceDataHarmonizer";

export const sourceDataHarmonizerRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        sourceType: z.string().optional(),
        providerName: z.string().optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return getProvenanceEntries({
        userId: ctx.user.id,
        sourceType: input.sourceType,
        providerName: input.providerName,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      return getProvenanceById(input.id);
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    return getProvenanceStats(ctx.user.id);
  }),

  harmonize: protectedProcedure
    .input(
      z.object({
        sourceId: z.string().min(1),
        providerName: z.string().min(1),
        sourceType: z.string().min(1),
        collectedBy: z.string().min(1),
        ingestionMethod: z.string().min(1),
        rawReference: z.string().optional(),
        normalizedReference: z.string().optional(),
        licenseStatus: z.string().optional(),
        redistributionAllowed: z.boolean().optional(),
        confidenceScore: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await harmonizeRecord({
        sourceId: input.sourceId,
        providerName: input.providerName,
        sourceType: input.sourceType,
        collectedBy: input.collectedBy,
        ingestionMethod: input.ingestionMethod,
        rawReference: input.rawReference,
        normalizedReference: input.normalizedReference,
        licenseStatus: input.licenseStatus,
        redistributionAllowed: input.redistributionAllowed,
        confidenceScore: input.confidenceScore ?? calculateConfidence(input.ingestionMethod, 0, 0),
        userId: ctx.user.id,
      });
      return { id, status: "harmonized" };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        licenseStatus: z.string().optional(),
        redistributionAllowed: z.boolean().optional(),
        confidenceScore: z.number().min(0).max(1).optional(),
        clientVisibleStatus: z.boolean().optional(),
        internalOnlyStatus: z.boolean().optional(),
        lastVerifiedAt: z.string().optional(),
        normalizedReference: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await updateProvenance(input.id, {
        licenseStatus: input.licenseStatus,
        redistributionAllowed: input.redistributionAllowed,
        confidenceScore: input.confidenceScore !== undefined ? String(input.confidenceScore) : undefined,
        clientVisibleStatus: input.clientVisibleStatus,
        internalOnlyStatus: input.internalOnlyStatus,
        lastVerifiedAt: input.lastVerifiedAt ? new Date(input.lastVerifiedAt) : undefined,
        normalizedReference: input.normalizedReference,
      });
      return { success: result };
    }),

  getAttributions: protectedProcedure
    .input(
      z.object({
        provenanceId: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      return getAttributionsByProvenance(input.provenanceId);
    }),

  getEntityAttributions: protectedProcedure
    .input(
      z.object({
        entityType: z.string().min(1),
        entityId: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      return getAttributionsByEntity(input.entityType, input.entityId);
    }),
});

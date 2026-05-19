/**
 * API Keys Management Router
 * tRPC procedures for CRUD operations on API keys
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createApiKey,
  validateApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
  hasPermission,
} from "../apiKeys";

export const apiKeysRouter = router({
  /**
   * Create a new API key
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(256),
        permissions: z.string().default("read"),
        expiresInDays: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await createApiKey(
        ctx.user.id,
        input.name,
        input.permissions,
        input.expiresInDays
      );

      if (!result) {
        throw new Error("Failed to create API key");
      }

      return {
        id: result.id,
        key: result.key,
        message: "API key created successfully. Save it now — you won't see it again!",
      };
    }),

  /**
   * List all API keys for the current user (without showing actual keys)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const keys = await listApiKeys(ctx.user.id);
    if (!keys) {
      throw new Error("Failed to list API keys");
    }

    return keys.map(key => ({
      id: key.id,
      name: key.name,
      permissions: key.permissions,
      status: key.status,
      lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : null,
      expiresAt: key.expiresAt ? new Date(key.expiresAt) : null,
      createdAt: new Date(key.createdAt),
    }));
  }),

  /**
   * Revoke an API key
   */
  revoke: protectedProcedure
    .input(z.object({ keyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await revokeApiKey(ctx.user.id, input.keyId);
      if (!success) {
        throw new Error("Failed to revoke API key");
      }
      return { message: "API key revoked successfully" };
    }),

  /**
   * Delete an API key
   */
  delete: protectedProcedure
    .input(z.object({ keyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await deleteApiKey(ctx.user.id, input.keyId);
      if (!success) {
        throw new Error("Failed to delete API key");
      }
      return { message: "API key deleted successfully" };
    }),

  /**
   * Validate an API key (for testing)
   */
  validate: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const record = await validateApiKey(input.key);
      if (!record) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: record.userId,
        permissions: record.permissions,
        status: record.status,
      };
    }),
});

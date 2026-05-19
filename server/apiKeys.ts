/**
 * API Keys Management
 * Handles creation, validation, and revocation of API keys for external integrations
 */
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { apiKeys, ApiKey, InsertApiKey } from "../drizzle/schema";

const API_KEY_PREFIX = "leadOS_";
const API_KEY_LENGTH = 32; // 32 random bytes = 64 hex chars

/**
 * Generate a new API key with prefix
 * Format: leadOS_<64-hex-chars>
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH);
  const randomHex = randomBytes.toString("hex");
  return `${API_KEY_PREFIX}${randomHex}`;
}

/**
 * Hash an API key for storage (SHA-256)
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
  userId: number,
  name: string,
  permissions: string = "read",
  expiresInDays?: number
): Promise<{ key: string; id: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const key = generateApiKey();
    const keyHash = hashApiKey(key);
    const expiresAt = expiresInDays ? Date.now() + expiresInDays * 24 * 60 * 60 * 1000 : undefined;

    const result = await db.insert(apiKeys).values({
      userId,
      name,
      keyHash,
      permissions,
      status: "active",
      createdAt: Date.now(),
      expiresAt,
    });

    // Get the inserted ID
    const id = (result as any).insertId || 0;
    return { key, id };
  } catch (error) {
    console.error("[ApiKeys] Failed to create API key:", error);
    return null;
  }
}

/**
 * Validate an API key and return the key record if valid
 */
export async function validateApiKey(key: string): Promise<ApiKey | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Check format
    if (!key.startsWith(API_KEY_PREFIX)) return null;

    const keyHash = hashApiKey(key);
    const now = Date.now();

    // Query for active, non-expired key
    const result = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyHash, keyHash),
          eq(apiKeys.status, "active")
        )
      )
      .limit(1);

    if (result.length === 0) return null;

    const record = result[0];

    // Check expiration
    if (record.expiresAt && record.expiresAt < now) {
      // Mark as expired
      await db
        .update(apiKeys)
        .set({ status: "expired" })
        .where(eq(apiKeys.id, record.id));
      return null;
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: now })
      .where(eq(apiKeys.id, record.id));

    return record;
  } catch (error) {
    console.error("[ApiKeys] Failed to validate API key:", error);
    return null;
  }
}

/**
 * List all API keys for a user (without showing the actual keys)
 */
export async function listApiKeys(userId: number): Promise<Omit<ApiKey, "keyHash">[] | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));

    // Remove keyHash from results
    return result.map(({ keyHash, ...rest }) => rest);
  } catch (error) {
    console.error("[ApiKeys] Failed to list API keys:", error);
    return null;
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(userId: number, keyId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(apiKeys)
      .set({ status: "revoked", revokedAt: Date.now() })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));

    return true;
  } catch (error) {
    console.error("[ApiKeys] Failed to revoke API key:", error);
    return false;
  }
}

/**
 * Delete an API key (hard delete)
 */
export async function deleteApiKey(userId: number, keyId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));

    return true;
  } catch (error) {
    console.error("[ApiKeys] Failed to delete API key:", error);
    return false;
  }
}

/**
 * Check if a user has permission for an operation
 */
export function hasPermission(apiKey: ApiKey, requiredPermission: string): boolean {
  const permissions = apiKey.permissions.split(",").map(p => p.trim());
  return permissions.includes(requiredPermission) || permissions.includes("admin");
}

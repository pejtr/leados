import { eq } from "drizzle-orm";
import { InsertUser, users } from "../../drizzle/schema";
import { getDb } from "./core";
import { ENV } from "../_core/env";

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOnboardingStatus(userId: number) {
  const db = await getDb();
  if (!db) return false;
  const [user] = await db.select({ onboardingCompleted: users.onboardingCompleted }).from(users).where(eq(users.id, userId));
  return user?.onboardingCompleted ?? false;
}

export async function completeOnboarding(userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(users).set({ onboardingCompleted: true }).where(eq(users.id, userId));
  return true;
}

export async function setUserTokenLimits(userId: number, dailyLimit: number | null, monthlyLimit: number | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    dailyTokenLimit: dailyLimit,
    monthlyTokenLimit: monthlyLimit,
  }).where(eq(users.id, userId));
}

export async function getUserTokenLimits(userId: number): Promise<{ dailyTokenLimit: number | null; monthlyTokenLimit: number | null }> {
  const db = await getDb();
  if (!db) return { dailyTokenLimit: null, monthlyTokenLimit: null };
  const [user] = await db.select({
    dailyTokenLimit: users.dailyTokenLimit,
    monthlyTokenLimit: users.monthlyTokenLimit,
  }).from(users).where(eq(users.id, userId));
  return user ?? { dailyTokenLimit: null, monthlyTokenLimit: null };
}

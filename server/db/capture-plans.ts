import { eq, and } from "drizzle-orm";
import {
  capturePlans, CapturePlan, InsertCapturePlan,
} from "../../drizzle/schema";
import { getDb } from "./core";

// ─── Capture Plans ───────────────────────────────────────────────
export async function getCapturePlans(userId: number): Promise<CapturePlan[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(capturePlans).where(eq(capturePlans.userId, userId));
}

export async function createCapturePlan(data: InsertCapturePlan): Promise<CapturePlan> {
  const db = await getDb();
  const [row] = await db!.insert(capturePlans).values(data);
  const [plan] = await db!.select().from(capturePlans).where(eq(capturePlans.id, (row as any).insertId));
  return plan;
}

export async function updateCapturePlan(id: number, userId: number, data: Partial<Pick<CapturePlan, "title" | "companyName" | "stage" | "notes" | "estimatedValue" | "probability" | "expectedCloseAt">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(capturePlans).set(data).where(and(eq(capturePlans.id, id), eq(capturePlans.userId, userId)));
}

export async function deleteCapturePlan(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(capturePlans).where(and(eq(capturePlans.id, id), eq(capturePlans.userId, userId)));
}

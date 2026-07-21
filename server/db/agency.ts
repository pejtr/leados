import { eq, desc, and } from "drizzle-orm";
import {
  agencyClients, InsertAgencyClient, AgencyClient,
} from "../../drizzle/schema";
import { getDb } from "./core";

// ─── Agency Clients ───────────────────────────────────────────

export async function createAgencyClient(data: InsertAgencyClient): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(agencyClients).values(data);
}

export async function getAgencyClientsByUser(userId: number): Promise<AgencyClient[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agencyClients).where(eq(agencyClients.agencyUserId, userId)).orderBy(desc(agencyClients.createdAt));
}

export async function updateAgencyClient(id: number, data: Partial<InsertAgencyClient>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(agencyClients).set(data).where(eq(agencyClients.id, id));
}

export async function deleteAgencyClient(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(agencyClients).where(and(eq(agencyClients.id, id), eq(agencyClients.agencyUserId, userId)));
}

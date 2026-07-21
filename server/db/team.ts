import { eq, and } from "drizzle-orm";
import { InsertTeamMember, TeamMember, teamMembers, leads } from "../../drizzle/schema";
import { getDb } from "./core";

export async function getTeamMembers(ownerId: number): Promise<TeamMember[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamMembers).where(eq(teamMembers.ownerId, ownerId));
}

export async function addTeamMember(data: InsertTeamMember): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teamMembers).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateTeamMemberRole(id: number, ownerId: number, role: "admin" | "agent" | "viewer"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(teamMembers).set({ role }).where(and(eq(teamMembers.id, id), eq(teamMembers.ownerId, ownerId)));
}

export async function removeTeamMember(id: number, ownerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(teamMembers).where(and(eq(teamMembers.id, id), eq(teamMembers.ownerId, ownerId)));
}

export async function assignLead(leadId: number, userId: number, assignedTo: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ assignedTo }).where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
}

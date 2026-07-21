import { eq, and } from "drizzle-orm";
import {
  emailSequences, emailSequenceSteps, emailSequenceEnrollments,
  EmailSequence, EmailSequenceStep, EmailSequenceEnrollment,
} from "../../drizzle/schema";
import { getDb } from "./core";

// ─── Email Sequences ─────────────────────────────────────────────
export async function getEmailSequences(userId: number): Promise<EmailSequence[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailSequences).where(eq(emailSequences.userId, userId));
}

export async function createEmailSequence(data: { userId: number; name: string; description?: string }): Promise<EmailSequence> {
  const db = await getDb();
  const [row] = await db!.insert(emailSequences).values({ userId: data.userId, name: data.name, description: data.description ?? null });
  const [seq] = await db!.select().from(emailSequences).where(eq(emailSequences.id, (row as any).insertId));
  return seq;
}

export async function deleteEmailSequence(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(emailSequenceSteps).where(eq(emailSequenceSteps.sequenceId, id));
  await db.delete(emailSequenceEnrollments).where(eq(emailSequenceEnrollments.sequenceId, id));
  await db.delete(emailSequences).where(and(eq(emailSequences.id, id), eq(emailSequences.userId, userId)));
}

export async function getSequenceSteps(sequenceId: number): Promise<EmailSequenceStep[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailSequenceSteps).where(eq(emailSequenceSteps.sequenceId, sequenceId));
}

export async function upsertSequenceSteps(sequenceId: number, steps: Array<{ stepNumber: number; delayDays: number; subject: string; body: string }>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(emailSequenceSteps).where(eq(emailSequenceSteps.sequenceId, sequenceId));
  if (steps.length > 0) {
    await db.insert(emailSequenceSteps).values(steps.map(s => ({ sequenceId, ...s })));
  }
}

export async function enrollLeadInSequence(data: { sequenceId: number; leadId: number; userId: number }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const nextSendAt = new Date();
  await db.insert(emailSequenceEnrollments).values({ ...data, nextSendAt });
}

export async function getSequenceEnrollments(userId: number): Promise<EmailSequenceEnrollment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailSequenceEnrollments).where(eq(emailSequenceEnrollments.userId, userId));
}

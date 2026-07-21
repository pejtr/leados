import { eq, desc, and } from "drizzle-orm";
import { InsertEmailTemplate, EmailTemplate, emailTemplates } from "../../drizzle/schema";
import { getDb } from "./core";

export async function getEmailTemplates(userId: number): Promise<EmailTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId)).orderBy(desc(emailTemplates.updatedAt));
}

export async function createEmailTemplate(data: InsertEmailTemplate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(emailTemplates).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateEmailTemplate(
  id: number,
  userId: number,
  data: Partial<Pick<EmailTemplate, "name" | "subject" | "body">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emailTemplates).set(data).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
}

export async function deleteEmailTemplate(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(emailTemplates).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
}

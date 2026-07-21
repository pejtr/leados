import { eq, and } from "drizzle-orm";
import {
  tasks, Task, InsertTask,
} from "../../drizzle/schema";
import { getDb } from "./core";

// ─── Tasks ───────────────────────────────────────────────────────
export async function getTasks(userId: number): Promise<Task[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.userId, userId));
}

export async function createTask(data: InsertTask): Promise<Task> {
  const db = await getDb();
  const [row] = await db!.insert(tasks).values(data);
  const [task] = await db!.select().from(tasks).where(eq(tasks.id, (row as any).insertId));
  return task;
}

export async function updateTask(id: number, userId: number, data: Partial<Pick<Task, "title" | "description" | "type" | "status" | "dueAt" | "reminderAt">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set(data).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

export async function deleteTask(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

import { getDb } from "./core";
import { cmsPages, cmsArticles, cmsCategories } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// ── Pages ──

export async function listPages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cmsPages).orderBy(desc(cmsPages.createdAt));
}

export async function getPage(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(cmsPages).where(eq(cmsPages.id, id)).limit(1);
  return row ?? null;
}

export async function getPageBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(cmsPages).where(eq(cmsPages.slug, slug)).limit(1);
  return row ?? null;
}

export async function createPage(data: typeof cmsPages.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.insert(cmsPages).values(data);
  return Number((row as any).insertId ?? row.insertId);
}

export async function updatePage(id: number, data: Partial<typeof cmsPages.$inferInsert>) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(cmsPages).set(data).where(eq(cmsPages.id, id));
  return (result as any).affectedRows > 0;
}

export async function deletePage(id: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(cmsPages).where(eq(cmsPages.id, id));
  return (result as any).affectedRows > 0;
}

// ── Articles ──

export async function listArticles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cmsArticles).orderBy(desc(cmsArticles.createdAt));
}

export async function getArticle(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(cmsArticles).where(eq(cmsArticles.id, id)).limit(1);
  return row ?? null;
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(cmsArticles).where(eq(cmsArticles.slug, slug)).limit(1);
  return row ?? null;
}

export async function createArticle(data: typeof cmsArticles.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.insert(cmsArticles).values(data);
  return Number((row as any).insertId ?? row.insertId);
}

export async function updateArticle(id: number, data: Partial<typeof cmsArticles.$inferInsert>) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(cmsArticles).set(data).where(eq(cmsArticles.id, id));
  return (result as any).affectedRows > 0;
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(cmsArticles).where(eq(cmsArticles.id, id));
  return (result as any).affectedRows > 0;
}

// ── Categories ──

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cmsCategories).orderBy(desc(cmsCategories.createdAt));
}

export async function getCategory(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(cmsCategories).where(eq(cmsCategories.id, id)).limit(1);
  return row ?? null;
}

export async function createCategory(data: typeof cmsCategories.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.insert(cmsCategories).values(data);
  return Number((row as any).insertId ?? row.insertId);
}

export async function updateCategory(id: number, data: Partial<typeof cmsCategories.$inferInsert>) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(cmsCategories).set(data).where(eq(cmsCategories.id, id));
  return (result as any).affectedRows > 0;
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(cmsCategories).where(eq(cmsCategories.id, id));
  return (result as any).affectedRows > 0;
}

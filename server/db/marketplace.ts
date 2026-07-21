import { getDb } from "./core";
import {
  catalogCategories,
  catalogProducts,
  catalogOrders,
} from "../../drizzle/schema";
import { eq, desc, sql, and } from "drizzle-orm";

// ─── Categories ──────────────────────────────────────────────────

export async function listCategories() {
  const db = await getDb();
  if (!db) return null;
  return db
    .select()
    .from(catalogCategories)
    .orderBy(catalogCategories.sortOrder);
}

export async function getCategory(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(catalogCategories)
    .where(eq(catalogCategories.id, id))
    .limit(1);
  return row ?? null;
}

export async function createCategory(
  values: typeof catalogCategories.$inferInsert
) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.insert(catalogCategories).values(values);
  return Number((row as any).insertId ?? row.insertId);
}

export async function updateCategory(
  id: number,
  values: Partial<typeof catalogCategories.$inferInsert>
) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .update(catalogCategories)
    .set(values)
    .where(eq(catalogCategories.id, id));
  return (result as any).affectedRows > 0;
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .delete(catalogCategories)
    .where(eq(catalogCategories.id, id));
  return (result as any).affectedRows > 0;
}

// ─── Products ─────────────────────────────────────────────────────

export async function listProducts() {
  const db = await getDb();
  if (!db) return null;
  return db
    .select()
    .from(catalogProducts)
    .orderBy(desc(catalogProducts.createdAt));
}

export async function getProduct(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(catalogProducts)
    .where(eq(catalogProducts.id, id))
    .limit(1);
  return row ?? null;
}

export async function getProductBySku(sku: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(catalogProducts)
    .where(eq(catalogProducts.sku, sku))
    .limit(1);
  return row ?? null;
}

export async function createProduct(
  values: typeof catalogProducts.$inferInsert
) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.insert(catalogProducts).values(values);
  return Number((row as any).insertId ?? row.insertId);
}

export async function updateProduct(
  id: number,
  values: Partial<typeof catalogProducts.$inferInsert>
) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .update(catalogProducts)
    .set(values)
    .where(eq(catalogProducts.id, id));
  return (result as any).affectedRows > 0;
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .delete(catalogProducts)
    .where(eq(catalogProducts.id, id));
  return (result as any).affectedRows > 0;
}

// ─── Orders ───────────────────────────────────────────────────────

export async function listOrders() {
  const db = await getDb();
  if (!db) return null;
  return db
    .select()
    .from(catalogOrders)
    .orderBy(desc(catalogOrders.createdAt));
}

export async function getOrder(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(catalogOrders)
    .where(eq(catalogOrders.id, id))
    .limit(1);
  return row ?? null;
}

export async function createOrder(values: typeof catalogOrders.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.insert(catalogOrders).values(values);
  return Number((row as any).insertId ?? row.insertId);
}

export async function updateOrderStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .update(catalogOrders)
    .set({ status })
    .where(eq(catalogOrders.id, id));
  return (result as any).affectedRows > 0;
}

// ─── Stats ────────────────────────────────────────────────────────

export async function getCatalogStats() {
  const db = await getDb();
  if (!db) return null;

  const productRows = await db
    .select({
      total: sql<number>`count(*)`,
      lowStock: sql<number>`sum(case when ${catalogProducts.inventory} > 0 and ${catalogProducts.inventory} <= 5 then 1 else 0 end)`,
    })
    .from(catalogProducts);

  const orderRows = await db
    .select({
      total: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${catalogOrders.total}), 0)`,
    })
    .from(catalogOrders);

  return {
    totalProducts: Number(productRows[0]?.total ?? 0),
    lowStockCount: Number(productRows[0]?.lowStock ?? 0),
    totalOrders: Number(orderRows[0]?.total ?? 0),
    totalRevenue: Number(orderRows[0]?.revenue ?? 0),
  };
}

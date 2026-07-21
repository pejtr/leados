import {
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const catalogCategories = mysqlTable("catalog_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull(),
  description: text("description"),
  parentId: int("parent_id"),
  imageUrl: varchar("image_url", { length: 512 }),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("idx_cc_slug").on(table.slug),
}));

export const catalogProducts = mysqlTable("catalog_products", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 128 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  price: int("price").notNull(),
  comparePrice: int("compare_price"),
  cost: int("cost"),
  inventory: int("inventory").default(0),
  categoryId: int("category_id"),
  status: varchar("status", { length: 32 }).default("draft"),
  images: text("images"),
  variants: text("variants"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  skuIdx: uniqueIndex("idx_cp_sku").on(table.sku),
}));

export const catalogOrders = mysqlTable("catalog_orders", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id").notNull(),
  quantity: int("quantity").default(1),
  unitPrice: int("unit_price").notNull(),
  total: int("total").notNull(),
  status: varchar("status", { length: 32 }).default("pending"),
  customerName: varchar("customer_name", { length: 256 }),
  customerEmail: varchar("customer_email", { length: 256 }),
  customerPhone: varchar("customer_phone", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CatalogCategory = typeof catalogCategories.$inferSelect;
export type InsertCatalogCategory = typeof catalogCategories.$inferInsert;
export type CatalogProduct = typeof catalogProducts.$inferSelect;
export type InsertCatalogProduct = typeof catalogProducts.$inferInsert;
export type CatalogOrder = typeof catalogOrders.$inferSelect;
export type InsertCatalogOrder = typeof catalogOrders.$inferInsert;

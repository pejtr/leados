import { mysqlTable, serial, text, timestamp, int, uniqueIndex } from "drizzle-orm/mysql-core";

export const cmsPages = mysqlTable("cms_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  status: text("status").default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("idx_cms_pages_slug").on(table.slug),
}));

export const cmsCategories = mysqlTable("cms_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("idx_cms_categories_slug").on(table.slug),
}));

export const cmsArticles = mysqlTable("cms_articles", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  excerpt: text("excerpt"),
  author: text("author"),
  categoryId: int("category_id"),
  tags: text("tags"),
  status: text("status").default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("idx_cms_articles_slug").on(table.slug),
}));

export type CmsPage = typeof cmsPages.$inferSelect;
export type InsertCmsPage = typeof cmsPages.$inferInsert;
export type CmsCategory = typeof cmsCategories.$inferSelect;
export type InsertCmsCategory = typeof cmsCategories.$inferInsert;
export type CmsArticle = typeof cmsArticles.$inferSelect;
export type InsertCmsArticle = typeof cmsArticles.$inferInsert;

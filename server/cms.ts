import {
  listPages as dbListPages,
  getPage as dbGetPage,
  getPageBySlug as dbGetPageBySlug,
  createPage as dbCreatePage,
  updatePage as dbUpdatePage,
  deletePage as dbDeletePage,
  listArticles as dbListArticles,
  getArticle as dbGetArticle,
  getArticleBySlug as dbGetArticleBySlug,
  createArticle as dbCreateArticle,
  updateArticle as dbUpdateArticle,
  deleteArticle as dbDeleteArticle,
  listCategories as dbListCategories,
  getCategory as dbGetCategory,
  createCategory as dbCreateCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
} from "./db/cms";

// ── Pages ──

export async function listPages() {
  return dbListPages();
}

export async function getPage(id: number) {
  if (!id || id < 1) return null;
  return dbGetPage(id);
}

export async function getPageBySlug(slug: string) {
  if (!slug?.trim()) return null;
  return dbGetPageBySlug(slug.trim());
}

export async function createPage(data: { slug: string; title: string; content?: string; metaTitle?: string; metaDescription?: string; status?: string; publishedAt?: Date }) {
  if (!data.slug?.trim() || !data.title?.trim()) return null;
  return dbCreatePage(data as any);
}

export async function updatePage(id: number, data: Partial<{ slug: string; title: string; content: string; metaTitle: string; metaDescription: string; status: string; publishedAt: Date }>) {
  if (!id || id < 1) return false;
  return dbUpdatePage(id, data as any);
}

export async function deletePage(id: number) {
  if (!id || id < 1) return false;
  return dbDeletePage(id);
}

// ── Articles ──

export async function listArticles() {
  return dbListArticles();
}

export async function getArticle(id: number) {
  if (!id || id < 1) return null;
  return dbGetArticle(id);
}

export async function getArticleBySlug(slug: string) {
  if (!slug?.trim()) return null;
  return dbGetArticleBySlug(slug.trim());
}

export async function createArticle(data: { slug: string; title: string; content?: string; excerpt?: string; author?: string; categoryId?: number; tags?: string; status?: string; publishedAt?: Date }) {
  if (!data.slug?.trim() || !data.title?.trim()) return null;
  return dbCreateArticle(data as any);
}

export async function updateArticle(id: number, data: Partial<{ slug: string; title: string; content: string; excerpt: string; author: string; categoryId: number; tags: string; status: string; publishedAt: Date }>) {
  if (!id || id < 1) return false;
  return dbUpdateArticle(id, data as any);
}

export async function deleteArticle(id: number) {
  if (!id || id < 1) return false;
  return dbDeleteArticle(id);
}

// ── Categories ──

export async function listCategories() {
  return dbListCategories();
}

export async function getCategory(id: number) {
  if (!id || id < 1) return null;
  return dbGetCategory(id);
}

export async function createCategory(data: { name: string; slug: string; description?: string }) {
  if (!data.name?.trim() || !data.slug?.trim()) return null;
  return dbCreateCategory(data as any);
}

export async function updateCategory(id: number, data: Partial<{ name: string; slug: string; description: string }>) {
  if (!id || id < 1) return false;
  return dbUpdateCategory(id, data as any);
}

export async function deleteCategory(id: number) {
  if (!id || id < 1) return false;
  return dbDeleteCategory(id);
}

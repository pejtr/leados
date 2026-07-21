import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  listPages,
  getPage,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
  listArticles,
  getArticle,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../db";

const pageCreateSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
});

const pageUpdateSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
});

const articleCreateSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  tags: z.string().optional(),
  status: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
});

const articleUpdateSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  tags: z.string().optional(),
  status: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
});

const categoryCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
});

const categoryUpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const cmsRouter = router({
  pages: router({
    list: protectedProcedure.query(async () => listPages()),

    getById: protectedProcedure
      .input(z.number().int().positive())
      .query(async ({ input }) => getPage(input)),

    getBySlug: protectedProcedure
      .input(z.string().min(1))
      .query(async ({ input }) => getPageBySlug(input)),

    create: protectedProcedure
      .input(pageCreateSchema)
      .mutation(async ({ input }) => {
        const id = await createPage({
          slug: input.slug,
          title: input.title,
          content: input.content,
          metaTitle: input.metaTitle,
          metaDescription: input.metaDescription,
          status: input.status,
          publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined,
        });
        return { id, status: "created" };
      }),

    update: protectedProcedure
      .input(pageUpdateSchema)
      .mutation(async ({ input }) => {
        const { id, publishedAt, ...rest } = input;
        const success = await updatePage(id, {
          ...rest,
          publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        });
        return { success };
      }),

    delete: protectedProcedure
      .input(z.number().int().positive())
      .mutation(async ({ input }) => {
        const success = await deletePage(input);
        return { success };
      }),
  }),

  articles: router({
    list: protectedProcedure.query(async () => listArticles()),

    getById: protectedProcedure
      .input(z.number().int().positive())
      .query(async ({ input }) => getArticle(input)),

    getBySlug: protectedProcedure
      .input(z.string().min(1))
      .query(async ({ input }) => getArticleBySlug(input)),

    create: protectedProcedure
      .input(articleCreateSchema)
      .mutation(async ({ input }) => {
        const id = await createArticle({
          slug: input.slug,
          title: input.title,
          content: input.content,
          excerpt: input.excerpt,
          author: input.author,
          categoryId: input.categoryId,
          tags: input.tags,
          status: input.status,
          publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined,
        });
        return { id, status: "created" };
      }),

    update: protectedProcedure
      .input(articleUpdateSchema)
      .mutation(async ({ input }) => {
        const { id, publishedAt, ...rest } = input;
        const success = await updateArticle(id, {
          ...rest,
          publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        });
        return { success };
      }),

    delete: protectedProcedure
      .input(z.number().int().positive())
      .mutation(async ({ input }) => {
        const success = await deleteArticle(input);
        return { success };
      }),
  }),

  categories: router({
    list: protectedProcedure.query(async () => listCategories()),

    getById: protectedProcedure
      .input(z.number().int().positive())
      .query(async ({ input }) => getCategory(input)),

    create: protectedProcedure
      .input(categoryCreateSchema)
      .mutation(async ({ input }) => {
        const id = await createCategory(input);
        return { id, status: "created" };
      }),

    update: protectedProcedure
      .input(categoryUpdateSchema)
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const success = await updateCategory(id, rest);
        return { success };
      }),

    delete: protectedProcedure
      .input(z.number().int().positive())
      .mutation(async ({ input }) => {
        const success = await deleteCategory(input);
        return { success };
      }),
  }),
});

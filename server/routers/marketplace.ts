import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  getProduct,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getCatalogStats,
} from "../db/marketplace";
import {
  calculateProductPrice,
  checkInventory,
  validateOrder,
} from "../marketplace";

export const marketplaceRouter = router({
  categories: router({
    list: protectedProcedure.query(async () => {
      return listCategories();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        return getCategory(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          parentId: z.number().int().optional(),
          imageUrl: z.string().optional(),
          sortOrder: z.number().int().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createCategory(input);
        return { id, status: "created" };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          description: z.string().optional(),
          parentId: z.number().int().optional(),
          imageUrl: z.string().optional(),
          sortOrder: z.number().int().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const success = await updateCategory(id, data);
        return { success };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const success = await deleteCategory(input.id);
        return { success };
      }),
  }),

  products: router({
    list: protectedProcedure.query(async () => {
      return listProducts();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        return getProduct(input.id);
      }),

    getBySku: protectedProcedure
      .input(z.object({ sku: z.string().min(1) }))
      .query(async ({ input }) => {
        return getProductBySku(input.sku);
      }),

    create: protectedProcedure
      .input(
        z.object({
          sku: z.string().min(1),
          name: z.string().min(1),
          description: z.string().optional(),
          price: z.number().int(),
          comparePrice: z.number().int().optional(),
          cost: z.number().int().optional(),
          inventory: z.number().int().optional(),
          categoryId: z.number().int().optional(),
          status: z.string().optional(),
          images: z.string().optional(),
          variants: z.string().optional(),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createProduct(input);
        return { id, status: "created" };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          sku: z.string().min(1).optional(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          price: z.number().int().optional(),
          comparePrice: z.number().int().optional(),
          cost: z.number().int().optional(),
          inventory: z.number().int().optional(),
          categoryId: z.number().int().optional(),
          status: z.string().optional(),
          images: z.string().optional(),
          variants: z.string().optional(),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const success = await updateProduct(id, data);
        return { success };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const success = await deleteProduct(input.id);
        return { success };
      }),
  }),

  orders: router({
    list: protectedProcedure.query(async () => {
      return listOrders();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        return getOrder(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          productId: z.number().int(),
          quantity: z.number().int().default(1),
          unitPrice: z.number().int(),
          total: z.number().int(),
          status: z.string().optional(),
          customerName: z.string().optional(),
          customerEmail: z.string().optional(),
          customerPhone: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createOrder(input);
        return { id, status: "created" };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          status: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const success = await updateOrderStatus(input.id, input.status);
        return { success };
      }),
  }),

  stats: protectedProcedure.query(async () => {
    return getCatalogStats();
  }),

  calculatePrice: protectedProcedure
    .input(
      z.object({
        cost: z.number().int().positive(),
        marginPercent: z.number().min(0).max(100),
      })
    )
    .query(async ({ input }) => {
      return calculateProductPrice(input.cost, input.marginPercent);
    }),

  checkStock: protectedProcedure
    .input(z.number().int().positive())
    .query(async ({ input }) => {
      return checkInventory(input);
    }),

  validateOrder: protectedProcedure
    .input(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      return validateOrder(input.productId, input.quantity);
    }),
});

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { ingestedLeads, connectedProjects } from "../../drizzle/schema";
import { eq, desc, and, like, count, sql } from "drizzle-orm";

export const ingestedLeadsRouter = router({
  // List ingested leads with optional source filter and pagination
  list: protectedProcedure
    .input(z.object({
      source: z.string().optional(),
      projectId: z.number().int().optional(),
      status: z.enum(["new", "contacted", "qualified", "disqualified"]).optional(),
      search: z.string().optional(),
      page: z.number().int().default(1),
      limit: z.number().int().max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify the projects belong to this user
      const userProjects = await db
        .select({ id: connectedProjects.id })
        .from(connectedProjects)
        .where(eq(connectedProjects.userId, ctx.user.id));
      const userProjectIds = userProjects.map(p => p.id);

      if (userProjectIds.length === 0) return { leads: [], total: 0, page: input.page };

      const conditions = [
        sql`${ingestedLeads.projectId} IN (${sql.join(userProjectIds.map(id => sql`${id}`), sql`, `)})`,
      ];
      if (input.status) conditions.push(eq(ingestedLeads.status, input.status));
      if (input.projectId) conditions.push(eq(ingestedLeads.projectId, input.projectId));
      if (input.source) conditions.push(like(ingestedLeads.source, `%${input.source}%`));
      if (input.search) {
        conditions.push(
          sql`(${ingestedLeads.email} LIKE ${`%${input.search}%`} OR ${ingestedLeads.name} LIKE ${`%${input.search}%`})`
        );
      }

      const offset = (input.page - 1) * input.limit;
      const where = and(...conditions);

      const [leads, [{ total }]] = await Promise.all([
        db.select().from(ingestedLeads).where(where)
          .orderBy(desc(ingestedLeads.createdAt))
          .limit(input.limit).offset(offset),
        db.select({ total: count() }).from(ingestedLeads).where(where),
      ]);

      return { leads, total: Number(total), page: input.page };
    }),

  // Stats grouped by source/project
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const userProjects = await db
        .select({ id: connectedProjects.id, name: connectedProjects.name, url: connectedProjects.url })
        .from(connectedProjects)
        .where(eq(connectedProjects.userId, ctx.user.id));
      const userProjectIds = userProjects.map(p => p.id);

      if (userProjectIds.length === 0) return { bySource: [], total: 0 };

      const bySource = await db
        .select({
          projectId: ingestedLeads.projectId,
          projectName: ingestedLeads.projectName,
          total: count(),
          newCount: sql<number>`SUM(CASE WHEN ${ingestedLeads.status} = 'new' THEN 1 ELSE 0 END)`,
          qualifiedCount: sql<number>`SUM(CASE WHEN ${ingestedLeads.status} = 'qualified' THEN 1 ELSE 0 END)`,
        })
        .from(ingestedLeads)
        .where(sql`${ingestedLeads.projectId} IN (${sql.join(userProjectIds.map(id => sql`${id}`), sql`, `)})`)
        .groupBy(ingestedLeads.projectId, ingestedLeads.projectName)
        .orderBy(desc(count()));

      const [{ total }] = await db
        .select({ total: count() })
        .from(ingestedLeads)
        .where(sql`${ingestedLeads.projectId} IN (${sql.join(userProjectIds.map(id => sql`${id}`), sql`, `)})`);

      return { bySource, total: Number(total), projects: userProjects };
    }),

  // Update lead status
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      status: z.enum(["new", "contacted", "qualified", "disqualified"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify ownership via project
      const [lead] = await db.select({ projectId: ingestedLeads.projectId })
        .from(ingestedLeads).where(eq(ingestedLeads.id, input.id));
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });

      const [project] = await db.select({ id: connectedProjects.id })
        .from(connectedProjects)
        .where(and(eq(connectedProjects.id, lead.projectId!), eq(connectedProjects.userId, ctx.user.id)));
      if (!project) throw new TRPCError({ code: "FORBIDDEN" });

      await db.update(ingestedLeads).set({
        status: input.status,
        notes: input.notes,
        updatedAt: Date.now(),
      }).where(eq(ingestedLeads.id, input.id));

      return { success: true };
    }),

  // Delete a lead
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [lead] = await db.select({ projectId: ingestedLeads.projectId })
        .from(ingestedLeads).where(eq(ingestedLeads.id, input.id));
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });

      const [project] = await db.select({ id: connectedProjects.id })
        .from(connectedProjects)
        .where(and(eq(connectedProjects.id, lead.projectId!), eq(connectedProjects.userId, ctx.user.id)));
      if (!project) throw new TRPCError({ code: "FORBIDDEN" });

      await db.delete(ingestedLeads).where(eq(ingestedLeads.id, input.id));
      return { success: true };
    }),
});

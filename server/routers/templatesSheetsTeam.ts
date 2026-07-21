import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getLeadsByIds,
  getLeadsBySession,
  getLeads,
  getTeamMembers,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from "../db";
import { exportLeadsToSheet, extractSpreadsheetId } from "../googleSheets";

// ── Email Templates ───────────────────────────────────────────
export const templatesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getEmailTemplates(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      subject: z.string().min(1).max(256),
      body: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await createEmailTemplate({ userId: ctx.user.id, ...input });
      return { success: true, id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      name: z.string().min(1).max(128).optional(),
      subject: z.string().min(1).max(256).optional(),
      body: z.string().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateEmailTemplate(id, ctx.user.id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteEmailTemplate(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ── Google Sheets Export ─────────────────────────────────────────
export const sheetsRouter = router({
  // Returns the service account email users must share their sheet with
  serviceEmail: publicProcedure.query(() => {
    const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!json) return null;
    try {
      const parsed = JSON.parse(json);
      return parsed.client_email as string;
    } catch {
      return null;
    }
  }),

  export: protectedProcedure
    .input(z.object({
      spreadsheetUrl: z.string().min(1),
      sheetName: z.string().default("Leads"),
      leadIds: z.array(z.number().int()).optional(),
      sessionId: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const spreadsheetId = extractSpreadsheetId(input.spreadsheetUrl);
      // Get leads to export
      let leadsToExport: any[];
      if (input.leadIds && input.leadIds.length > 0) {
        leadsToExport = await getLeadsByIds(input.leadIds, ctx.user.id);
      } else if (input.sessionId) {
        leadsToExport = await getLeadsBySession(input.sessionId);
      } else {
        const result = await getLeads({ userId: ctx.user.id, limit: 1000, offset: 0 });
        leadsToExport = result.items ?? [];
      }
      if (leadsToExport.length === 0) {
        throw new Error("No leads found to export");
      }
      const sheetLeads = leadsToExport.map((l: any) => ({
        companyName: l.companyName ?? "",
        email: l.email ?? "",
        website: l.website ?? "",
        industry: l.industry ?? "",
        location: l.location ?? "",
        companySize: l.companySize ?? "",
        seniorityLevel: l.seniorityLevel ?? "",
        icebreaker: l.icebreaker ?? "",
        status: l.status ?? "new",
        qualityRating: l.qualityRating ?? "",
        dealValue: l.dealValue ?? null,
        dataSource: l.dataSource ?? "mock",
        createdAt: l.createdAt,
      }));
      return exportLeadsToSheet(spreadsheetId, input.sheetName, sheetLeads);
    }),
});

// ── Team Management ────────────────────────────────────────────────
export const teamRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getTeamMembers(ctx.user.id);
  }),

  invite: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(["admin", "agent", "viewer"]).default("agent"),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await addTeamMember({
        ownerId: ctx.user.id,
        email: input.email,
        role: input.role,
        status: "pending",
      });
      return { success: true, id };
    }),

  updateRole: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      role: z.enum(["admin", "agent", "viewer"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateTeamMemberRole(input.id, ctx.user.id, input.role);
      return { success: true };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await removeTeamMember(input.id, ctx.user.id);
      return { success: true };
    }),
});

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { aiConstitutions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ── Input schema ──────────────────────────────────────────────────────────────
const constitutionSchema = z.object({
  // Company identity
  companyName: z.string().max(255).optional(),
  companyDescription: z.string().optional(),
  industry: z.string().max(128).optional(),
  companySize: z.string().max(64).optional(),
  website: z.string().max(255).optional(),
  // ICP
  icpIndustries: z.string().optional(),       // JSON array string
  icpCompanySize: z.string().max(64).optional(),
  icpSeniority: z.string().max(128).optional(),
  icpGeography: z.string().max(255).optional(),
  icpPainPoints: z.string().optional(),
  icpBuyingTriggers: z.string().optional(),
  // Value proposition
  uniqueValueProp: z.string().optional(),
  topCompetitors: z.string().optional(),      // JSON array string
  differentiators: z.string().optional(),
  // Communication style
  communicationTone: z.enum(["professional", "casual", "bold", "empathetic"]).optional(),
  languageStyle: z.enum(["direct", "storytelling", "data-driven", "consultative"]).optional(),
  forbiddenWords: z.string().optional(),
  // Goals
  primaryGoal: z.string().max(128).optional(),
  monthlyLeadTarget: z.number().int().optional(),
  avgDealValue: z.number().int().optional(),
  salesCycleLength: z.string().max(64).optional(),
  // Custom
  customContext: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const constitutionRouter = router({
  // ── Get current user's constitution ──────────────────────────────────────
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = String(ctx.user.id);
    const db = await getDb();
    const rows = await db
      .select()
      .from(aiConstitutions)
      .where(eq(aiConstitutions.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  }),

  // ── Save (upsert) constitution ────────────────────────────────────────────
  save: protectedProcedure
    .input(constitutionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const now = Date.now();
      const db = await getDb();

      // Check if exists
      const existing = await db
        .select({ id: aiConstitutions.id })
        .from(aiConstitutions)
        .where(eq(aiConstitutions.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(aiConstitutions)
          .set({ ...input, updatedAt: now })
          .where(eq(aiConstitutions.userId, userId));
      } else {
        await db.insert(aiConstitutions).values({
          userId,
          ...input,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Return updated record
      const rows = await db
        .select()
        .from(aiConstitutions)
        .where(eq(aiConstitutions.userId, userId))
        .limit(1);
      return rows[0];
    }),
});

// ── Helper: build system prompt context from constitution ─────────────────────
// Call this from any AI procedure to inject company context into the LLM system prompt.
export async function getConstitutionContext(userId: string): Promise<string> {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(aiConstitutions)
      .where(eq(aiConstitutions.userId, userId))
      .limit(1);

    const c = rows[0];
    if (!c || !c.isActive) return "";

    const parts: string[] = ["## Company Context (AI Constitution)"];

    if (c.companyName) parts.push(`**Company:** ${c.companyName}`);
    if (c.industry) parts.push(`**Industry:** ${c.industry}`);
    if (c.companySize) parts.push(`**Company size:** ${c.companySize}`);
    if (c.website) parts.push(`**Website:** ${c.website}`);
    if (c.companyDescription) parts.push(`**About:** ${c.companyDescription}`);

    if (c.uniqueValueProp) parts.push(`\n**Unique Value Proposition:** ${c.uniqueValueProp}`);
    if (c.differentiators) parts.push(`**Key Differentiators:** ${c.differentiators}`);

    if (c.topCompetitors) {
      try {
        const competitors = JSON.parse(c.topCompetitors);
        if (Array.isArray(competitors) && competitors.length > 0) {
          parts.push(`**Top Competitors:** ${competitors.join(", ")}`);
        }
      } catch {
        if (c.topCompetitors.trim()) parts.push(`**Top Competitors:** ${c.topCompetitors}`);
      }
    }

    // ICP section
    const icpParts: string[] = [];
    if (c.icpIndustries) {
      try {
        const inds = JSON.parse(c.icpIndustries);
        if (Array.isArray(inds) && inds.length > 0) icpParts.push(`Industries: ${inds.join(", ")}`);
      } catch {
        if (c.icpIndustries.trim()) icpParts.push(`Industries: ${c.icpIndustries}`);
      }
    }
    if (c.icpCompanySize) icpParts.push(`Company size: ${c.icpCompanySize}`);
    if (c.icpSeniority) icpParts.push(`Seniority: ${c.icpSeniority}`);
    if (c.icpGeography) icpParts.push(`Geography: ${c.icpGeography}`);
    if (c.icpPainPoints) icpParts.push(`Pain points: ${c.icpPainPoints}`);
    if (c.icpBuyingTriggers) icpParts.push(`Buying triggers: ${c.icpBuyingTriggers}`);
    if (icpParts.length > 0) {
      parts.push(`\n**Ideal Customer Profile (ICP):**\n${icpParts.map(p => `- ${p}`).join("\n")}`);
    }

    // Communication style
    if (c.communicationTone || c.languageStyle) {
      parts.push(`\n**Communication Style:** Tone: ${c.communicationTone ?? "professional"}, Style: ${c.languageStyle ?? "direct"}`);
    }
    if (c.forbiddenWords) {
      parts.push(`**Avoid these words/phrases:** ${c.forbiddenWords}`);
    }

    // Goals
    const goalParts: string[] = [];
    if (c.primaryGoal) goalParts.push(`Primary goal: ${c.primaryGoal}`);
    if (c.monthlyLeadTarget) goalParts.push(`Monthly lead target: ${c.monthlyLeadTarget}`);
    if (c.avgDealValue) goalParts.push(`Average deal value: $${c.avgDealValue}`);
    if (c.salesCycleLength) goalParts.push(`Sales cycle: ${c.salesCycleLength}`);
    if (goalParts.length > 0) {
      parts.push(`\n**Business Goals:**\n${goalParts.map(p => `- ${p}`).join("\n")}`);
    }

    // Custom context
    if (c.customContext) {
      parts.push(`\n**Additional Instructions:**\n${c.customContext}`);
    }

    parts.push("\nAlways tailor your responses to align with this company context.");
    return parts.join("\n");
  } catch (err) {
    console.error("[Constitution] Error fetching context:", err);
    return "";
  }
}

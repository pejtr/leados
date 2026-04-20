import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { aiSkills } from "../../drizzle/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

const SKILL_CATEGORIES = ["general", "lead-gen", "outreach", "research", "sdr", "analysis", "content", "sop"] as const;
const SKILL_TYPES = ["prompt", "workflow", "template", "sop"] as const;

// Seed skills inspired by the AI OS video best practices
const SEED_SKILLS = [
  {
    title: "LinkedIn Icebreaker Generator",
    description: "Generates a personalized 1st sentence for cold outreach based on company context",
    category: "outreach",
    skillType: "prompt",
    content: `You are an expert B2B sales copywriter. Generate a highly personalized, non-generic icebreaker sentence for a cold LinkedIn message.

Company: {{company}}
Industry: {{industry}}
Contact Name: {{contactName}}
Company Description: {{companyDescription}}

Rules:
- Max 1 sentence, max 20 words
- Reference something specific about the company (not generic)
- Sound human, not AI-generated
- No emojis, no exclamation marks
- Czech or English based on company location`,
    variables: ["company", "industry", "contactName", "companyDescription"],
    tags: "linkedin,outreach,icebreaker,cold-email",
  },
  {
    title: "Daily Lead Audit",
    description: "Morning routine: review yesterday's leads, prioritize follow-ups, identify hot prospects",
    category: "sop",
    skillType: "sop",
    content: `# Daily Lead Audit SOP

## Step 1: Review New Leads (5 min)
- Open LeadOS → History
- Filter: created yesterday
- Check email enrichment status
- Flag leads with verified emails as priority

## Step 2: Pipeline Review (10 min)
- Open Kanban board
- Move stale leads (>3 days no action) to "Needs Attention"
- Identify leads in "Replied" status → schedule call

## Step 3: NBA Recommendations (5 min)
- Open Next Actions page
- Execute top 3 recommended actions
- Log outcomes in lead notes

## Step 4: SDR Campaign Check (5 min)
- Review active SDR campaigns
- Check reply rates
- Pause campaigns with <2% open rate

Total time: ~25 minutes`,
    variables: [],
    tags: "daily,audit,sop,morning-routine",
  },
  {
    title: "ICP Qualification Prompt",
    description: "AI prompt to score a lead against your Ideal Customer Profile",
    category: "lead-gen",
    skillType: "prompt",
    content: `You are a B2B sales qualification expert. Score this lead against our ICP and provide a detailed assessment.

Lead Data:
- Company: {{company}}
- Industry: {{industry}}
- Size: {{companySize}}
- Location: {{location}}
- Contact: {{contactName}}, {{seniorityLevel}}

Our ICP:
- Target industries: SaaS, FinTech, E-commerce, B2B Services
- Company size: 10-500 employees
- Decision maker: VP, Director, C-Level
- Geography: DACH, CEE, US

Respond with JSON:
{
  "score": 0-100,
  "fit": "high|medium|low",
  "reasoning": "2-3 sentences",
  "recommended_action": "immediate_outreach|nurture|disqualify",
  "red_flags": []
}`,
    variables: ["company", "industry", "companySize", "location", "contactName", "seniorityLevel"],
    tags: "icp,qualification,scoring",
  },
  {
    title: "n8n Webhook Payload Template",
    description: "Standard payload structure for sending leads to n8n automation workflows",
    category: "sop",
    skillType: "template",
    content: `{
  "event": "lead_qualified",
  "timestamp": "{{timestamp}}",
  "lead": {
    "id": "{{leadId}}",
    "company": "{{company}}",
    "email": "{{email}}",
    "contact": "{{contactName}}",
    "industry": "{{industry}}",
    "score": {{score}},
    "icebreaker": "{{icebreaker}}"
  },
  "action": {
    "type": "create_task",
    "assignee": "{{assignee}}",
    "due_date": "{{dueDate}}",
    "priority": "{{priority}}"
  },
  "source": "LeadOS",
  "security": {
    "mode": "draft_only",
    "requires_approval": true
  }
}`,
    variables: ["timestamp", "leadId", "company", "email", "contactName", "industry", "score", "icebreaker", "assignee", "dueDate", "priority"],
    tags: "n8n,webhook,automation,template",
  },
  {
    title: "Process Automation Feasibility Analyzer",
    description: "Analyzes a business process and determines if/how it can be automated with AI",
    category: "analysis",
    skillType: "prompt",
    content: `You are an AI automation consultant. Analyze this business process and determine automation feasibility.

Process Name: {{processName}}
Description: {{processDescription}}
Time per week (hours): {{hoursPerWeek}}
Current tools used: {{tools}}

Analyze and respond with JSON:
{
  "feasibility_score": 0-100,
  "roi_score": 0-100,
  "automation_type": "full|partial|human_in_loop",
  "recommended_tools": ["tool1", "tool2"],
  "implementation_effort": "low|medium|high",
  "estimated_time_saved_hours_monthly": number,
  "estimated_cost_savings_eur_monthly": number,
  "risks": ["risk1"],
  "first_step": "concrete first action to take"
}`,
    variables: ["processName", "processDescription", "hoursPerWeek", "tools"],
    tags: "automation,feasibility,roi,analysis",
  },
];

export const aiSkillsRouter = router({
  // List all skills (own + shared team skills)
  list: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      skillType: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(aiSkills)
        .where(
          or(
            eq(aiSkills.userId, ctx.user.id),
            eq(aiSkills.isShared, true)
          )
        )
        .orderBy(desc(aiSkills.usageCount), desc(aiSkills.createdAt));

      let filtered = rows;
      if (input?.category) filtered = filtered.filter(r => r.category === input.category);
      if (input?.skillType) filtered = filtered.filter(r => r.skillType === input.skillType);
      if (input?.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(r =>
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags?.toLowerCase().includes(q)
        );
      }
      return filtered;
    }),

  // Get single skill
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [skill] = await db.select().from(aiSkills).where(eq(aiSkills.id, input.id));
      if (!skill) throw new TRPCError({ code: "NOT_FOUND" });
      if (skill.userId !== ctx.user.id && !skill.isShared) throw new TRPCError({ code: "FORBIDDEN" });
      return skill;
    }),

  // Create new skill
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(256),
      description: z.string().optional(),
      category: z.enum(SKILL_CATEGORIES).default("general"),
      skillType: z.enum(SKILL_TYPES).default("prompt"),
      content: z.string().min(1),
      variables: z.array(z.string()).optional(),
      exampleInput: z.record(z.string()).optional(),
      tags: z.string().optional(),
      isShared: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const now = Date.now();
      const [result] = await db.insert(aiSkills).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        category: input.category,
        skillType: input.skillType,
        content: input.content,
        variables: input.variables,
        exampleInput: input.exampleInput,
        tags: input.tags,
        isShared: input.isShared,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      return { id: (result as any).insertId };
    }),

  // Update skill
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(256).optional(),
      description: z.string().optional(),
      category: z.enum(SKILL_CATEGORIES).optional(),
      skillType: z.enum(SKILL_TYPES).optional(),
      content: z.string().min(1).optional(),
      variables: z.array(z.string()).optional(),
      exampleInput: z.record(z.string()).optional(),
      tags: z.string().optional(),
      isShared: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [skill] = await db.select().from(aiSkills).where(eq(aiSkills.id, input.id));
      if (!skill || skill.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...updates } = input;
      await db.update(aiSkills).set({ ...updates, updatedAt: Date.now() }).where(eq(aiSkills.id, id));
      return { ok: true };
    }),

  // Delete skill
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [skill] = await db.select().from(aiSkills).where(eq(aiSkills.id, input.id));
      if (!skill || skill.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(aiSkills).where(eq(aiSkills.id, input.id));
      return { ok: true };
    }),

  // Execute a skill with variables filled in — runs through LLM
  execute: protectedProcedure
    .input(z.object({
      id: z.number(),
      variables: z.record(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [skill] = await db.select().from(aiSkills).where(eq(aiSkills.id, input.id));
      if (!skill) throw new TRPCError({ code: "NOT_FOUND" });
      if (skill.userId !== ctx.user.id && !skill.isShared) throw new TRPCError({ code: "FORBIDDEN" });

      // Fill in variables
      let prompt = skill.content;
      if (input.variables) {
        for (const [key, val] of Object.entries(input.variables)) {
          prompt = prompt.replaceAll(`{{${key}}}`, val);
        }
      }

      // Only run LLM for prompt/workflow types; template/sop just return filled content
      let result = prompt;
      if (skill.skillType === "prompt" || skill.skillType === "workflow") {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a helpful AI assistant for B2B lead generation and sales automation." },
            { role: "user", content: prompt },
          ],
        });
        result = response.choices?.[0]?.message?.content || prompt;
      }

      // Increment usage count
      await db.update(aiSkills).set({
        usageCount: sql`${aiSkills.usageCount} + 1`,
        lastUsedAt: Date.now(),
        updatedAt: Date.now(),
      }).where(eq(aiSkills.id, input.id));

      return { result, skillTitle: skill.title };
    }),

  // Seed default skills for new user
  seedDefaults: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Check if user already has skills
      const existing = await db.select({ id: aiSkills.id }).from(aiSkills).where(eq(aiSkills.userId, ctx.user.id));
      if (existing.length > 0) return { seeded: 0, message: "Skills already exist" };

      const now = Date.now();
      for (const seed of SEED_SKILLS) {
        await db.insert(aiSkills).values({
          userId: ctx.user.id,
          title: seed.title,
          description: seed.description,
          category: seed.category as any,
          skillType: seed.skillType as any,
          content: seed.content,
          variables: seed.variables,
          tags: seed.tags,
          isShared: true,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
      return { seeded: SEED_SKILLS.length };
    }),

  // Categories summary
  categories: protectedProcedure.query(async ({ ctx }) => {
    return SKILL_CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1).replace("-", " ") }));
  }),
});

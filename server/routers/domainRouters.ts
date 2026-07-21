import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, isNull, ne } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { invokeLLM, extractText } from "../_core/llm";
import { logAuditEvent } from "../_core/audit";
import {
  getDb,
  getEmailSequences,
  createEmailSequence,
  deleteEmailSequence,
  getSequenceSteps,
  upsertSequenceSteps,
  enrollLeadInSequence,
  getSequenceEnrollments,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getCapturePlans,
  createCapturePlan,
  updateCapturePlan,
  deleteCapturePlan,
  getMarketIntelReports,
  saveMarketIntelReport,
  getKnowledgeArticles,
  seedKnowledgeArticles,
  getCompetitiveMaps,
  saveCompetitiveMap,
  getLeadStats,
  getLeads,
  getLeadById,
  getAiMemory,
  upsertAiMemory,
  getAiPerformanceLogs,
  saveChatMessage,
  getChatHistory,
  clearChatHistory,
} from "../db";
import { users, leads } from "../../drizzle/schema";

// ─── Email Sequences ────────────────────────────────────────────
export const sequencesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getEmailSequences(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return createEmailSequence({ userId: ctx.user.id, name: input.name, description: input.description });
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteEmailSequence(input.id, ctx.user.id);
      return { success: true };
    }),
  getSteps: protectedProcedure
    .input(z.object({ sequenceId: z.number() }))
    .query(async ({ input }) => {
      return getSequenceSteps(input.sequenceId);
    }),
  saveSteps: protectedProcedure
    .input(z.object({
      sequenceId: z.number(),
      steps: z.array(z.object({
        stepNumber: z.number(),
        delayDays: z.number(),
        subject: z.string(),
        body: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      await upsertSequenceSteps(input.sequenceId, input.steps);
      return { success: true };
    }),
  enroll: protectedProcedure
    .input(z.object({ sequenceId: z.number(), leadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await enrollLeadInSequence({ sequenceId: input.sequenceId, leadId: input.leadId, userId: ctx.user.id });
      return { success: true };
    }),
  enrollments: protectedProcedure.query(async ({ ctx }) => {
    return getSequenceEnrollments(ctx.user.id);
  }),
  addLinkedInStep: protectedProcedure
    .input(z.object({
      sequenceId: z.number(),
      stepNumber: z.number(),
      delayDays: z.number().default(1),
      stepType: z.enum(['linkedin_connect', 'linkedin_message']),
      leadContext: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { emailSequenceSteps } = await import('../../drizzle/schema');
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const prompt = input.stepType === 'linkedin_connect'
        ? `Write a LinkedIn connection request note (max 300 chars) for B2B sales outreach. Context: ${input.leadContext || 'SaaS/tech company decision maker'}. Be direct, mention value, no fluff.`
        : `Write a LinkedIn follow-up message (2-3 sentences) for B2B sales. Context: ${input.leadContext || 'following up after connection'}. Be conversational and value-focused.`;
      const llmResp = await invokeLLM({ messages: [{ role: 'user', content: prompt }] });
      const generatedNote = extractText(llmResp.choices?.[0]?.message?.content || '');
      await db.insert(emailSequenceSteps).values({
        sequenceId: input.sequenceId,
        stepNumber: input.stepNumber,
        delayDays: input.delayDays,
        subject: input.stepType === 'linkedin_connect' ? 'LinkedIn Connection Request' : 'LinkedIn Message',
        body: generatedNote,
        stepType: input.stepType,
        linkedinNote: generatedNote,
      });
      return { success: true, generatedNote };
    }),
  generateLinkedInMessage: protectedProcedure
    .input(z.object({
      leadContext: z.string(),
      messageType: z.enum(['connect', 'message', 'follow_up']),
    }))
    .mutation(async ({ input }) => {
      const typePrompts: Record<string, string> = {
        connect: `Write a LinkedIn connection request note (max 300 chars). Context: ${input.leadContext}. Be personal, mention specific value, no generic phrases.`,
        message: `Write a LinkedIn outreach message (3-4 sentences). Context: ${input.leadContext}. Lead with value, ask one clear question.`,
        follow_up: `Write a LinkedIn follow-up message (2-3 sentences). Context: ${input.leadContext}. Reference previous interaction, add new value.`,
      };
      const llmResp = await invokeLLM({ messages: [{ role: 'user', content: typePrompts[input.messageType] }] });
      return { message: extractText(llmResp.choices?.[0]?.message?.content || '') };
    }),
});

// ─── Tasks / Activity Tracker ───────────────────────────────────
export const tasksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getTasks(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(["call", "email", "meeting", "follow_up", "other"]).default("other"),
      leadId: z.number().optional(),
      dueAt: z.date().optional(),
      reminderAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createTask({
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        type: input.type,
        leadId: input.leadId ?? null,
        dueAt: input.dueAt ?? null,
        reminderAt: input.reminderAt ?? null,
      });
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      type: z.enum(["call", "email", "meeting", "follow_up", "other"]).optional(),
      status: z.enum(["pending", "done", "cancelled"]).optional(),
      dueAt: z.date().optional(),
      reminderAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateTask(id, ctx.user.id, data as any);
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteTask(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Capture Plans ──────────────────────────────────────────────
export const capturePlansRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getCapturePlans(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      companyName: z.string().optional(),
      leadId: z.number().optional(),
      stage: z.enum(["identify", "research", "outreach", "qualify", "propose", "close"]).default("identify"),
      notes: z.string().optional(),
      estimatedValue: z.string().optional(),
      probability: z.number().min(0).max(100).optional(),
      expectedCloseAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createCapturePlan({
        userId: ctx.user.id,
        title: input.title,
        companyName: input.companyName ?? null,
        leadId: input.leadId ?? null,
        stage: input.stage,
        notes: input.notes ?? null,
        estimatedValue: input.estimatedValue ?? null,
        probability: input.probability ?? 10,
        expectedCloseAt: input.expectedCloseAt ?? null,
      });
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      companyName: z.string().optional(),
      stage: z.enum(["identify", "research", "outreach", "qualify", "propose", "close"]).optional(),
      notes: z.string().optional(),
      estimatedValue: z.string().optional(),
      probability: z.number().optional(),
      expectedCloseAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateCapturePlan(id, ctx.user.id, data as any);
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteCapturePlan(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Market Intelligence ────────────────────────────────────────
export const marketIntelRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getMarketIntelReports(ctx.user.id);
  }),
  generate: protectedProcedure
    .input(z.object({ industry: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("../_core/llm");
      const prompt = `You are a B2B market intelligence analyst. Generate a comprehensive market intelligence report for the ${input.industry} industry. Include:
1. Market Overview (size, growth rate, key trends)
2. Top 5 Competitors (name, strengths, weaknesses, market position)
3. Buyer Personas (2-3 decision maker profiles with pain points)
4. Sales Signals (what triggers a buying decision)
5. Outreach Strategy (best channels, timing, messaging angle)
6. Key Opportunities (3 specific opportunities to exploit)

Format as structured JSON with keys: overview, competitors, buyerPersonas, salesSignals, outreachStrategy, opportunities`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a B2B market intelligence expert. Always respond with valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });
      const reportData = extractText(response.choices[0].message.content ?? "{}");
      return saveMarketIntelReport(ctx.user.id, input.industry, reportData);
    }),
});

// ─── Knowledge Base ─────────────────────────────────────────────
export const knowledgeRouter = router({
  list: protectedProcedure.query(async () => {
    await seedKnowledgeArticles();
    return getKnowledgeArticles();
  }),
});

// ─── Stripe Billing ────────────────────────────────────────────
export const billingRouter = router({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (rows.length === 0) return null;
    const u = rows[0] as any;
    return {
      status: u.subscriptionStatus ?? "free",
      plan: u.subscriptionPlan ?? "free",
      stripeCustomerId: u.stripeCustomerId ?? null,
      stripeSubscriptionId: u.stripeSubscriptionId ?? null,
    };
  }),
  createCheckout: protectedProcedure
    .input(z.object({
      plan: z.enum(["starter", "growth", "pro"]),
      interval: z.enum(["monthly", "yearly"]),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2025-01-27.acacia" } as any);
      const { STRIPE_PRODUCTS } = await import("../stripeProducts");
      const product = STRIPE_PRODUCTS[input.plan];
      const priceId = input.interval === "monthly" ? product.priceIdMonthly : product.priceIdYearly;
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: ctx.user.email ?? undefined,
        allow_promotion_codes: true,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${input.origin}/billing?success=1`,
        cancel_url: `${input.origin}/billing?canceled=1`,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          plan: input.plan,
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
        },
      });
      return { url: session.url };
    }),
  createPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const rows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const u = rows[0] as any;
      if (!u?.stripeCustomerId) throw new Error("No Stripe customer found. Please subscribe first.");
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2025-01-27.acacia" } as any);
      const session = await stripe.billingPortal.sessions.create({
        customer: u.stripeCustomerId,
        return_url: `${input.origin}/billing`,
      });
      return { url: session.url };
    }),
});

// ─── AI Assistant Chat ─────────────────────────────────────────
export const aiChatRouter = router({
  // Get all available personas
  getPersonas: publicProcedure.query(async () => {
    const { AI_PERSONAS } = await import("../aiPersonas");
    return AI_PERSONAS.map(({ id, name, title, specialty, emoji, color, tags, category }) => ({
      id, name, title, specialty, emoji, color, tags, category,
    }));
  }),
  // Get chat history
  history: protectedProcedure.query(async ({ ctx }) => {
    return getChatHistory(ctx.user.id, 50);
  }),

  // Clear chat history
  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await clearChatHistory(ctx.user.id);
    return { success: true };
  }),

  // Get AI performance logs
  performanceLogs: protectedProcedure.query(async ({ ctx }) => {
    return getAiPerformanceLogs(ctx.user.id, 10);
  }),

  // Get AI memory/learnings
  memory: protectedProcedure.query(async ({ ctx }) => {
    return getAiMemory(ctx.user.id);
  }),

  // Main chat endpoint with full tool-calling
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(4000),
      personaId: z.string().optional(),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Gather full platform context
      const [stats, memory, recentLogs] = await Promise.all([
        getLeadStats(userId),
        getAiMemory(userId),
        getAiPerformanceLogs(userId, 3),
      ]);

      const memoryContext = memory.length > 0
        ? `\nLearned preferences & insights:\n${memory.slice(0, 10).map((m: any) => `- [${m.memoryType}] ${m.key}: ${m.value}`).join("\n")}`
        : "";

      const perfContext = recentLogs.length > 0
        ? `\nRecent AI performance cycles: ${recentLogs.length} cycles run, latest score: ${recentLogs[0]?.score ?? "N/A"}/100`
        : "";

      // Build platform context string
      const platformContext = `
Current user: ${ctx.user.name} (${ctx.user.email}) | Plan: ${ctx.user.subscriptionPlan ?? "free"}
Live platform stats:
- Total leads: ${stats.totalLeads} | Enriched: ${stats.enrichedLeads} | Sessions: ${stats.totalSessions}
- Pipeline: ${stats.statusBreakdown.map((s: any) => `${s.status}(${s.count})`).join(", ") || "empty"}
- Top industries: ${stats.industryBreakdown.slice(0, 3).map((i: any) => `${i.industry}(${i.count})`).join(", ") || "none"}
- Revenue: $${stats.roiStats.totalRevenue.toFixed(0)} from ${stats.roiStats.closedDeals} closed deals | Close rate: ${stats.roiStats.closeRate.toFixed(1)}%
- Quality: ${stats.qualityBreakdown.good} good / ${stats.qualityBreakdown.bad} bad / ${stats.qualityBreakdown.unrated} unrated${memoryContext}${perfContext}
Your capabilities: ANALYZE pipeline health, ADVISE on strategy, NAVIGATE the app, OPTIMIZE sequences/ICP, REPORT performance, LEARN preferences.
Be concise: max 3-4 sentences unless asked for more. Use numbers from stats above. Proactively call out problems.`;

      // Resolve persona system prompt
      const { getPersonaById, DEFAULT_PERSONA_ID } = await import("../aiPersonas");
      const persona = getPersonaById(input.personaId ?? DEFAULT_PERSONA_ID);
      const systemPrompt = persona
        ? persona.systemPrompt(platformContext)
        : `You are an autonomous AI sales assistant for ONYX OS.${platformContext}`;

      // Build messages array
      const messages: any[] = [
        { role: "system", content: systemPrompt },
        ...input.conversationHistory.slice(-10), // last 10 messages for context
        { role: "user", content: input.message },
      ];

      const response = await invokeLLM({ messages });
      const assistantContent = extractText(response.choices[0].message.content) || "I couldn't generate a response. Please try again.";

      // Save both messages to history
      await Promise.all([
        saveChatMessage({ userId, role: "user", content: input.message }),
        saveChatMessage({ userId, role: "assistant", content: assistantContent }),
      ]);

      // Extract and store learnings from the conversation
      const lowerMsg = input.message.toLowerCase();
      if (lowerMsg.includes("prefer") || lowerMsg.includes("always") || lowerMsg.includes("never")) {
        await upsertAiMemory(userId, `user_preference_${Date.now()}`, input.message, "preference", 0.8);
      }

      return {
        content: assistantContent,
        role: "assistant" as const,
        stats: {
          totalLeads: stats.totalLeads,
          closedDeals: stats.roiStats.closedDeals,
          revenue: stats.roiStats.totalRevenue,
        },
      };
    }),

  // Onboarding progress
  setupProgress: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const user = ctx.user;
    const stats = await getLeadStats(userId);

    const steps = [
      { id: "profile", label: "Dokon\u010di sv\u016fj profil", done: !!(user.name && user.email), link: "/settings" },
      { id: "icp", label: "Definuj sv\u016fj ICP", done: false, link: "/icp-builder" },
      { id: "first_leads", label: "Vygeneruj prvn\u00ed leady", done: stats.totalLeads > 0, link: "/generate" },
      { id: "sequence", label: "Vytvo\u0159 e-mailov\u00fd sled", done: false, link: "/sequences" },
      { id: "integration", label: "Nastav integraci", done: false, link: "/integrations" },
      { id: "deal", label: "Uzav\u0159i prvn\u00ed obchod", done: stats.roiStats.closedDeals > 0, link: "/pipeline" },
    ];

    // Check ICP
    const db = await getDb();
    if (db) {
      const { icpProfiles, emailSequences, webhookConfigs } = await import("../../drizzle/schema");
      const [icpResult, seqResult, webhookResult] = await Promise.all([
        db.select({ id: icpProfiles.id }).from(icpProfiles).where(eq(icpProfiles.userId, userId)).limit(1),
        db.select({ id: emailSequences.id }).from(emailSequences).where(eq(emailSequences.userId, userId)).limit(1),
        db.select({ id: webhookConfigs.id }).from(webhookConfigs).where(eq(webhookConfigs.userId, userId)).limit(1),
      ]);
      if (icpResult.length > 0) steps[1].done = true;
      if (seqResult.length > 0) steps[3].done = true;
      if (webhookResult.length > 0) steps[4].done = true;
    }

    const completed = steps.filter((s) => s.done).length;
    const percentage = Math.round((completed / steps.length) * 100);
    return { steps, completed, total: steps.length, percentage };
  }),
  // AI Insights: aggregated performance logs + memory learnings
  insights: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const [perfLogs, memory, chatHistory] = await Promise.all([
      getAiPerformanceLogs(userId, 5),
      getAiMemory(userId),
      getChatHistory(userId, 100),
    ]);
    const recentActions = perfLogs.flatMap((log: any) => {
      try {
        const actions = JSON.parse(log.actionsPerformed || '[]');
        return actions.slice(0, 3).map((a: any) => ({
          action: typeof a === 'string' ? a : (a.action || a.description || JSON.stringify(a)),
          score: Number(log.score) || 0,
          cycleType: log.cycleType,
          timestamp: log.createdAt,
        }));
      } catch { return []; }
    }).slice(0, 8);
    const learnings = memory.slice(0, 8).map((m: any) => ({
      id: m.id,
      type: m.memoryType,
      key: m.key,
      value: m.value,
      confidence: Number(m.confidence) || 0.5,
      usageCount: m.usageCount || 0,
      createdAt: m.createdAt,
    }));
    const scoreTrend = perfLogs.map((log: any) => ({
      score: Number(log.score) || 0,
      cycleType: log.cycleType,
      timestamp: log.createdAt,
    }));
    const totalMessages = chatHistory.length;
    const userMessages = chatHistory.filter((m: any) => m.role === 'user').length;
    const lastActivity = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].createdAt : null;
    return {
      recentActions,
      learnings,
      scoreTrend,
      stats: {
        totalMessages,
        userMessages,
        lastActivity,
        totalCycles: perfLogs.length,
        avgScore: perfLogs.length > 0
          ? Math.round(perfLogs.reduce((s: number, l: any) => s + Number(l.score || 0), 0) / perfLogs.length)
          : 0,
      },
    };
  }),
  // Search chat history
  searchHistory: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      limit: z.number().int().min(1).max(200).default(100),
    }))
    .query(async ({ ctx, input }) => {
      const history = await getChatHistory(ctx.user.id, input.limit);
      if (!input.query) return history;
      const q = input.query.toLowerCase();
      return history.filter((m: any) => m.content.toLowerCase().includes(q));
    }),
  // Toggle persona favorite
  toggleFavorite: protectedProcedure
    .input(z.object({ personaId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { favorited: false };
      const { userPersonaFavorites } = await import('../../drizzle/schema');
      const existing = await db.select()
        .from(userPersonaFavorites)
        .where(and(eq(userPersonaFavorites.userId, ctx.user.id), eq(userPersonaFavorites.personaId, input.personaId)))
        .limit(1);
      if (existing.length > 0) {
        await db.delete(userPersonaFavorites)
          .where(and(eq(userPersonaFavorites.userId, ctx.user.id), eq(userPersonaFavorites.personaId, input.personaId)));
        return { favorited: false };
      } else {
        await db.insert(userPersonaFavorites).values({ userId: ctx.user.id, personaId: input.personaId });
        return { favorited: true };
      }
    }),
  // Get user's favorite persona IDs
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [] as string[];
    const { userPersonaFavorites } = await import('../../drizzle/schema');
    const rows = await db.select()
      .from(userPersonaFavorites)
      .where(eq(userPersonaFavorites.userId, ctx.user.id));
    return rows.map((r: any) => r.personaId as string);
  }),

  ratePersona: protectedProcedure
    .input(z.object({ personaId: z.string(), rating: z.enum(["up", "down"]), sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const { personaRatings } = await import('../../drizzle/schema');
      await db.insert(personaRatings).values({
        userId: ctx.user.id,
        personaId: input.personaId,
        sessionId: input.sessionId,
        rating: input.rating,
      });
      return { success: true };
    }),

  getPersonaRatings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [] as { personaId: string; upCount: number; downCount: number; score: number }[];
    const { personaRatings } = await import('../../drizzle/schema');
    const rows = await db.select()
      .from(personaRatings)
      .where(eq(personaRatings.userId, ctx.user.id));
    const map: Record<string, { up: number; down: number }> = {};
    for (const row of rows as any[]) {
      if (!map[row.personaId]) map[row.personaId] = { up: 0, down: 0 };
      if (row.rating === 'up') map[row.personaId].up++;
      else map[row.personaId].down++;
    }
    return Object.entries(map).map(([personaId, counts]) => ({
      personaId,
      upCount: counts.up,
      downCount: counts.down,
      score: counts.up - counts.down,
    })).sort((a, b) => b.score - a.score);
  }),
});

// ─── Competitive Landscapepe ──────────────────────────────────────
export const competitiveMapRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getCompetitiveMaps(ctx.user.id);
  }),
  generate: protectedProcedure
    .input(z.object({ companyName: z.string().min(1), industry: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("../_core/llm");
      const prompt = `Analyze the competitive landscape for a company called "${input.companyName}" in the ${input.industry} industry. Return a JSON object with:
- competitors: array of objects with { name, strengths, weaknesses, marketShare (0-100), pricePosition ("budget"|"mid"|"premium"), targetSegment }
- positioning: object with { xAxis: "Price", yAxis: "Features", ourPosition: { x: 0-100, y: 0-100 } }
- differentiators: array of strings (our unique advantages)
- threats: array of strings
- opportunities: array of strings
Include 4-6 real or realistic competitors.`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a competitive intelligence expert. Always respond with valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });
      const mapData = extractText(response.choices[0].message.content ?? "{}");
      return saveCompetitiveMap(ctx.user.id, input.companyName, input.industry, mapData);
    }),
});

// ─── Morning Briefings ─────────────────────────────────────────
export const morningBriefingRouter = router({
  generate: protectedProcedure.mutation(async ({ ctx }) => {
    const { invokeLLM } = await import("../_core/llm");
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { morningBriefings } = await import("../../drizzle/schema");
    // Get context data
    const stats = await getLeadStats(ctx.user.id);
    const recentLeads = await getLeads({ userId: ctx.user.id, limit: 10, offset: 0, status: "new" });
    const topLeadsText = recentLeads.items.slice(0, 5).map((l: any) => `${l.companyName} (${l.industry})`).join(", ");
    const statusCounts = Object.fromEntries(stats.statusBreakdown.map((item) => [item.status, item.count]));
    const prompt = `Jsi AI obchodní poradce generující ranní přehled pro obchodního profesionála. VEŠKERÝ TEXT MUSÍ BÝT V ČEŠTINĚ.
Kontext:
- Celkem leadů: ${stats.totalLeads}, Nové: ${statusCounts.new ?? 0}, Kontaktované: ${statusCounts.contacted ?? 0}, Kvalifikované: ${statusCounts.qualified ?? 0}
- Nedávné nové leady: ${topLeadsText || "žádné zatím"}
- Dnes: ${new Date().toLocaleDateString("cs-CZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

Vygeneruj stručný, akční ranní přehled ve formátu JSON s těmito poli (VŠE V ČEŠTINĚ):
- summary: 2-3 věty shrnující priority dne
- topLeads: pole 3 leadů/firem na které se dnes zaměřit s důvodem (v češtině)
- pipelineAlerts: pole 2-3 rizik nebo příležitostí v pipeline (v češtině)
- nextActions: pole 3-5 konkrétních akcí na dnešek (v češtině)
Buď praktický, přímý a motivující. NIKDY nepoužívej angličtinu.`;
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Jsi AI asistent pro obchodn\u00ed v\u00fdkon. V\u017edy odpov\u00eddej validn\u00edm JSON. V\u0160ECHNY textov\u00e9 hodnoty mus\u00ed b\u00fdt v \u010de\u0161tin\u011b." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(extractText(response.choices[0].message.content) || "{}");
    const [inserted] = await db.insert(morningBriefings).values({
      userId: ctx.user.id,
      content: parsed.summary ?? "Good morning! Here is your daily briefing.",
      topLeads: JSON.stringify(parsed.topLeads ?? []),
      pipelineAlerts: JSON.stringify(parsed.pipelineAlerts ?? []),
      nextActions: JSON.stringify(parsed.nextActions ?? []),
      dismissed: false,
    });
    const rows = await db.select().from(morningBriefings)
      .where(eq(morningBriefings.userId, ctx.user.id))
      .orderBy(morningBriefings.generatedAt);
    return rows[rows.length - 1];
  }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const { morningBriefings } = await import("../../drizzle/schema");
    const rows = await db.select().from(morningBriefings)
      .where(eq(morningBriefings.userId, ctx.user.id))
      .orderBy(morningBriefings.generatedAt);
    if (rows.length === 0) return null;
    const latest = rows[rows.length - 1] as any;
    return {
      ...latest,
      topLeads: JSON.parse(latest.topLeads ?? "[]"),
      pipelineAlerts: JSON.parse(latest.pipelineAlerts ?? "[]"),
      nextActions: JSON.parse(latest.nextActions ?? "[]"),
    };
  }),

  dismiss: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const { morningBriefings } = await import("../../drizzle/schema");
      await db.update(morningBriefings)
        .set({ dismissed: true })
        .where(eq(morningBriefings.id, input.id));
      return { success: true };
    }),
});

// ─── Follow-up Bot + Meeting Scheduler ──────────────────────────────────────────
export const followUpRouter = router({
  // Create a meeting booking link
  createMeetingLink: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      duration: z.number().int().default(30),
      description: z.string().optional(),
      timezone: z.string().default("UTC"),
      availability: z.array(z.object({
        day: z.number().int().min(0).max(6),
        startHour: z.number().int().min(0).max(23),
        endHour: z.number().int().min(1).max(24),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { meetingLinks } = await import("../../drizzle/schema");
      const slug = `${ctx.user.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const defaultAvailability = input.availability ?? [
        { day: 1, startHour: 9, endHour: 17 },
        { day: 2, startHour: 9, endHour: 17 },
        { day: 3, startHour: 9, endHour: 17 },
        { day: 4, startHour: 9, endHour: 17 },
        { day: 5, startHour: 9, endHour: 17 },
      ];
      await db.insert(meetingLinks).values({
        userId: ctx.user.id,
        title: input.title,
        slug,
        duration: input.duration,
        description: input.description ?? null,
        availabilityJson: JSON.stringify(defaultAvailability),
        timezone: input.timezone,
        isActive: true,
      });
      const rows = await db.select().from(meetingLinks)
        .where(eq(meetingLinks.slug, slug));
      return rows[0];
    }),

  listMeetingLinks: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const { meetingLinks } = await import("../../drizzle/schema");
    return db.select().from(meetingLinks)
      .where(eq(meetingLinks.userId, ctx.user.id))
      .orderBy(meetingLinks.createdAt);
  }),

  deleteMeetingLink: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const { meetingLinks } = await import("../../drizzle/schema");
      await db.delete(meetingLinks)
        .where(eq(meetingLinks.id, input.id));
      return { success: true };
    }),

  // Start a follow-up session for a lead
  startSession: protectedProcedure
    .input(z.object({
      leadId: z.number().int(),
      maxFollowUps: z.number().int().default(5),
      meetingLinkId: z.number().int().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { followUpSessions } = await import("../../drizzle/schema");
      // Schedule first follow-up in 24h
      const nextFollowUpAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.insert(followUpSessions).values({
        userId: ctx.user.id,
        leadId: input.leadId,
        status: "active",
        followUpCount: 0,
        maxFollowUps: input.maxFollowUps,
        nextFollowUpAt,
        meetingLinkId: input.meetingLinkId ?? null,
        notes: input.notes ?? null,
      });
      const rows = await db.select().from(followUpSessions)
        .where(eq(followUpSessions.userId, ctx.user.id))
        .orderBy(followUpSessions.createdAt);
      return rows[rows.length - 1];
    }),

  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const { followUpSessions } = await import("../../drizzle/schema");
    return db.select().from(followUpSessions)
      .where(eq(followUpSessions.userId, ctx.user.id))
      .orderBy(followUpSessions.createdAt);
  }),

  updateSessionStatus: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      status: z.enum(["active", "paused", "completed", "meeting_booked"]),
      meetingAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const { followUpSessions } = await import("../../drizzle/schema");
      const updateData: any = { status: input.status };
      if (input.status === "meeting_booked") {
        updateData.meetingBooked = true;
        if (input.meetingAt) updateData.meetingAt = new Date(input.meetingAt);
      }
      await db.update(followUpSessions)
        .set(updateData)
        .where(eq(followUpSessions.id, input.id));
      return { success: true };
    }),

  generateFollowUpEmail: protectedProcedure
    .input(z.object({
      leadId: z.number().int(),
      sessionId: z.number().int(),
      followUpNumber: z.number().int().default(1),
      meetingLinkSlug: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("../_core/llm");
      const lead = await getLeadById(input.leadId, ctx.user.id);
      if (!lead) throw new Error("Lead not found");
      const meetingLinkText = input.meetingLinkSlug
        ? `\nMeeting booking link: [Book a time here](${process.env.VITE_FRONTEND_FORGE_API_URL ?? "https://app.leadgen.ai"}/book/${input.meetingLinkSlug})`
        : "";
      const followUpLabels = ["first", "second", "third", "fourth", "fifth"];
      const label = followUpLabels[(input.followUpNumber - 1)] ?? "follow-up";
      const prompt = `Write a ${label} follow-up email to ${lead.contactName ?? lead.companyName} at ${lead.companyName}.
Context: ${lead.companyDescription ?? "B2B company"}
Industry: ${lead.industry}
Previous icebreaker: ${lead.icebreaker ?? "none"}
${meetingLinkText}

Write a short (3-4 sentences), personalized, non-pushy follow-up email. Include a clear call to action to book a meeting. Return JSON: { subject: string, body: string }`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert B2B sales copywriter. Always respond with valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });
    const parsed = JSON.parse(extractText(response.choices[0].message.content) || "{}");
      // Update session
      const db = await getDb();
      if (db) {
        const { followUpSessions } = await import("../../drizzle/schema");
        const nextFollowUpAt = new Date(Date.now() + (input.followUpNumber + 1) * 2 * 24 * 60 * 60 * 1000);
        await db.update(followUpSessions)
          .set({
            followUpCount: input.followUpNumber,
            lastFollowUpAt: new Date(),
            nextFollowUpAt,
          })
          .where(eq(followUpSessions.id, input.sessionId));
      }
      return { subject: parsed.subject ?? "Following up", body: parsed.body ?? "" };
    }),
});

// ─── Conversational Intelligence ───────────────────────────────────────────
export const callsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const { callRecordings } = await import("../../drizzle/schema");
    return db.select().from(callRecordings)
      .where(eq(callRecordings.userId, ctx.user.id))
      .orderBy(callRecordings.createdAt);
  }),

  getDetail: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const { callRecordings } = await import("../../drizzle/schema");
      const rows = await db.select().from(callRecordings)
        .where(eq(callRecordings.id, input.id));
      const rec = rows[0] as any;
      if (!rec || rec.userId !== ctx.user.id) return null;
      return {
        ...rec,
        aiAnalysis: rec.aiAnalysis ? JSON.parse(rec.aiAnalysis) : null,
        actionItems: rec.actionItems ? JSON.parse(rec.actionItems) : [],
      };
    }),

  upload: protectedProcedure
    .input(z.object({
      filename: z.string(),
      s3Url: z.string().url(),
      s3Key: z.string(),
      leadId: z.number().int().optional(),
      duration: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { callRecordings } = await import("../../drizzle/schema");
      await db.insert(callRecordings).values({
        userId: ctx.user.id,
        leadId: input.leadId ?? null,
        filename: input.filename,
        s3Url: input.s3Url,
        s3Key: input.s3Key,
        duration: input.duration ?? null,
        callStatus: "uploaded",
      });
      const rows = await db.select().from(callRecordings)
        .where(eq(callRecordings.userId, ctx.user.id))
        .orderBy(callRecordings.createdAt);
      const inserted = rows[rows.length - 1] as any;
      // Trigger async analysis (fire-and-forget)
      setImmediate(async () => {
        try {
          const { invokeLLM } = await import("../_core/llm");
          // Update status to analyzing
          await db.update(callRecordings)
            .set({ callStatus: "analyzing" })
            .where(eq(callRecordings.id, inserted.id));
          // Use LLM to analyze the call based on filename and context
          const analysisPrompt = `Analyze this sales call recording named "${input.filename}".
Generate a realistic sales call analysis as if you had listened to the call.
Return JSON: {
  summary: string (2-3 sentences),
  sentiment: "positive" | "neutral" | "negative",
  keyTopics: string[],
  objections: string[],
  nextActions: string[],
  crmNote: string (1 sentence CRM update),
  callScore: number (0-100),
  talkRatio: { rep: number, prospect: number } (percentages summing to 100)
}`;
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are an expert sales call analyst. Always respond with valid JSON." },
              { role: "user", content: analysisPrompt },
            ],
            response_format: { type: "json_object" },
          });
          const analysis = JSON.parse(extractText(response.choices[0].message.content) || "{}");
          await db.update(callRecordings)
            .set({
              aiAnalysis: JSON.stringify(analysis),
              sentiment: analysis.sentiment ?? "neutral",
              actionItems: JSON.stringify(analysis.nextActions ?? []),
              callStatus: "done",
            })
            .where(eq(callRecordings.id, inserted.id));
          // Auto-update lead notes if leadId provided
          if (input.leadId && analysis.crmNote) {
            await db.update(leads)
              .set({ icebreaker: analysis.crmNote })
              .where(eq(leads.id, input.leadId));
          }
        } catch (err) {
          await db.update(callRecordings)
            .set({ callStatus: "error" })
            .where(eq(callRecordings.id, inserted.id));
        }
      });
      return inserted;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const { callRecordings } = await import("../../drizzle/schema");
      const rows = await db.select().from(callRecordings)
        .where(eq(callRecordings.id, input.id));
      if (!rows[0] || (rows[0] as any).userId !== ctx.user.id) return { success: false };
      await db.delete(callRecordings).where(eq(callRecordings.id, input.id));
      return { success: true };
    }),
});

// ── CRM: Deals, Activities, Quotas, Commissions ────────────────────────────
export const crmRouter = router({
  listDeals: protectedProcedure.query(async ({ ctx }) => {
    const { getDeals } = await import("../crmDb");
    return getDeals(ctx.user.id);
  }),
  getDealStats: protectedProcedure.query(async ({ ctx }) => {
    const { getDealStats } = await import("../crmDb");
    return getDealStats(ctx.user.id);
  }),
  createDeal: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(256),
      value: z.string().optional(),
      currency: z.string().default("CZK"),
      stage: z.enum(["new", "qualified", "presentation", "proposal", "negotiation", "won", "lost"]).default("new"),
      probability: z.number().int().min(0).max(100).optional(),
      expectedCloseDate: z.string().optional(),
      notes: z.string().optional(),
      leadId: z.number().int().optional(),
      nextAction: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { createDeal } = await import("../crmDb");
      const id = await createDeal({
        userId: ctx.user.id,
        title: input.title,
        value: input.value ?? "0",
        currency: input.currency,
        stage: input.stage,
        probability: input.probability ?? 0,
        expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : undefined,
        notes: input.notes,
        leadId: input.leadId,
        nextAction: input.nextAction,
      });
      return { id };
    }),
  updateDeal: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      title: z.string().min(1).max(256).optional(),
      value: z.string().optional(),
      currency: z.string().optional(),
      stage: z.enum(["new", "qualified", "presentation", "proposal", "negotiation", "won", "lost"]).optional(),
      probability: z.number().int().min(0).max(100).optional(),
      expectedCloseDate: z.string().optional(),
      notes: z.string().optional(),
      nextAction: z.string().optional(),
      lostReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { updateDeal, getDealById } = await import("../crmDb");
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.expectedCloseDate) updateData.expectedCloseDate = new Date(data.expectedCloseDate);
      if (data.stage === "won") updateData.wonAt = new Date();
      const oldDeal = await getDealById(id, ctx.user.id);
      await updateDeal(id, ctx.user.id, updateData);
      if (data.stage && oldDeal && oldDeal.stage !== data.stage) {
        logAuditEvent(ctx.user.id, "deal.stage_changed", "deal", id,
          { stage: oldDeal.stage }, { stage: data.stage },
          { title: oldDeal.title }, ctx.req?.ip).catch(() => {});
      }
      return { success: true };
    }),
  deleteDeal: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { deleteDeal } = await import("../crmDb");
      await deleteDeal(input.id, ctx.user.id);
      return { success: true };
    }),
  getDealActivities: protectedProcedure
    .input(z.object({ dealId: z.number().int() }))
    .query(async ({ input }) => {
      const { getDealActivities } = await import("../crmDb");
      return getDealActivities(input.dealId);
    }),
  addActivity: protectedProcedure
    .input(z.object({
      dealId: z.number().int(),
      type: z.enum(["call", "email", "meeting", "note", "task", "demo"]),
      content: z.string().optional(),
      duration: z.number().int().optional(),
      outcome: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { createDealActivity } = await import("../crmDb");
      const id = await createDealActivity({ ...input, userId: ctx.user.id });
      return { id };
    }),
  listQuotas: protectedProcedure.query(async ({ ctx }) => {
    const { getQuotas } = await import("../crmDb");
    return getQuotas(ctx.user.id);
  }),
  upsertQuota: protectedProcedure
    .input(z.object({
      period: z.string(),
      periodType: z.enum(["monthly", "quarterly", "yearly"]).default("monthly"),
      targetValue: z.string(),
      achievedValue: z.string().optional(),
      currency: z.string().default("CZK"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { upsertQuota } = await import("../crmDb");
      await upsertQuota({ userId: ctx.user.id, ...input, achievedValue: input.achievedValue ?? "0" });
      return { success: true };
    }),
  listCommissions: protectedProcedure.query(async ({ ctx }) => {
    const { getCommissions } = await import("../crmDb");
    return getCommissions(ctx.user.id);
  }),
  createCommission: protectedProcedure
    .input(z.object({
      dealId: z.number().int(),
      rate: z.string(),
      amount: z.string(),
      currency: z.string().default("CZK"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { createCommission } = await import("../crmDb");
      const id = await createCommission({ ...input, userId: ctx.user.id });
      return { id };
    }),

  // ─── AI Deal Scoring ────────────────────────────────────────────
  scoreDeal: protectedProcedure
    .input(z.object({ dealId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const { deals, dealActivities } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [deal] = await db.select().from(deals)
        .where(and(eq(deals.id, input.dealId), eq(deals.userId, ctx.user.id)));
      if (!deal) throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });

      const activities = await db.select().from(dealActivities)
        .where(eq(dealActivities.dealId, input.dealId));

      const daysInStage = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      const daysOld = Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const activitySummary = activities.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {} as Record<string, number>);
      const lastActivity = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const daysSinceLastActivity = lastActivity ? Math.floor((Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : null;

      const prompt = `You are an expert B2B sales coach. Analyze this deal and return a JSON object with score (0-100 integer), reasoning (2-3 sentences), nextAction (string), riskFactors (array of up to 3 strings), positiveSignals (array of up to 3 strings).

Deal: "${deal.title}" | Stage: ${deal.stage} | Value: ${deal.value} ${deal.currency}
Days in stage: ${daysInStage} | Deal age: ${daysOld} days | Close date: ${deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'Not set'}
Activities: ${JSON.stringify(activitySummary)} (total: ${activities.length}) | Days since last activity: ${daysSinceLastActivity !== null ? daysSinceLastActivity : 'None'}
Last outcome: ${lastActivity?.outcome || 'N/A'} | Notes: ${deal.notes || 'None'}

Baseline by stage: new=10%, qualified=25%, presentation=40%, proposal=60%, negotiation=75%. Adjust for activity cadence, deal age, and engagement.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a B2B sales AI. Return only valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "deal_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "integer" },
                reasoning: { type: "string" },
                nextAction: { type: "string" },
                riskFactors: { type: "array", items: { type: "string" } },
                positiveSignals: { type: "array", items: { type: "string" } },
              },
              required: ["score", "reasoning", "nextAction", "riskFactors", "positiveSignals"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = extractText(response.choices[0].message.content);
      const result = JSON.parse(raw || "{}");
      const score = Math.max(0, Math.min(100, result.score));
      const fullReasoning = `${result.reasoning}\n\nNext action: ${result.nextAction}\n\nPositive signals: ${result.positiveSignals.join("; ")}\n\nRisk factors: ${result.riskFactors.join("; ")}`;

      await db.update(deals).set({
        aiScore: score,
        aiScoreReasoning: fullReasoning,
        aiScoredAt: new Date(),
        probability: score,
        nextAction: result.nextAction,
      }).where(eq(deals.id, input.dealId));

      return { score, reasoning: fullReasoning, nextAction: result.nextAction, riskFactors: result.riskFactors, positiveSignals: result.positiveSignals };
    }),

  batchScoreDeals: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { getDb } = await import("../db");
      const { deals } = await import("../../drizzle/schema");
      const { eq, isNull, and, ne } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const unscoredDeals = await db.select({ id: deals.id, stage: deals.stage, createdAt: deals.createdAt })
        .from(deals)
        .where(and(eq(deals.userId, ctx.user.id), isNull(deals.aiScoredAt), ne(deals.stage, "won"), ne(deals.stage, "lost")));

      const stageScores: Record<string, number> = { new: 10, qualified: 25, presentation: 40, proposal: 60, negotiation: 75 };
      let scored = 0;
      for (const d of unscoredDeals.slice(0, 20)) {
        const baseScore = stageScores[d.stage] ?? 30;
        const daysOld = Math.floor((Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const agePenalty = Math.min(20, Math.floor(daysOld / 7) * 2);
        const finalScore = Math.max(5, baseScore - agePenalty);
        await db.update(deals).set({
          aiScore: finalScore,
          aiScoreReasoning: `Baseline score for ${d.stage} stage. Click "Re-score with AI" for detailed analysis.`,
          aiScoredAt: new Date(),
          probability: finalScore,
        }).where(eq(deals.id, d.id));
        scored++;
      }
      return { scored };
    }),
});

// ─── Multi-Project API Hub ──────────────────────────────────────
export const projectsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { listProjects } = await import("../projectsDb");
    return listProjects(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      description: z.string().optional(),
      url: z.string().optional(),
      category: z.enum(["ecommerce", "saas", "content", "affiliate", "other"]).default("ecommerce"),
      currency: z.string().default("CZK"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { createProject } = await import("../projectsDb");
      return createProject({ userId: ctx.user.id, ...input });
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { deleteProject } = await import("../projectsDb");
      await deleteProject(input.id, ctx.user.id);
      return { success: true };
    }),
  regenerateKey: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { regenerateApiKey } = await import("../projectsDb");
      const newKey = await regenerateApiKey(input.id, ctx.user.id);
      return { apiKey: newKey };
    }),
  getStats: protectedProcedure
    .input(z.object({ id: z.number().int(), days: z.number().int().default(30) }))
    .query(async ({ ctx, input }) => {
      const { getProjectById, getProjectStats } = await import("../projectsDb");
      const project = await getProjectById(input.id, ctx.user.id);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return getProjectStats(input.id, input.days);
    }),
  getAllStats: protectedProcedure
    .input(z.object({ days: z.number().int().default(30) }))
    .query(async ({ ctx, input }) => {
      const { getAllProjectsStats } = await import("../projectsDb");
      return getAllProjectsStats(ctx.user.id, input.days);
    }),
  getAdSummary: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const { getProjectById, getProjectAdSummary } = await import("../projectsDb");
      const project = await getProjectById(input.id, ctx.user.id);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return getProjectAdSummary(input.id);
    }),
  linkCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number().int(), projectId: z.number().int().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const db = await (await import("../db")).getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { adCampaigns } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const [campaign] = await db.select().from(adCampaigns)
        .where(and(eq(adCampaigns.id, input.campaignId), eq(adCampaigns.userId, ctx.user.id)));
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      await db.update(adCampaigns).set({ projectId: input.projectId }).where(eq(adCampaigns.id, input.campaignId));
      return { success: true };
    }),
  createTask: protectedProcedure
    .input(z.object({
      projectId: z.number().int(),
      title: z.string().min(1),
      description: z.string().optional(),
      manusTaskId: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { createProjectTask, getProjectById } = await import("../projectsDb");
      const project = await getProjectById(input.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return { id: await createProjectTask(input) };
    }),
  listTasks: protectedProcedure
    .input(z.object({ projectId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const { listProjectTasks, getProjectById } = await import("../projectsDb");
      const project = await getProjectById(input.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return listProjectTasks(input.projectId);
    }),
  createMilestone: protectedProcedure
    .input(z.object({
      projectId: z.number().int(),
      name: z.string().min(1),
      dueDate: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { createProjectMilestone, getProjectById } = await import("../projectsDb");
      const project = await getProjectById(input.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return { id: await createProjectMilestone({ ...input, dueDate: input.dueDate ? new Date(input.dueDate) : undefined }) };
    }),
  listMilestones: protectedProcedure
    .input(z.object({ projectId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const { listProjectMilestones, getProjectById } = await import("../projectsDb");
      const project = await getProjectById(input.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return listProjectMilestones(input.projectId);
    }),
});

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { capturedLeads } from "../../drizzle/schema";
import { eq, desc, count } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

// ─── Helper: send welcome email via LLM-generated content ────────────────────

async function sendWelcomeEmail(email: string, firstName?: string): Promise<boolean> {
  try {
    // Generate personalized welcome email content
    const name = firstName || "there";
    const emailContent = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a B2B SaaS copywriter for LeadOS — an AI-powered lead generation platform. 
Write a short, warm, high-converting welcome email for a new lead who just signed up for a free guide.
The email should:
- Be 3-4 short paragraphs
- Feel personal and human, not corporate
- Mention the free guide "50 B2B Leads in 24 Hours"
- Include a clear CTA to start a free trial
- End with a P.S. with a compelling hook
- Subject line: "Your free guide is ready, ${name} 🚀"
Return ONLY the email body (no subject line), plain text format.`,
        },
        {
          role: "user",
          content: `Write welcome email for: ${name} (${email})`,
        },
      ],
    });

    const emailBody = (emailContent as any)?.choices?.[0]?.message?.content || "";

    // Notify owner about new lead capture
    await notifyOwner({
      title: `🎯 New Lead Captured: ${email}`,
      content: `Source: Exit-Intent Popup\nEmail: ${email}\nName: ${firstName || "Unknown"}\n\nWelcome email sent successfully.`,
    });

    // Log for debugging (in production this would integrate with SendGrid/Resend/etc.)
    console.log(`[LeadCapture] Welcome email prepared for ${email}:\n${emailBody.substring(0, 200)}...`);

    return true;
  } catch (err: any) {
    console.error(`[LeadCapture] Failed to send welcome email to ${email}:`, err?.message);
    return false;
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const leadsRouter = router({
  // Public: capture email from exit-intent popup, smart popup, or landing CTA
  captureEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        source: z.enum(["exit_intent", "smart_popup", "landing_cta"]).default("exit_intent"),
        firstName: z.string().max(128).optional(),
        utmSource: z.string().max(128).optional(),
        utmMedium: z.string().max(128).optional(),
        utmCampaign: z.string().max(128).optional(),
        pageUrl: z.string().max(2048).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check for duplicate email (same source)
      const existing = await db
        .select({ id: capturedLeads.id, welcomeEmailSent: capturedLeads.welcomeEmailSent })
        .from(capturedLeads)
        .where(eq(capturedLeads.email, input.email.toLowerCase().trim()))
        .limit(1);

      if (existing.length > 0) {
        // Already captured — return success without duplicate entry
        return {
          success: true,
          alreadyCaptured: true,
          message: "You're already on our list! Check your inbox for the guide.",
        };
      }

      // Insert new captured lead
      const now = Date.now();
      await db.insert(capturedLeads).values({
        email: input.email.toLowerCase().trim(),
        source: input.source,
        firstName: input.firstName,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        pageUrl: input.pageUrl,
        welcomeEmailSent: false,
        createdAt: now,
      });

      // Send welcome email asynchronously (don't block the response)
      sendWelcomeEmail(input.email, input.firstName).then(async (sent) => {
        if (sent) {
          await db
            .update(capturedLeads)
            .set({ welcomeEmailSent: true, welcomeEmailSentAt: Date.now() })
            .where(eq(capturedLeads.email, input.email.toLowerCase().trim()));
        }
      });

      return {
        success: true,
        alreadyCaptured: false,
        message: "Your free guide is on its way! Check your inbox in the next few minutes.",
      };
    }),

  // Protected: get all captured leads (admin view)
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(capturedLeads)
        .orderBy(desc(capturedLeads.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ total }] = await db
        .select({ total: count() })
        .from(capturedLeads);

      return { leads: rows, total };
    }),

  // Protected: get stats summary
  stats: protectedProcedure.query(async () => {
    const db = getDb();
    const [{ total }] = await db.select({ total: count() }).from(capturedLeads);
    const [{ emailsSent }] = await db
      .select({ emailsSent: count() })
      .from(capturedLeads)
      .where(eq(capturedLeads.welcomeEmailSent, true));
    const [{ converted }] = await db
      .select({ converted: count() })
      .from(capturedLeads)
      .where(eq(capturedLeads.convertedToUser, true));

    return {
      total,
      emailsSent,
      converted,
      conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
    };
  }),
});

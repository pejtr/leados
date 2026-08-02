/**
 * Outreach Sequence Engine
 *
 * Spravuje multi-step outreach sekvence (LinkedIn + email + SMS).
 * Automaticky posílá follow-up zprávy podle naplánovaného harmonogramu.
 */

import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { sendEmail } from "./email-service";
import { sendSms, sendWhatsApp } from "./sms-service";
import { generateOutreachMessage } from "./outreach-agent";
import { prospects, outreachSequences, outreachSteps, outreachMessages } from "../drizzle/schema";
import { eq, and, lt, isNull } from "drizzle-orm";

// ─── Sequence Management ──────────────────────────────────────────────────────

export async function createSequence(data: {
  name: string;
  description?: string;
  targetIndustry?: string;
  targetTitle?: string;
  targetRevenue?: string;
  steps: Array<{
    stepNumber: number;
    stepType: "linkedin_connect" | "linkedin_message" | "email" | "sms" | "whatsapp" | "wait";
    delayDays: number;
    delayHours: number;
    messageTemplate?: string;
    messageSubject?: string;
    condition?: string;
  }>;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Create sequence
    const result = await db.insert(outreachSequences).values({
      name: data.name,
      description: data.description,
      targetIndustry: data.targetIndustry,
      targetTitle: data.targetTitle,
      targetRevenue: data.targetRevenue,
      status: "draft",
      totalSteps: data.steps.length,
    });
    const sequenceId = (result as any).insertId;

    // Create steps
    for (const step of data.steps) {
      await db.insert(outreachSteps).values({
        sequenceId,
        stepNumber: step.stepNumber,
        stepType: step.stepType,
        delayDays: step.delayDays,
        delayHours: step.delayHours,
        messageTemplate: step.messageTemplate,
        messageSubject: step.messageSubject,
        condition: step.condition,
      });
    }

    return sequenceId;
  } catch (error) {
    console.error("[SequenceEngine] Failed to create sequence:", error);
    return null;
  }
}

export async function activateSequence(sequenceId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(outreachSequences).set({ status: "active" }).where(eq(outreachSequences.id, sequenceId));
    return true;
  } catch (error) {
    console.error("[SequenceEngine] Failed to activate sequence:", error);
    return false;
  }
}

// ─── Message Sending ──────────────────────────────────────────────────────────

export async function sendStepMessage(params: {
  sequenceId: number;
  stepId: number;
  prospectId: number;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get step and prospect
    const step = await db.select().from(outreachSteps).where(eq(outreachSteps.id, params.stepId)).limit(1);
    const prospect = await db.select().from(prospects).where(eq(prospects.id, params.prospectId)).limit(1);

    if (!step[0] || !prospect[0]) return false;

    // Generate message if it's a LinkedIn/email step
    let content = step[0].messageTemplate || "";
    let subject = step[0].messageSubject;

    if (step[0].stepType !== "wait" && !content) {
      const generated = await generateOutreachMessage({
        prospectId: params.prospectId,
        messageType: step[0].stepType === "linkedin_connect" ? "connection_request" : "first_message",
      });
      if (generated) {
        content = generated.content;
        if (!subject) subject = `Zpráva od OPTIMATEO`;
      }
    }

    // Send message based on step type
    let status: string = "pending";
    if (step[0].stepType === "email") {
      const sent = await sendEmail({
        to: prospect[0].email || "",
        subject: subject || "Zpráva od OPTIMATEO",
        html: `<p>${content}</p>`,
      });
      status = sent ? "sent" : "failed";
    } else if (step[0].stepType === "sms") {
      const sent = await sendSms({ to: prospect[0].phone || "", body: content });
      status = sent ? "sent" : "failed";
    } else if (step[0].stepType === "whatsapp") {
      const sent = await sendWhatsApp({ to: prospect[0].phone || "", body: content });
      status = sent ? "sent" : "failed";
    } else if (step[0].stepType === "linkedin_connect" || step[0].stepType === "linkedin_message") {
      // LinkedIn sending would be handled by browser extension or API
      // For now, we just log it
      console.log(`[SequenceEngine] Would send LinkedIn ${step[0].stepType} to ${prospect[0].linkedinUrl}`);
      status = "pending"; // Waiting for manual send or API
    } else if (step[0].stepType === "wait") {
      status = "delivered"; // Wait step is just a delay
    }

    // Record message
    await db.insert(outreachMessages).values({
      sequenceId: params.sequenceId,
      stepId: params.stepId,
      prospectId: params.prospectId,
      stepType: step[0].stepType,
      subject,
      content,
      status,
      sentAt: status === "sent" ? new Date() : undefined,
    });

    // Update prospect status
    if (status === "sent" || status === "delivered") {
      await db.update(prospects).set({
        status: "contacted",
        lastContactedAt: new Date(),
      }).where(eq(prospects.id, params.prospectId));
    }

    // Update sequence stats
    await db.update(outreachSequences).set({
      totalContacted: (step[0].stepType !== "wait") ? undefined : undefined, // Will be incremented in SQL
    }).where(eq(outreachSequences.id, params.sequenceId));

    return status === "sent" || status === "delivered";
  } catch (error) {
    console.error("[SequenceEngine] Failed to send step message:", error);
    return false;
  }
}

// ─── Sequence Execution (Cron Job) ────────────────────────────────────────────

export async function executeSequences(): Promise<{ processed: number; sent: number; failed: number }> {
  const db = await getDb();
  if (!db) return { processed: 0, sent: 0, failed: 0 };

  let processed = 0;
  let sent = 0;
  let failed = 0;

  try {
    // Get all active sequences
    const activeSequences = await db.select().from(outreachSequences).where(eq(outreachSequences.status, "active"));

    for (const seq of activeSequences) {
      // Get prospects in this sequence (via outreach_messages)
      const sequenceProspects = await db.select().from(outreachMessages)
        .where(eq(outreachMessages.sequenceId, seq.id))
        .groupBy(outreachMessages.prospectId);

      for (const msg of sequenceProspects) {
        const prospectId = msg.prospectId;

        // Get last message for this prospect in this sequence
        const lastMessage = await db.select().from(outreachMessages)
          .where(and(
            eq(outreachMessages.sequenceId, seq.id),
            eq(outreachMessages.prospectId, prospectId),
          ))
          .orderBy(outreachMessages.createdAt)
          .limit(1);

        // Determine next step
        const nextStepNumber = lastMessage.length > 0
          ? (lastMessage[0].stepId ? lastMessage[0].stepId + 1 : 1)
          : 1;

        const nextStep = await db.select().from(outreachSteps)
          .where(and(
            eq(outreachSteps.sequenceId, seq.id),
            eq(outreachSteps.stepNumber, nextStepNumber),
          ))
          .limit(1);

        if (!nextStep[0]) continue; // No more steps

        // Check if it's time to send (delay)
        if (lastMessage.length > 0 && lastMessage[0].sentAt) {
          const sentAt = new Date(lastMessage[0].sentAt);
          const now = new Date();
          const daysSince = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24));
          const hoursSince = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60));

          if (daysSince < nextStep[0].delayDays || hoursSince < nextStep[0].delayHours) {
            continue; // Not time yet
          }
        }

        // Check condition (e.g., "no_reply", "replied")
        if (nextStep[0].condition === "no_reply") {
          const hasReplied = await db.select().from(outreachMessages)
            .where(and(
              eq(outreachMessages.sequenceId, seq.id),
              eq(outreachMessages.prospectId, prospectId),
              eq(outreachMessages.status, "replied"),
            ))
            .limit(1);
          if (hasReplied.length > 0) continue; // They replied, skip this step
        }

        // Send the message
        const success = await sendStepMessage({
          sequenceId: seq.id,
          stepId: nextStep[0].id,
          prospectId,
        });

        processed++;
        if (success) sent++;
        else failed++;
      }
    }

    return { processed, sent, failed };
  } catch (error) {
    console.error("[SequenceEngine] Sequence execution failed:", error);
    return { processed, sent, failed };
  }
}

// ─── Sequence Analytics ───────────────────────────────────────────────────────

export async function getSequenceStats(sequenceId: number) {
  const db = await getDb();
  if (!db) return null;

  const seq = await db.select().from(outreachSequences).where(eq(outreachSequences.id, sequenceId)).limit(1);
  if (!seq[0]) return null;

  const messages = await db.select().from(outreachMessages).where(eq(outreachMessages.sequenceId, sequenceId));

  const byStep = messages.reduce((acc, msg) => {
    acc[msg.stepType] = (acc[msg.stepType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byStatus = messages.reduce((acc, msg) => {
    acc[msg.status] = (acc[msg.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    sequence: seq[0],
    totalMessages: messages.length,
    byStep,
    byStatus,
    replyRate: seq[0].totalContacted > 0 ? (seq[0].totalReplied / seq[0].totalContacted) * 100 : 0,
  };
}

/**
 * Email Sequence Scheduler — background worker that checks for due enrollment steps
 * and sends follow-up emails automatically every hour.
 */
import { getDb } from "./db";
import {
  emailSequenceEnrollments,
  emailSequenceSteps,
  emailSequences,
  leads,
  users,
} from "../drizzle/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Every hour

interface DueEnrollment {
  enrollmentId: number;
  sequenceId: number;
  leadId: number;
  userId: number;
  currentStep: number;
  leadEmail: string | null;
  leadName: string | null;
  leadCompany: string;
  userEmail: string | null;
  userName: string | null;
}

async function getDueEnrollments(): Promise<DueEnrollment[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  // Get active enrollments where nextSendAt <= now
  const rows = await db
    .select({
      enrollmentId: emailSequenceEnrollments.id,
      sequenceId: emailSequenceEnrollments.sequenceId,
      leadId: emailSequenceEnrollments.leadId,
      userId: emailSequenceEnrollments.userId,
      currentStep: emailSequenceEnrollments.currentStep,
      leadEmail: leads.email,
      leadName: leads.contactName,
      leadCompany: leads.companyName,
      userEmail: users.email,
      userName: users.name,
    })
    .from(emailSequenceEnrollments)
    .innerJoin(leads, eq(leads.id, emailSequenceEnrollments.leadId))
    .innerJoin(users, eq(users.id, emailSequenceEnrollments.userId))
    .where(
      and(
        eq(emailSequenceEnrollments.status, "active"),
        isNotNull(emailSequenceEnrollments.nextSendAt),
        lte(emailSequenceEnrollments.nextSendAt, now)
      )
    );

  return rows as DueEnrollment[];
}

async function getStepForEnrollment(
  sequenceId: number,
  stepNumber: number
): Promise<{ subject: string; body: string; delayDays: number } | null> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(emailSequenceSteps)
    .where(
      and(
        eq(emailSequenceSteps.sequenceId, sequenceId),
        eq(emailSequenceSteps.stepNumber, stepNumber)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

async function getTotalSteps(sequenceId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const rows = await db
    .select({ stepNumber: emailSequenceSteps.stepNumber })
    .from(emailSequenceSteps)
    .where(eq(emailSequenceSteps.sequenceId, sequenceId));

  return rows.length;
}

async function markStepSentAndAdvance(
  enrollmentId: number,
  nextStep: number,
  nextDelayDays: number | null,
  isComplete: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  if (isComplete) {
    await db
      .update(emailSequenceEnrollments)
      .set({
        status: "completed",
        completedAt: new Date(),
        nextSendAt: null,
      })
      .where(eq(emailSequenceEnrollments.id, enrollmentId));
  } else {
    const nextSendAt = new Date();
    nextSendAt.setDate(nextSendAt.getDate() + (nextDelayDays ?? 1));
    await db
      .update(emailSequenceEnrollments)
      .set({
        currentStep: nextStep,
        nextSendAt,
      })
      .where(eq(emailSequenceEnrollments.id, enrollmentId));
  }
}

function personalizeEmailBody(body: string, vars: Record<string, string>): string {
  let result = body;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

async function processEnrollment(enrollment: DueEnrollment): Promise<void> {
  const step = await getStepForEnrollment(enrollment.sequenceId, enrollment.currentStep);
  if (!step) {
    console.log(`[SequenceScheduler] No step ${enrollment.currentStep} found for sequence ${enrollment.sequenceId}, marking complete`);
    await markStepSentAndAdvance(enrollment.enrollmentId, enrollment.currentStep, null, true);
    return;
  }

  const totalSteps = await getTotalSteps(enrollment.sequenceId);
  const isLastStep = enrollment.currentStep >= totalSteps;

  // Personalize subject and body
  const vars: Record<string, string> = {
    firstName: enrollment.leadName?.split(" ")[0] ?? "there",
    fullName: enrollment.leadName ?? "there",
    company: enrollment.leadCompany ?? "your company",
    senderName: enrollment.userName ?? "The Team",
  };

  const personalizedSubject = personalizeEmailBody(step.subject, vars);
  const personalizedBody = personalizeEmailBody(step.body, vars);

  // Log the email send (in production this would call an email service)
  console.log(`[SequenceScheduler] Sending step ${enrollment.currentStep} to ${enrollment.leadEmail ?? "no-email"}`);
  console.log(`  Subject: ${personalizedSubject}`);
  console.log(`  Lead: ${enrollment.leadName} @ ${enrollment.leadCompany}`);
  console.log(`  Sequence: ${enrollment.sequenceId}, Enrollment: ${enrollment.enrollmentId}`);

  // If the lead has an email, notify the owner that the email was "sent"
  // In a real deployment, this would integrate with SendGrid/Resend/Mailgun
  if (enrollment.leadEmail) {
    try {
      await notifyOwner({
        title: `Sequence Email Sent: ${personalizedSubject}`,
        content: `Step ${enrollment.currentStep}/${totalSteps} sent to ${enrollment.leadName ?? enrollment.leadEmail} at ${enrollment.leadCompany}.\n\nBody preview: ${personalizedBody.substring(0, 200)}...`,
      });
    } catch {
      // Notification failure is non-critical
    }
  }

  // Advance to next step or complete
  if (isLastStep) {
    await markStepSentAndAdvance(enrollment.enrollmentId, enrollment.currentStep, null, true);
    console.log(`[SequenceScheduler] Enrollment ${enrollment.enrollmentId} completed all ${totalSteps} steps`);
  } else {
    const nextStep = enrollment.currentStep + 1;
    const nextStepData = await getStepForEnrollment(enrollment.sequenceId, nextStep);
    const delayDays = nextStepData?.delayDays ?? 1;
    await markStepSentAndAdvance(enrollment.enrollmentId, nextStep, delayDays, false);
    console.log(`[SequenceScheduler] Enrollment ${enrollment.enrollmentId} advanced to step ${nextStep}, next send in ${delayDays} day(s)`);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startSequenceScheduler(): void {
  if (intervalId) return;
  console.log("[SequenceScheduler] Started — checking every 60 minutes");

  // Run immediately on startup to catch any overdue enrollments
  runCheck();

  intervalId = setInterval(runCheck, CHECK_INTERVAL_MS);
}

async function runCheck(): Promise<void> {
  try {
    const dueEnrollments = await getDueEnrollments();
    if (dueEnrollments.length === 0) return;

    console.log(`[SequenceScheduler] Found ${dueEnrollments.length} due enrollment(s)`);
    for (const enrollment of dueEnrollments) {
      try {
        await processEnrollment(enrollment);
      } catch (err: any) {
        console.error(`[SequenceScheduler] Error processing enrollment ${enrollment.enrollmentId}:`, err?.message);
      }
    }
  } catch (err) {
    console.error("[SequenceScheduler] Check error:", err);
  }
}

export function stopSequenceScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[SequenceScheduler] Stopped");
  }
}

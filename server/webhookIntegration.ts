/**
 * Webhook Integration Hooks
 * Triggers webhooks at key points in the lead generation pipeline
 */
import { dispatchWebhookEvent } from "./webhookDispatcherV2";

/**
 * Trigger webhook when a new lead is created
 */
export async function onLeadCreated(
  userId: number,
  leadData: {
    id: number;
    name: string;
    email: string;
    company?: string;
    industry?: string;
    status: string;
    source?: string;
    createdAt: number;
  }
): Promise<void> {
  try {
    await dispatchWebhookEvent(userId, "new_lead", {
      leadId: leadData.id,
      name: leadData.name,
      email: leadData.email,
      company: leadData.company,
      industry: leadData.industry,
      status: leadData.status,
      source: leadData.source,
      createdAt: new Date(leadData.createdAt).toISOString(),
    });
  } catch (error) {
    console.error("[WebhookIntegration] Error triggering new_lead webhook:", error);
    // Don't throw - webhook failure shouldn't block lead creation
  }
}

/**
 * Trigger webhook when a lead status changes (e.g., to qualified)
 */
export async function onLeadStatusChanged(
  userId: number,
  leadId: number,
  oldStatus: string,
  newStatus: string,
  leadData?: Record<string, any>
): Promise<void> {
  try {
    // Only trigger webhook for specific status transitions
    const qualifyingTransitions = [
      "new->contacted",
      "contacted->replied",
      "replied->qualified",
      "new->qualified",
    ];

    const transition = `${oldStatus}->${newStatus}`;
    if (!qualifyingTransitions.includes(transition) && newStatus !== "qualified") {
      return; // Skip non-qualifying transitions
    }

    await dispatchWebhookEvent(userId, "new_lead", {
      leadId,
      status: newStatus,
      previousStatus: oldStatus,
      statusChangedAt: new Date().toISOString(),
      ...leadData,
    });
  } catch (error) {
    console.error("[WebhookIntegration] Error triggering status change webhook:", error);
  }
}

/**
 * Trigger webhook when a deal is closed (lead marked as qualified + deal value set)
 */
export async function onDealClosed(
  userId: number,
  leadId: number,
  dealData: {
    leadName: string;
    email: string;
    dealValue: number;
    currency: string;
    closedAt: number;
    source?: string;
    notes?: string;
  }
): Promise<void> {
  try {
    await dispatchWebhookEvent(userId, "new_order", {
      leadId,
      dealId: `deal_${leadId}_${Date.now()}`,
      leadName: dealData.leadName,
      email: dealData.email,
      dealValue: dealData.dealValue,
      currency: dealData.currency,
      closedAt: new Date(dealData.closedAt).toISOString(),
      source: dealData.source,
      notes: dealData.notes,
    });
  } catch (error) {
    console.error("[WebhookIntegration] Error triggering deal closed webhook:", error);
  }
}

/**
 * Trigger webhook when a quiz is completed (for Deep Sleep Reset integration)
 */
export async function onQuizCompleted(
  userId: number,
  quizData: {
    quizId: string;
    respondentEmail: string;
    respondentName?: string;
    score?: number;
    answers: Record<string, any>;
    completedAt: number;
  }
): Promise<void> {
  try {
    await dispatchWebhookEvent(userId, "quiz_completed", {
      quizId: quizData.quizId,
      respondentEmail: quizData.respondentEmail,
      respondentName: quizData.respondentName,
      score: quizData.score,
      answers: quizData.answers,
      completedAt: new Date(quizData.completedAt).toISOString(),
    });
  } catch (error) {
    console.error("[WebhookIntegration] Error triggering quiz completed webhook:", error);
  }
}

/**
 * Trigger webhook for batch lead import (external source)
 */
export async function onBatchLeadsImported(
  userId: number,
  batchData: {
    batchId: string;
    sourceSystem: string;
    leadCount: number;
    importedAt: number;
  }
): Promise<void> {
  try {
    await dispatchWebhookEvent(userId, "new_lead", {
      batchImport: true,
      batchId: batchData.batchId,
      sourceSystem: batchData.sourceSystem,
      leadCount: batchData.leadCount,
      importedAt: new Date(batchData.importedAt).toISOString(),
    });
  } catch (error) {
    console.error("[WebhookIntegration] Error triggering batch import webhook:", error);
  }
}

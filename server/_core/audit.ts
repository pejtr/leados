import type { AuditEvent } from "../../drizzle/schema";
import { insertAuditEvent } from "../db/audit";
import { ENV } from "./env";

type AuditAction = "create" | "update" | "delete" | "login" | "logout" | "export" | "import";

type AuditResource =
  | "lead"
  | "lead_session"
  | "deal"
  | "deal_activity"
  | "user"
  | "team_member"
  | "email_sequence"
  | "email_template"
  | "campaign"
  | "sdr_campaign"
  | "ai_agent"
  | "workflow"
  | "mission"
  | "integration_config"
  | "webhook_config"
  | "api_key"
  | "constitution"
  | "autopilot_config"
  | "smart_list"
  | "alert_rule";

export async function logAuditEvent(
  userId: number,
  eventType: string,
  resourceType: string,
  resourceId: number | undefined,
  oldValue: Record<string, unknown> | undefined,
  newValue: Record<string, unknown> | undefined,
  metadata?: Record<string, unknown>,
  ip?: string,
): Promise<void> {
  if (!ENV.auditLogEnabled) return;

  const event: Parameters<typeof insertAuditEvent>[0] = {
    userId,
    eventType,
    resourceType,
    resourceId: resourceId ?? null,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
    metadata: metadata ?? null,
    ip: ip ?? null,
    createdAt: new Date(),
  };

  try {
    await insertAuditEvent(event);
  } catch (err) {
    console.error("[audit] Failed to log event:", err);
  }
}

export function diffValues<T extends Record<string, unknown>>(
  oldObj: T | undefined,
  newObj: Partial<T>,
): { oldValue: Record<string, unknown> | undefined; newValue: Record<string, unknown> | undefined } {
  if (!oldObj) return { oldValue: undefined, newValue: newObj as Record<string, unknown> };
  const changedKeys = Object.keys(newObj).filter(
    (k) => JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k]),
  );
  if (changedKeys.length === 0) return { oldValue: undefined, newValue: undefined };
  const oldPartial: Record<string, unknown> = {};
  const newPartial: Record<string, unknown> = {};
  for (const k of changedKeys) {
    oldPartial[k] = oldObj[k];
    newPartial[k] = newObj[k];
  }
  return { oldValue: oldPartial, newValue: newPartial };
}

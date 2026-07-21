import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Integration Logs ───────────────────────────────────────────
export const integrationLogs = mysqlTable("integration_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  webhookConfigId: int("webhookConfigId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(), // generate, status_change, deal_close, test
  payload: text("payload"), // JSON stringified payload sent
  responseStatus: int("responseStatus"), // HTTP status code
  responseBody: text("responseBody"), // truncated response
  success: boolean("success").default(false).notNull(),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type InsertIntegrationLog = typeof integrationLogs.$inferInsert;

// ─── Webhook Delivery Logs (Event Dispatch History) ────────────────────────────
export const webhookLogs = mysqlTable("webhook_logs", {
  id: int("id").primaryKey().autoincrement(),
  webhookConfigId: int("webhook_config_id").notNull(),
  userId: int("user_id").notNull(),
  event: varchar("event", { length: 64 }).notNull(),
  // Payload sent to webhook
  payload: json("payload").$type<Record<string, any>>(),
  // HTTP status code from webhook endpoint
  statusCode: int("status_code"),
  // Response body from webhook endpoint
  response: text("response"),
  // Attempt number (1-based)
  attempt: int("attempt").notNull().default(1),
  // Status: 'pending' | 'success' | 'failed' | 'retrying'
  status: mysqlEnum("status", ["pending", "success", "failed", "retrying"]).default("pending").notNull(),
  nextRetryAt: bigint("next_retry_at", { mode: "number" }),
  error: text("error"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  completedAt: bigint("completed_at", { mode: "number" }),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;

// ─── Webhook Configs (CRM Integration) ────────────────────────────────────────
export const webhookConfigs = mysqlTable("webhook_configs_crm", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  url: text("url").notNull(),
  secret: varchar("secret", { length: 256 }).notNull(), // HMAC secret for signing
  events: varchar("events", { length: 512 }).notNull(), // comma-separated: "new_lead,new_order,quiz_completed"
  status: mysqlEnum("status", ["active", "paused", "failed"]).default("active").notNull(),
  maxRetries: int("max_retries").default(3).notNull(),
  retryDelaySeconds: int("retry_delay_seconds").default(300).notNull(),
  headers: json("headers").$type<Record<string, string>>().$default(() => ({})),
  // Integration type — generic webhook (Zapier/Make/n8n), ClickUp, or Slack. generic + slack deliver to `url`.
  type: mysqlEnum("integration_type", ["generic", "clickup", "slack"]).default("generic").notNull(),
  clickupApiKey: text("clickup_api_key"), // used when type = "clickup"
  clickupListId: varchar("clickup_list_id", { length: 64 }), // used when type = "clickup"
  lastTriggeredAt: bigint("last_triggered_at", { mode: "number" }),
  failureCount: int("failure_count").default(0).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});

export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type InsertWebhookConfig = typeof webhookConfigs.$inferInsert;

// ─── Integration Settings (Brevo, Reddit Ads, TikTok Ads, Meta Pixel) ─────────
export const integrationSettings = mysqlTable("integration_settings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  integrationId: varchar("integration_id", { length: 64 }).notNull(), // e.g. "brevo", "reddit-ads", "tiktok-ads", "meta-pixel"
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  config: json("config").$type<Record<string, any>>().$default(() => ({})),
  status: mysqlEnum("status", ["active", "inactive", "error"]).default("inactive").notNull(),
  lastTestedAt: bigint("last_tested_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});

export type IntegrationSetting = typeof integrationSettings.$inferSelect;
export type InsertIntegrationSetting = typeof integrationSettings.$inferInsert;

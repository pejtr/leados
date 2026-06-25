-- Webhook subsystem integration (2026-06-22)
-- Adds typed-integration columns to webhook_configs_crm so generic / ClickUp / Slack
-- dispatch coexist on one config table.
--   * generic + slack  -> deliver to existing `url`
--   * clickup          -> uses clickup_api_key + clickup_list_id
--
-- WHY MANUAL: `drizzle-kit generate` is currently blocked by pre-existing schema<->snapshot
-- drift (several tables, e.g. google_maps_leads, were added without migrations, so drizzle
-- asks ambiguous rename questions). Auto-generating risks a destructive rename. Apply this
-- targeted ALTER on the ONYX OS database instead. NOT auto-applied to any DB.

ALTER TABLE `webhook_configs_crm`
  ADD COLUMN `integration_type` ENUM('generic','clickup','slack') NOT NULL DEFAULT 'generic',
  ADD COLUMN `clickup_api_key`  TEXT NULL,
  ADD COLUMN `clickup_list_id`  VARCHAR(64) NULL;

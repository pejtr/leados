const isProduction = process.env.NODE_ENV === "production";

export const ENV = {
  // ─── Server ────────────────────────────────────────────────────────────
  port: parseInt(process.env.PORT ?? "3000", 10),
  hubPublicUrl: process.env.HUB_PUBLIC_URL ?? "http://localhost:3001",
  isProduction,

  // ─── Auth ──────────────────────────────────────────────────────────────
  cookieSecret: process.env.JWT_SECRET ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  devAutoLogin: process.env.DEV_AUTO_LOGIN === "true",

  // ─── Database ──────────────────────────────────────────────────────────
  databaseUrl: process.env.DATABASE_URL ?? "",

  // ─── LLM Providers ───────────────────────────────────────────────────────
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
  deepseekModel: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",

  // ─── LLM Retry ─────────────────────────────────────────────────────────
  llmMaxRetries: parseInt(process.env.LLM_MAX_RETRIES ?? "3", 10),
  llmRetryBaseMs: parseInt(process.env.LLM_RETRY_BASE_MS ?? "1000", 10),

  // ─── External APIs ───────────────────────────────────────────────────────
  apifyToken: process.env.APIFY_TOKEN ?? "",
  brevoApiKey: process.env.BREVO_API_KEY ?? "",
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL ?? "",
  deepSleepResetApiKey: process.env.DEEP_SLEEP_RESET_API_KEY ?? "",
  dsrBaseUrl: process.env.DSR_BASE_URL ?? "https://deep-sleep-reset.com/api/v1",
  manusApiBaseUrl: process.env.MANUS_API_BASE_URL ?? "https://api.manus.space/v2",
  manusApiKey: process.env.MANUS_API_KEY ?? "",

  // ─── AI Scraper Suite ────────────────────────────────────────────────────
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY ?? "",
  firecrawlApiUrl: process.env.FIRECRAWL_API_URL ?? "https://api.firecrawl.dev",
  crawl4aiServiceUrl: process.env.CRAWL4AI_SERVICE_URL ?? "",
  crawl4aiApiKey: process.env.CRAWL4AI_API_KEY ?? "",
  browserUseAgentUrl: process.env.BROWSER_USE_AGENT_URL ?? "",
  scraperStealthProxyUrl: process.env.SCRAPER_STEALTH_PROXY_URL ?? "",

  // ─── Google ────────────────────────────────────────────────────────────
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleServiceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "",
  googleWorkspaceMcpEnabled: process.env.ENABLE_GOOGLE_WORKSPACE_MCP === "true",

  // ─── Google Ads / Analytics ────────────────────────────────────────────
  googleAdsConversionId: process.env.GOOGLE_ADS_CONVERSION_ID ?? "",
  googleAdsMpApiSecret: process.env.GOOGLE_ADS_MP_API_SECRET ?? "",

  // ─── Stripe ────────────────────────────────────────────────────────────
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",

  // ─── Telegram ──────────────────────────────────────────────────────────
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramOwnerChatId: process.env.TELEGRAM_OWNER_CHAT_ID ?? "",

  // ─── HDM ───────────────────────────────────────────────────────────────
  hdmProjectId: process.env.HDM_PROJECT_ID ?? "",
  hdmProjectName: process.env.HDM_PROJECT_NAME ?? "",
  hdmWebhookSecret: process.env.HDM_WEBHOOK_SECRET ?? "",

  // ─── Features ──────────────────────────────────────────────────────────
  backgroundJobsEnabled:
    isProduction || process.env.ENABLE_BACKGROUND_JOBS === "true",
  sequenceEmailSendingEnabled:
    process.env.ENABLE_SEQUENCE_EMAIL_SENDING === "true",
  // Governance feature flags — each capability can be disabled independently
  // for surgical rollback without reverting code.
  auditLogEnabled: process.env.AUDIT_LOG_ENABLED !== "false",
  llmCostTrackingEnabled: process.env.LLM_COST_TRACKING_ENABLED !== "false",
  llmBudgetEnforcementEnabled: process.env.LLM_BUDGET_ENFORCEMENT_ENABLED !== "false",
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== "false",
  karrEnabled: process.env.KARR_ENABLED !== "false",
  mcpAllowedTools: (process.env.MCP_ALLOWED_TOOLS ?? "")
    .split(",")
    .map(tool => tool.trim())
    .filter(Boolean),

  // ─── Frontend ──────────────────────────────────────────────────────────
  appId: process.env.VITE_APP_ID ?? "",
  frontendForgeApiUrl: process.env.VITE_FRONTEND_FORGE_API_URL ?? "https://app.leadgen.ai",
  ga4Id: process.env.VITE_GA4_ID ?? "",
};

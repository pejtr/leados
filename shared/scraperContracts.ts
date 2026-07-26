import { z } from "zod";

export const ScraperProviderSchema = z.enum([
  "firecrawl",
  "crawl4ai",
  "browser_use",
  "crawlee",
  "scrapy",
  "scrapling",
  "autoscraper",
  "curl_impersonate",
  "fallback_fetch"
]);

export type ScraperProvider = z.infer<typeof ScraperProviderSchema>;

export const ScrapeUrlOptionsSchema = z.object({
  provider: ScraperProviderSchema.optional(),
  waitForSelector: z.string().optional(),
  timeoutMs: z.number().optional(),
  extractMarkdown: z.boolean().optional(),
  extractMetadata: z.boolean().optional(),
  stealth: z.boolean().optional(),
  maxDepth: z.number().optional(),
});

export type ScrapeUrlOptions = z.infer<typeof ScrapeUrlOptionsSchema>;

export const ScrapedMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  statusCode: z.number().optional(),
  language: z.string().optional(),
  ogImage: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  hasSsl: z.boolean().optional(),
  hasContactForm: z.boolean().optional(),
  hasMobileMenu: z.boolean().optional(),
  hasOnlineBooking: z.boolean().optional(),
  hasGoogleAnalytics: z.boolean().optional(),
  hasSocialLinks: z.array(z.string()).optional(),
});

export type ScrapedMetadata = z.infer<typeof ScrapedMetadataSchema>;

export const ScrapeResultSchema = z.object({
  url: z.string(),
  success: z.boolean(),
  providerUsed: ScraperProviderSchema,
  markdown: z.string().optional(),
  html: z.string().optional(),
  metadata: ScrapedMetadataSchema.optional(),
  extractedData: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
  durationMs: z.number(),
});

export type ScrapeResult = z.infer<typeof ScrapeResultSchema>;

export const BrowserAgentTaskSchema = z.object({
  taskPrompt: z.string().min(3),
  startUrl: z.string().url().optional(),
  maxSteps: z.number().optional(),
  headless: z.boolean().optional(),
});

export type BrowserAgentTask = z.infer<typeof BrowserAgentTaskSchema>;

export const BrowserAgentStepSchema = z.object({
  stepNumber: z.number(),
  action: z.string(),
  thought: z.string().optional(),
  screenshotUrl: z.string().optional(),
  status: z.enum(["pending", "running", "success", "failed"]),
});

export type BrowserAgentStep = z.infer<typeof BrowserAgentStepSchema>;

export const BrowserAgentResultSchema = z.object({
  taskId: z.string(),
  success: z.boolean(),
  finalOutput: z.string(),
  steps: z.array(BrowserAgentStepSchema),
  durationMs: z.number(),
  error: z.string().optional(),
});

export type BrowserAgentResult = z.infer<typeof BrowserAgentResultSchema>;

export const ProviderStatusSchema = z.object({
  id: ScraperProviderSchema,
  name: z.string(),
  status: z.enum(["active", "degraded", "offline", "configured_mock"]),
  description: z.string(),
  latencyMs: z.number().optional(),
});

export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;

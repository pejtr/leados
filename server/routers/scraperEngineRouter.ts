import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { scraperEngine } from "../services/scraperEngine";
import {
  ScrapeUrlOptionsSchema,
  BrowserAgentTaskSchema,
} from "../../shared/scraperContracts";

export const scraperEngineRouter = router({
  /**
   * Scrapes a URL using the ONYX Unified Scraper Engine (Firecrawl, Crawl4AI, curl-impersonate, etc.)
   */
  scrapeUrl: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        options: ScrapeUrlOptionsSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await scraperEngine.scrapeUrl(input.url, input.options);
    }),

  /**
   * Runs an interactive AI browser task via Browser-Use Agent Engine
   */
  runAgentTask: protectedProcedure
    .input(BrowserAgentTaskSchema)
    .mutation(async ({ input }) => {
      return await scraperEngine.runBrowserAgent(input);
    }),

  /**
   * Monitors and validates offer price & health using AutoScraper & Scrapling pattern extraction
   */
  monitorOfferPrice: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        expectedPattern: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await scraperEngine.monitorOfferPrice(input.url, input.expectedPattern);
    }),

  /**
   * Retrieves current status and configuration of all 8 scraping providers
   */
  getProvidersStatus: protectedProcedure.query(() => {
    return scraperEngine.getProvidersStatus();
  }),
});

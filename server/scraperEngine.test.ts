import { describe, it, expect, vi } from "vitest";
import { scraperEngine } from "./services/scraperEngine";
import { scraperEngineRouter } from "./routers/scraperEngineRouter";

describe("ONYX Scraper Engine Service", () => {
  it("returns status for all 8 providers", () => {
    const statuses = scraperEngine.getProvidersStatus();
    expect(statuses).toHaveLength(8);

    const providerIds = statuses.map((s) => s.id);
    expect(providerIds).toContain("firecrawl");
    expect(providerIds).toContain("crawl4ai");
    expect(providerIds).toContain("browser_use");
    expect(providerIds).toContain("crawlee");
    expect(providerIds).toContain("scrapy");
    expect(providerIds).toContain("scrapling");
    expect(providerIds).toContain("autoscraper");
    expect(providerIds).toContain("curl_impersonate");
  });

  it("handles fallback scraping for a valid URL pattern", async () => {
    // Mock global fetch to return sample HTML
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Business Page</title>
          <meta name="description" content="Best AI Lead Generation Software" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <h1>Welcome to Test Business</h1>
          <p>Contact us at info@example.com for reservations and booking.</p>
          <a href="https://facebook.com/test">Facebook</a>
        </body>
      </html>
    `;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => mockHtml,
      json: async () => ({}),
    } as unknown as Response);

    try {
      const result = await scraperEngine.scrapeUrl("https://example.com", {
        extractMarkdown: true,
        stealth: true,
      });

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.title).toBe("Test Business Page");
      expect(result.metadata?.description).toBe("Best AI Lead Generation Software");
      expect(result.metadata?.hasOnlineBooking).toBe(true);
      expect(result.markdown).toContain("# Welcome to Test Business");
    } finally {

      globalThis.fetch = originalFetch;
    }
  });

  it("reports Browser-Use as unavailable when the service is not configured", async () => {
    const result = await scraperEngine.runBrowserAgent({
      taskPrompt: "Navigate to booking form and check input fields",
      startUrl: "https://example.com/booking",
    });

    expect(result.success).toBe(false);
    expect(result.taskId).toBeDefined();
    expect(result.steps).toEqual([]);
    expect(result.error).toContain("BROWSER_USE_AGENT_URL");
  });

  it("rejects private network targets", async () => {
    const result = await scraperEngine.scrapeUrl("http://127.0.0.1/internal");

    expect(result.success).toBe(false);
    expect(result.error).toContain("priv");
  });

  it("monitors offer prices via pattern matcher", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "<div>Special offer: 490 CZK for weekend stay</div>",
    } as unknown as Response);

    try {
      const res = await scraperEngine.monitorOfferPrice("https://do-italie.cz/offer/1");
      expect(res.isValid).toBe(true);
      expect(res.extractedPrice).toBe("490 CZK");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("Scraper Engine tRPC Router", () => {
  it("exposes getProvidersStatus procedure", async () => {
    const caller = scraperEngineRouter.createCaller({ user: { id: "test-user", role: "admin" } } as any);
    const statuses = await caller.getProvidersStatus();
    expect(statuses).toHaveLength(8);
  });
});

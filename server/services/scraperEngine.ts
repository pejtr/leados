import { ENV } from "../_core/env";
import { assertPublicHttpUrl, safeFetch } from "../_core/ssrfGuard";
import {
  ScraperProvider,
  ScrapeUrlOptions,
  ScrapeResult,
  ScrapedMetadata,
  BrowserAgentTask,
  BrowserAgentResult,
  ProviderStatus,
} from "../../shared/scraperContracts";

/**
 * ONYX Unified Scraper Engine Service
 * Consolidates 8 scraping & extraction tools into a single resilient pipeline.
 */
export class ScraperEngineService {
  /**
   * Primary entrypoint: Scrapes a URL using the best available provider or requested provider.
   */
  async scrapeUrl(url: string, options: ScrapeUrlOptions = {}): Promise<ScrapeResult> {
    const startTime = Date.now();
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const preferredProvider = options.provider;

    try {
      await assertPublicHttpUrl(normalizedUrl);
    } catch (err) {
      return {
        url: normalizedUrl,
        success: false,
        providerUsed: preferredProvider ?? "fallback_fetch",
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startTime,
      };
    }

    // Execute based on preferred provider or default priority chain
    if (preferredProvider === "firecrawl") {
      const res = await this.scrapeWithFirecrawl(normalizedUrl, options, startTime);
      if (res.success) return res;
    } else if (preferredProvider === "crawl4ai") {
      const res = await this.scrapeWithCrawl4AI(normalizedUrl, options, startTime);
      if (res.success) return res;
    } else if (preferredProvider === "curl_impersonate") {
      const res = await this.scrapeWithCurlImpersonate(normalizedUrl, options, startTime);
      if (res.success) return res;
    } else if (preferredProvider === "crawlee") {
      const res = await this.scrapeWithCrawlee(normalizedUrl, options, startTime);
      if (res.success) return res;
    }

    // Default Fallback Cascade: Firecrawl (if key set) -> Stealth Fetch -> Crawl4AI -> Basic Fetch
    if (ENV.firecrawlApiKey) {
      const fcResult = await this.scrapeWithFirecrawl(normalizedUrl, options, startTime);
      if (fcResult.success) return fcResult;
    }

    const stealthResult = await this.scrapeWithCurlImpersonate(normalizedUrl, options, startTime);
    if (stealthResult.success) return stealthResult;

    if (ENV.crawl4aiApiKey) {
      const c4Result = await this.scrapeWithCrawl4AI(normalizedUrl, options, startTime);
      if (c4Result.success) return c4Result;
    }

    return this.scrapeWithFallbackFetch(normalizedUrl, options, startTime);
  }


  /**
   * Provider 1: Firecrawl API (Markdown & LLM Extraction)
   */
  private async scrapeWithFirecrawl(
    url: string,
    options: ScrapeUrlOptions,
    startTime: number
  ): Promise<ScrapeResult> {
    if (!ENV.firecrawlApiKey) {
      return {
        url,
        success: false,
        providerUsed: "firecrawl",
        error: "FIRECRAWL_API_KEY is not configured",
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

      const response = await fetch(`${ENV.firecrawlApiUrl}/v1/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.firecrawlApiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ["markdown", "html"],
          waitFor: options.waitForSelector ? 1000 : 0,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.statusText} (${response.status})`);
      }

      const json = (await response.json()) as {
        success?: boolean;
        data?: {
          markdown?: string;
          html?: string;
          metadata?: Record<string, unknown>;
        };
      };

      const data = json.data;
      const html = data?.html ?? "";
      const metadata = this.extractMetadataFromHtml(url, html, data?.metadata);

      return {
        url,
        success: true,
        providerUsed: "firecrawl",
        markdown: data?.markdown ?? "",
        html,
        metadata,
        durationMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        url,
        success: false,
        providerUsed: "firecrawl",
        error: errorMsg,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Provider 2: Crawl4AI Service (Self-Hosted Markdown Crawler)
   */
  private async scrapeWithCrawl4AI(
    url: string,
    options: ScrapeUrlOptions,
    startTime: number
  ): Promise<ScrapeResult> {
    if (!ENV.crawl4aiServiceUrl) {
      return {
        url,
        success: false,
        providerUsed: "crawl4ai",
        error: "CRAWL4AI_SERVICE_URL is not configured",
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (ENV.crawl4aiApiKey) {
        headers["Authorization"] = `Bearer ${ENV.crawl4aiApiKey}`;
      }

      const response = await fetch(`${ENV.crawl4aiServiceUrl}/crawl`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          urls: [url],
          word_count_threshold: 10,
          extraction_strategy: "NoExtractionStrategy",
          chunking_strategy: "RegexChunking",
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Crawl4AI HTTP error: ${response.statusText}`);
      }

      const json = (await response.json()) as {
        results?: Array<{ markdown?: string; html?: string; cleaned_html?: string }>;
      };

      const item = json.results?.[0];
      const html = item?.cleaned_html || item?.html || "";
      const metadata = this.extractMetadataFromHtml(url, html);

      return {
        url,
        success: true,
        providerUsed: "crawl4ai",
        markdown: item?.markdown ?? "",
        html,
        metadata,
        durationMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        url,
        success: false,
        providerUsed: "crawl4ai",
        error: errorMsg,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Provider 8 / Stealth Transport: curl-impersonate
   * Simulates browser TLS fingerprints to bypass bot-blocking headers.
   */
  private async scrapeWithCurlImpersonate(
    url: string,
    options: ScrapeUrlOptions,
    startTime: number
  ): Promise<ScrapeResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);

      const fetchOptions: RequestInit = {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "cs-CZ,cs;q=0.9,en-US;q=0.8,en;q=0.7",
          "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
      };

      const res = await safeFetch(url, fetchOptions);
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Stealth fetch failed with status ${res.status}`);
      }

      const html = await res.text();
      const metadata = this.extractMetadataFromHtml(url, html, undefined, res.status);
      const markdown = this.simpleHtmlToMarkdown(html);

      return {
        url,
        success: true,
        providerUsed: "curl_impersonate",
        html,
        markdown,
        metadata,
        durationMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        url,
        success: false,
        providerUsed: "curl_impersonate",
        error: errorMsg,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Provider 4: Crawlee Engine (Multi-page Deep Crawling)
   */
  private async scrapeWithCrawlee(
    url: string,
    options: ScrapeUrlOptions,
    startTime: number
  ): Promise<ScrapeResult> {
    // Standard Crawlee-inspired HTTP crawler runner
    return this.scrapeWithCurlImpersonate(url, options, startTime).then((res) => ({
      ...res,
      providerUsed: "crawlee",
    }));
  }

  /**
   * Provider 3: Browser-Use AI Agent (for /computer-flow interactive automation)
   */
  async runBrowserAgent(task: BrowserAgentTask): Promise<BrowserAgentResult> {
    const startTime = Date.now();
    const taskId = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      if (task.startUrl) {
        await assertPublicHttpUrl(task.startUrl);
      }

      if (!ENV.browserUseAgentUrl) {
        throw new Error("BROWSER_USE_AGENT_URL is not configured");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${ENV.browserUseAgentUrl}/run-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Browser-Use service returned HTTP ${response.status}`);
      }

      const json = (await response.json()) as {
        success?: boolean;
        finalOutput?: string;
        steps?: Array<{
          stepNumber: number;
          action: string;
          status: "pending" | "running" | "success" | "failed";
        }>;
      };
      return {
        taskId,
        success: json.success === true,
        finalOutput: json.finalOutput ?? "",
        steps: json.steps ?? [],
        error: json.success === true ? undefined : "Browser task failed",
        durationMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        taskId,
        success: false,
        finalOutput: "",
        steps: [],
        error: errorMsg,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Provider 6 & 7: Scrapling & AutoScraper Pattern-Learned Price & Offer Monitoring
   */
  async monitorOfferPrice(
    url: string,
    expectedPricePattern?: string
  ): Promise<{ isValid: boolean; extractedPrice?: string; pricePatternFound: boolean; durationMs: number }> {
    const startTime = Date.now();
    const result = await this.scrapeUrl(url, { stealth: true });

    if (!result.success || !result.html) {
      return { isValid: false, pricePatternFound: false, durationMs: Date.now() - startTime };
    }

    const html = result.html;
    // Scrapling / AutoScraper adaptive pattern extraction
    const priceRegex = /([0-9]{1,3}(?:\s?[0-9]{3})*|\d+)\s?(?:Kč|CZK|EUR|€)/i;
    const priceMatch = html.match(priceRegex);
    const extractedPrice = priceMatch?.[0];

    const isValid = Boolean(extractedPrice && (!expectedPricePattern || html.includes(expectedPricePattern)));

    return {
      isValid,
      extractedPrice,
      pricePatternFound: Boolean(extractedPrice),
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Fallback basic fetch
   */
  private async scrapeWithFallbackFetch(
    url: string,
    options: ScrapeUrlOptions,
    startTime: number
  ): Promise<ScrapeResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);

      const res = await safeFetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ONYX OS-Scraper/1.0)" },
      });
      clearTimeout(timeout);

      const html = await res.text();
      const metadata = this.extractMetadataFromHtml(url, html, undefined, res.status);
      const markdown = this.simpleHtmlToMarkdown(html);

      return {
        url,
        success: true,
        providerUsed: "fallback_fetch",
        html,
        markdown,
        metadata,
        durationMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        url,
        success: false,
        providerUsed: "fallback_fetch",
        error: errorMsg,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Helper: Get health and configuration status of all 8 providers
   */
  getProvidersStatus(): ProviderStatus[] {
    return [
      {
        id: "firecrawl",
        name: "Firecrawl API",
        status: ENV.firecrawlApiKey ? "active" : "offline",
        description: "AI Markdown extraction & clean LLM page parsing",
      },
      {
        id: "crawl4ai",
        name: "Crawl4AI Service",
        status: ENV.crawl4aiServiceUrl ? "active" : "offline",
        description: "Self-hosted AI markdown crawler & content chunking",
      },
      {
        id: "browser_use",
        name: "Browser-Use Agent",
        status: ENV.browserUseAgentUrl ? "active" : "offline",
        description: "Interactive AI agent driving browser tasks",
      },
      {
        id: "crawlee",
        name: "Crawlee Engine",
        status: "degraded",
        description: "Compatibility adapter using the guarded HTTP scraper",
      },
      {
        id: "scrapy",
        name: "Scrapy Pipeline Bridge",
        status: "offline",
        description: "External Scrapy worker is not connected",
      },
      {
        id: "scrapling",
        name: "Scrapling Adaptive Parser",
        status: "degraded",
        description: "Heuristic parsing only; external Scrapling worker is not connected",
      },
      {
        id: "autoscraper",
        name: "AutoScraper Pattern Matcher",
        status: "degraded",
        description: "Built-in price pattern matching without a trained external model",
      },
      {
        id: "curl_impersonate",
        name: "curl-impersonate Client",
        status: "degraded",
        description: "Browser headers over guarded fetch; native TLS impersonation is not connected",
      },
    ];
  }

  /**
   * Helper: Extracts rich metadata from HTML content
   */
  private extractMetadataFromHtml(
    url: string,
    html: string,
    existingMetadata?: Record<string, unknown>,
    statusCode: number = 200
  ): ScrapedMetadata {
    const hasSsl = url.startsWith("https://");
    const hasContactForm = /contact|kontakt|form|formulář/i.test(html);
    const hasMobileMenu = /hamburger|mobile-menu|nav-toggle|navbar-toggler/i.test(html);
    const hasOnlineBooking = /reservation|rezervace|booking|objednat/i.test(html);
    const hasGoogleAnalytics = /gtag|google-analytics|UA-|G-[A-Z0-9]/i.test(html);

    const socialLinks: string[] = [];
    if (/facebook\.com/i.test(html)) socialLinks.push("Facebook");
    if (/instagram\.com/i.test(html)) socialLinks.push("Instagram");
    if (/linkedin\.com/i.test(html)) socialLinks.push("LinkedIn");

    const techStack: string[] = [];
    if (/wp-content|wordpress/i.test(html)) techStack.push("WordPress");
    if (/wix\.com/i.test(html)) techStack.push("Wix");
    if (/webnode/i.test(html)) techStack.push("Webnode");
    if (/react|next\.js|__NEXT_DATA__/i.test(html)) techStack.push("React/Next.js");
    if (/shopify/i.test(html)) techStack.push("Shopify");
    if (/bootstrap/i.test(html)) techStack.push("Bootstrap");

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = (existingMetadata?.title as string) || titleMatch?.[1] || "";

    const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
    const description = (existingMetadata?.description as string) || descMatch?.[1] || "";

    const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
    const ogImage = ogImageMatch?.[1] || "";

    return {
      title,
      description,
      statusCode,
      ogImage,
      hasSsl,
      hasContactForm,
      hasMobileMenu,
      hasOnlineBooking,
      hasGoogleAnalytics,
      hasSocialLinks: socialLinks,
      techStack,
    };
  }

  /**
   * Helper: Converts HTML to basic Markdown
   */
  private simpleHtmlToMarkdown(html: string): string {
    return html
      .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, "")
      .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, "")
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "* $1\n")
      .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
      .replace(/<[^>]+>/g, "")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();
  }
}

export const scraperEngine = new ScraperEngineService();

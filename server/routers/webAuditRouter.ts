import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { webAudits } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

interface AuditIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
}

interface AuditRecommendation {
  priority: number;
  title: string;
  description: string;
  impact: string;
}

async function fetchUrlMetadata(url: string) {
  try {
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadOS-Audit/1.0)" },
    });
    clearTimeout(timeout);
    const html = await res.text();
    const hasSsl = normalizedUrl.startsWith("https://");
    const hasContactForm = /contact|kontakt|form|formulář/i.test(html);
    const hasMobileMenu = /hamburger|mobile-menu|nav-toggle|navbar-toggler/i.test(html);
    const hasOnlineBooking = /reservation|rezervace|booking|objednat/i.test(html);
    const hasGoogleAnalytics = /gtag|google-analytics|UA-|G-[A-Z0-9]/i.test(html);
    const hasSocialLinks = /facebook\.com|instagram\.com|linkedin\.com/i.test(html);
    const techStack: string[] = [];
    if (/wp-content|wordpress/i.test(html)) techStack.push("WordPress");
    if (/wix\.com/i.test(html)) techStack.push("Wix");
    if (/webnode/i.test(html)) techStack.push("Webnode");
    if (/react|next\.js|__NEXT_DATA__/i.test(html)) techStack.push("React/Next.js");
    if (/shopify/i.test(html)) techStack.push("Shopify");
    if (/bootstrap/i.test(html)) techStack.push("Bootstrap");
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1] || "";
    const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
    const description = descMatch?.[1] || "";
    const hasMetaViewport = /<meta[^>]+name="viewport"/i.test(html);
    return {
      hasSsl, hasContactForm, hasMobileMenu, hasOnlineBooking,
      hasGoogleAnalytics, hasSocialLinks, techStack,
      title, description, hasMetaViewport,
      statusCode: res.status,
      htmlLength: html.length,
    };
  } catch {
    return null;
  }
}

function calculateScores(meta: Awaited<ReturnType<typeof fetchUrlMetadata>>) {
  if (!meta) return { overall: 0, performance: 0, seo: 0, mobile: 0, design: 0 };
  let seo = 0;
  if (meta.title) seo += 25;
  if (meta.description) seo += 25;
  if (meta.hasSsl) seo += 25;
  if (meta.hasGoogleAnalytics) seo += 25;
  let mobile = 0;
  if (meta.hasMetaViewport) mobile += 50;
  if (meta.hasMobileMenu) mobile += 30;
  if (!meta.techStack.includes("Wix") && !meta.techStack.includes("Webnode")) mobile += 20;
  let design = 0;
  if (meta.techStack.length > 0) design += 20;
  if (!meta.techStack.includes("Wix") && !meta.techStack.includes("Webnode")) design += 30;
  if (meta.hasSocialLinks) design += 20;
  if (meta.hasContactForm) design += 30;
  let performance = 0;
  if (meta.hasSsl) performance += 30;
  if (meta.htmlLength < 500000) performance += 40;
  if (meta.statusCode === 200) performance += 30;
  const overall = Math.round((seo + mobile + design + performance) / 4);
  return { overall, performance, seo, mobile, design };
}

function generateIssues(meta: Awaited<ReturnType<typeof fetchUrlMetadata>>): AuditIssue[] {
  const issues: AuditIssue[] = [];
  if (!meta) {
    issues.push({ severity: "critical", category: "Dostupnost", message: "Web není dostupný nebo neexistuje" });
    return issues;
  }
  if (!meta.hasSsl) issues.push({ severity: "critical", category: "Bezpečnost", message: "Web nemá SSL certifikát (HTTPS) — Google penalizuje HTTP weby" });
  if (!meta.title) issues.push({ severity: "critical", category: "SEO", message: "Chybí title tag — základní SEO prvek" });
  if (!meta.description) issues.push({ severity: "warning", category: "SEO", message: "Chybí meta description — ovlivňuje CTR ve vyhledávači" });
  if (!meta.hasMetaViewport) issues.push({ severity: "critical", category: "Mobilní verze", message: "Chybí viewport meta tag — web není optimalizován pro mobily" });
  if (!meta.hasContactForm) issues.push({ severity: "warning", category: "Konverze", message: "Chybí kontaktní formulář — zákazníci nemohou snadno kontaktovat firmu" });
  if (!meta.hasOnlineBooking) issues.push({ severity: "info", category: "Konverze", message: "Chybí online rezervace/objednávka — potenciál pro zvýšení tržeb" });
  if (!meta.hasGoogleAnalytics) issues.push({ severity: "warning", category: "Analytika", message: "Chybí Google Analytics — firma neví kolik návštěvníků má web" });
  if (meta.techStack.includes("Wix") || meta.techStack.includes("Webnode")) {
    issues.push({ severity: "warning", category: "Technologie", message: `Web je postaven na ${meta.techStack[0]} — omezené možnosti SEO a výkonu` });
  }
  if (!meta.hasSocialLinks) issues.push({ severity: "info", category: "Social Media", message: "Chybí propojení se sociálními sítěmi" });
  return issues;
}

function generateRecommendations(issues: AuditIssue[], meta: Awaited<ReturnType<typeof fetchUrlMetadata>>): AuditRecommendation[] {
  const recs: AuditRecommendation[] = [];
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  if (criticalCount > 0) {
    recs.push({ priority: 1, title: "Modernizace webu", description: `Web má ${criticalCount} kritických problémů. Nový web by zvýšil důvěryhodnost a SEO ranking.`, impact: "Zvýšení organické návštěvnosti o 40–80%" });
  }
  if (!meta?.hasOnlineBooking) {
    recs.push({ priority: 2, title: "Online rezervační systém", description: "Přidání online rezervace/objednávky přímo na web.", impact: "Zvýšení konverzí o 25–35%" });
  }
  if (!meta?.hasGoogleAnalytics) {
    recs.push({ priority: 3, title: "Nastavení analytiky", description: "Implementace Google Analytics pro sledování návštěvnosti a chování zákazníků.", impact: "Datově podložené rozhodování" });
  }
  recs.push({ priority: 4, title: "SEO optimalizace", description: "Optimalizace pro lokální vyhledávání (Google My Business + on-page SEO).", impact: "Více zákazníků z Google Maps" });
  return recs;
}

export const webAuditRouter = router({
  audit: protectedProcedure
    .input(
      z.object({
        url: z.string().url().or(z.string().min(4)),
        businessName: z.string().optional(),
        linkedGoogleMapsLeadId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const normalizedUrl = input.url.startsWith("http") ? input.url : `https://${input.url}`;
      const startTime = Date.now();
      const meta = await fetchUrlMetadata(normalizedUrl);
      const speedMs = Date.now() - startTime;
      const scores = calculateScores(meta);
      const issues = generateIssues(meta);
      const recommendations = generateRecommendations(issues, meta);

      let aiSummary = "";
      try {
        const res = await invokeLLM({
          messages: [
            { role: "system", content: "Jsi web audit expert. Piš v češtině. Buď konkrétní a akční. Max 4 věty." },
            {
              role: "user",
              content: `Shrň audit webu "${input.businessName || normalizedUrl}". Celkové skóre: ${scores.overall}/100. Kritické problémy: ${issues.filter(i => i.severity === "critical").map(i => i.message).join(", ") || "žádné"}. Technologie: ${meta?.techStack?.join(", ") || "neznámá"}.`,
            },
          ],
        });
        aiSummary = res.choices?.[0]?.message?.content || "";
      } catch {}

      await db.insert(webAudits).values({
        userId: ctx.user.id,
        url: normalizedUrl,
        businessName: input.businessName || "",
        overallScore: scores.overall,
        performanceScore: scores.performance,
        seoScore: scores.seo,
        mobileScore: scores.mobile,
        designScore: scores.design,
        speedMs,
        issues,
        recommendations,
        techStack: meta?.techStack || [],
        hasContactForm: meta?.hasContactForm ? 1 : 0,
        hasSsl: meta?.hasSsl ? 1 : 0,
        hasMobileMenu: meta?.hasMobileMenu ? 1 : 0,
        hasOnlineBooking: meta?.hasOnlineBooking ? 1 : 0,
        linkedGoogleMapsLeadId: input.linkedGoogleMapsLeadId,
        createdAt: Date.now(),
      });

      return {
        url: normalizedUrl,
        businessName: input.businessName,
        scores,
        issues,
        recommendations,
        techStack: meta?.techStack || [],
        meta: {
          hasSsl: meta?.hasSsl,
          hasContactForm: meta?.hasContactForm,
          hasMobileMenu: meta?.hasMobileMenu,
          hasOnlineBooking: meta?.hasOnlineBooking,
          hasGoogleAnalytics: meta?.hasGoogleAnalytics,
          title: meta?.title,
          speedMs,
        },
        aiSummary,
      };
    }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    return db
      .select()
      .from(webAudits)
      .where(eq(webAudits.userId, ctx.user.id))
      .orderBy(desc(webAudits.createdAt))
      .limit(50);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      const [audit] = await db
        .select()
        .from(webAudits)
        .where(eq(webAudits.id, input.id))
        .limit(1);
      return audit || null;
    }),
});

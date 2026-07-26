import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { webAudits } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM, extractText } from "../_core/llm";

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

import { scraperEngine } from "../services/scraperEngine";

async function fetchUrlMetadata(url: string) {
  try {
    const result = await scraperEngine.scrapeUrl(url, { stealth: true, extractMarkdown: true });
    if (!result.success || !result.metadata) {
      return null;
    }
    const meta = result.metadata;
    const html = result.html ?? "";
    const hasMetaViewport = /<meta[^>]+name="viewport"/i.test(html);

    return {
      hasSsl: meta.hasSsl ?? false,
      hasContactForm: meta.hasContactForm ?? false,
      hasMobileMenu: meta.hasMobileMenu ?? false,
      hasOnlineBooking: meta.hasOnlineBooking ?? false,
      hasGoogleAnalytics: meta.hasGoogleAnalytics ?? false,
      hasSocialLinks: (meta.hasSocialLinks?.length ?? 0) > 0,
      techStack: meta.techStack ?? [],
      title: meta.title ?? "",
      description: meta.description ?? "",
      hasMetaViewport,
      statusCode: meta.statusCode ?? 200,
      htmlLength: html.length,
      markdown: result.markdown ?? "",
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
        aiSummary = extractText(res.choices?.[0]?.message?.content) || "";
      } catch (err) {
        console.error("Failed to generate AI summary", err);
      }

      if (!db) throw new Error("DB not ready");

      const [inserted] = await db.insert(webAudits).values({
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
        id: (inserted as any).insertId,
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
    if (!db) throw new Error("DB not ready");
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
      if (!db) throw new Error("DB not ready");
      const [audit] = await db
        .select()
        .from(webAudits)
        .where(eq(webAudits.id, input.id))
        .limit(1);
      return audit || null;
    }),

  convertToLead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not ready");
      const { leads } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const [audit] = await db
        .select()
        .from(webAudits)
        .where(and(eq(webAudits.id, input.id), eq(webAudits.userId, ctx.user.id)))
        .limit(1);

      if (!audit) throw new Error("Audit nenalezen");

      let icebreaker = "";
      try {
        const res = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Jsi expert na B2B sales outreach. Piš v češtině. Buď konkrétní, přátelský a personalizovaný. Max 3 věty. Zaměř se na to, že jsi právě zkontroloval jejich web a nabízíš vylepšení.",
            },
            {
              role: "user",
              content: `Napiš personalizovaný icebreaker pro firmu s webem ${audit.url} (celkové skóre kvality webu: ${audit.overallScore}/100, výkon: ${audit.performanceScore}, mobil: ${audit.mobileScore}). Nabízím tvorbu nového a rychlejšího webu. Vyzvi k nezávazné 10-min konzultaci.`,
            },
          ],
        });
        icebreaker = extractText(res.choices?.[0]?.message?.content) || "";
      } catch (err) {
        console.error("Failed to generate icebreaker", err);
      }

      await db.insert(leads).values({
        sessionId: 0,
        userId: ctx.user.id,
        companyName: audit.businessName || audit.url,
        industry: "Web Audit",
        email: "",
        website: audit.url,
        dataSource: "web_audit",
        status: "new",
        icebreaker: icebreaker,
        companyDescription: `Zdroj: Web Audit\nSkóre webu: ${audit.overallScore}/100\n\nAI Icebreaker:\n${icebreaker}`,
      });

      return { success: true, icebreaker };
    }),
});

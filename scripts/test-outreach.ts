import "dotenv/config";
import { getDb } from "../server/db";
import { leads } from "../drizzle/schema";
import { invokeLLM } from "../server/_core/llm";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const GOOGLE_MAPS_ACTOR = "compass~crawler-google-places";

async function runApifyGoogleMaps(searchTerm: string, location: string, maxResults: number) {
    if (!APIFY_TOKEN) throw new Error("APIFY_TOKEN not configured");
    console.log(`[Google Maps] Starting search for "${searchTerm} ${location}" (limit: ${maxResults})...`);
    const runRes = await fetch(
        `https://api.apify.com/v2/acts/${GOOGLE_MAPS_ACTOR}/runs?token=${APIFY_TOKEN}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                searchStringsArray: [`${searchTerm} ${location}`],
                maxCrawledPlacesPerSearch: maxResults,
                language: "cs",
                countryCode: "cz",
                includeWebResults: false,
            }),
        }
    );
    if (!runRes.ok) throw new Error(`Apify run failed: ${runRes.statusText}`);
    const runData = await runRes.json();
    const runId = runData.data?.id;
    if (!runId) throw new Error("No run ID returned from Apify");

    process.stdout.write(`[Google Maps] Polling Apify run ${runId}`);
    for (let i = 0; i < 36; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
        const statusData = await statusRes.json();
        const status = statusData.data?.status;
        process.stdout.write(".");
        if (status === "SUCCEEDED") {
            process.stdout.write(" Done!\n");
            break;
        }
        if (status === "FAILED" || status === "ABORTED") throw new Error(`\nApify run ${status}`);
    }

    const runInfoRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
    const runInfo = await runInfoRes.json();
    const datasetId = runInfo.data?.defaultDatasetId;

    const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json&limit=${maxResults}`);
    return await itemsRes.json();
}

async function fetchUrlMetadata(url: string) {
    try {
        const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(normalizedUrl, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0 (compatible; OPTIHUB-Audit/1.0)" },
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
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch?.[1] || "";
        return {
            hasSsl, hasContactForm, hasMobileMenu, hasOnlineBooking,
            hasGoogleAnalytics, hasSocialLinks, techStack,
            title, statusCode: res.status, htmlLength: html.length,
        };
    } catch {
        return null;
    }
}

function calculateScores(meta: any) {
    if (!meta) return { overall: 0 };
    let seo = 0;
    if (meta.title) seo += 50;
    if (meta.hasSsl) seo += 25;
    if (meta.hasGoogleAnalytics) seo += 25;
    let mobile = 0;
    if (meta.hasMobileMenu) mobile += 50;
    if (!meta.techStack.includes("Wix") && !meta.techStack.includes("Webnode")) mobile += 50;
    let design = 0;
    if (meta.techStack.length > 0) design += 40;
    if (meta.hasSocialLinks) design += 30;
    if (meta.hasContactForm) design += 30;
    let performance = 0;
    if (meta.hasSsl) performance += 30;
    if (meta.htmlLength < 500000) performance += 40;
    if (meta.statusCode === 200) performance += 30;
    const overall = Math.round((seo + mobile + design + performance) / 4);
    return { overall };
}

async function runOutreachCampaign() {
    console.log("=========================================");
    console.log("🚀 STARTING OUTREACH TEST CAMPAIGN: Zubaři Praha (20 leads)");
    console.log("=========================================\n");

    const db = await getDb();
    if (!db) throw new Error("No database connection");

    // Administrator User ID (from users table, normally ID 1)
    const ADMIN_USER_ID = 1;

    // 1. Google Maps Extraction
    const places = await runApifyGoogleMaps("Zubní klinika", "Praha", 30);
    console.log(`[Google Maps] Extracted ${places.length} places.`);

    let processedCount = 0;
    const targetCount = 20;

    for (const place of places) {
        if (processedCount >= targetCount) break;

        const url = place.website;
        if (!url) continue;

        const name = place.title || place.name || "Neznámá klinika";

        console.log(`\n[Web Audit] Analyzing: ${name} (${url})`);

        // 2. Web Audit
        const meta = await fetchUrlMetadata(url);
        const scores = calculateScores(meta);
        console.log(`[Web Audit] Score: ${scores.overall}/100`);

        // 3. AI Icebreaker Generation
        let icebreaker = "";
        try {
            const prompt = `Jsi seniorní B2B obchodník. Tvým cílem je napsat 1 krátký, velmi přirozený personalizovaný otevírací odstavec (tzv. icebreaker) do cold e-mailu pro společnost ${name} s webem ${url}.
      Z webového auditu jsme zjistili skóre: ${scores.overall}/100.
      ${scores.overall < 70 ? "Skóre je nízké, web pravděpodobně ztrácí pacienty kvůli zastaralému webu, špatnému mobilnímu zobrazení nebo chybějící online rezervaci." : "Web mají docela dobrý, ale možná chybí automatizované zpracování leadů nebo moderní konverzní prvky."}
      
      Pravidla pro icebreaker:
      1. Musí znít lidsky, ne jako robot. Žádný formalismus.
      2. Cílem NENÍ rovnou prodávat, ale ukázat, že jsi opravdu byl na jejich webu.
      3. Nepoužívej slovo "audit" ani "skóre".
      4. Délka max 2 věty.
      5. Ty jsi specialista z ONYX OS, který pomáhá klinikám získávat více klientů přes webový ekosystém.
      
      Příklad: Všiml jsem si, že na vašem webu chybí možnost přímé online rezervace, a přijde mi to škoda, protože estetická stomatologie v Praze je teď obrovsky žádaná.
      Napiš pouze samotný text icebreakeru.`;

            icebreaker = (await invokeLLM({ messages: [{ role: "user", content: prompt }] })).choices[0].message.content as string;
            console.log(`[AI] Icebreaker generated: "${icebreaker}"`);
        } catch (e) {
            console.log(`[AI] Failed to generate icebreaker:`, e);
            icebreaker = `Zaujalo mě, jak na webu ${url} prezentujete služby, ale všiml jsem si několika míst, kde možná zbytečně přicházíte o nové pacienty.`;
        }

        // 4. CRM Lead Injection
        const sessionId = "test_outreach_" + Date.now();
        await db.insert(leads).values({
            sessionId: 0,
            userId: ADMIN_USER_ID,
            companyName: name,
            industry: "Zubní klinika",
            email: "",
            website: url,
            dataSource: "mock",
            status: "new",
            icebreaker: icebreaker,
            companyDescription: "Zdroj: OUTREACH TEST SCRIPT\nAdresa: " + (place.address || "") + "\nHodnocení: " + (place.totalScore || "") + " (" + (place.reviewsCount || 0) + " reviews)\nWeb Audit Skóre: " + scores.overall + "/100\n\nAI Icebreaker:\n" + icebreaker,
        });

        console.log(`[CRM] Lead saved: ${name}`);
        processedCount++;
    }

    console.log(`\n✅ TEST CAMPAIGN COMPLETE! Placed ${processedCount} fresh leads into CRM!`);
    process.exit(0);
}

runOutreachCampaign().catch(console.error);

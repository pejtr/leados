import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { googleMapsLeads, leads } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM, extractText } from "../_core/llm";
import { TRPCError } from "@trpc/server";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const GOOGLE_MAPS_ACTOR = "compass/crawler-google-places";

async function runApifyGoogleMaps(params: {
  searchTerm: string;
  location: string;
  maxResults: number;
}) {
  if (!APIFY_TOKEN) throw new Error("APIFY_TOKEN not configured");

  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${GOOGLE_MAPS_ACTOR}/runs?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStringsArray: [`${params.searchTerm} ${params.location}`],
        maxCrawledPlacesPerSearch: params.maxResults,
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

  // Poll until finished (max 3 minutes)
  for (let i = 0; i < 36; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );
    const statusData = await statusRes.json();
    const status = statusData.data?.status;
    if (status === "SUCCEEDED") break;
    if (status === "FAILED" || status === "ABORTED")
      throw new Error(`Apify run ${status}`);
  }

  const runInfoRes = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
  );
  const runInfo = await runInfoRes.json();
  const datasetId = runInfo.data?.defaultDatasetId;

  const itemsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json&limit=${params.maxResults}`
  );
  return await itemsRes.json();
}

function scoreWebQuality(place: Record<string, unknown>): number {
  let score = 0;
  const website = place.website as string | undefined;
  if (!website) return 0;
  if (website.includes("https")) score += 20;
  if (!website.includes("facebook.com") && !website.includes("instagram.com")) score += 20;
  if (website.includes("wix.com") || website.includes("webnode") || website.includes("webzdarma")) score -= 10;
  if (website.match(/^https?:\/\/[^/]+\.[a-z]{2,3}\/$/)) score += 20;
  const rating = parseFloat(String(place.totalScore || 0));
  if (rating >= 4.5) score += 20;
  else if (rating >= 4.0) score += 10;
  const reviews = Number(place.reviewsCount || 0);
  if (reviews >= 100) score += 20;
  else if (reviews >= 20) score += 10;
  return Math.max(0, Math.min(100, score));
}

export const googleMapsRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        searchTerm: z.string().min(1).max(100),
        location: z.string().min(1).max(100),
        maxResults: z.number().min(5).max(100).default(20),
        filterNoWebsite: z.boolean().default(false),
        filterLowScore: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const sessionId = `gms_${Date.now()}_${ctx.user.id}`;
      let places: Record<string, unknown>[];

      try {
        places = await runApifyGoogleMaps({
          searchTerm: input.searchTerm,
          location: input.location,
          maxResults: input.maxResults,
        });
      } catch (err) {
        console.error("[GoogleMaps] Apify search failed:", err);
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message:
            err instanceof Error && err.message === "APIFY_TOKEN not configured"
              ? "Google Maps vyhledávání není nakonfigurováno. Doplňte APIFY_TOKEN."
              : "Google Maps vyhledávání se nezdařilo. Nebyla uložena žádná náhradní demo data.",
          cause: err,
        });
      }

      const results = [];
      for (const place of places) {
        const hasWebsite = !!(place.website);
        const webScore = scoreWebQuality(place);

        if (input.filterNoWebsite && hasWebsite) continue;
        if (input.filterLowScore && webScore > 40) continue;

        const row = {
          userId: ctx.user.id,
          sessionId,
          placeId: String(place.placeId || place.id || ""),
          name: String(place.title || place.name || "Unknown"),
          category: String(place.categoryName || place.category || ""),
          address: String(place.address || place.street || ""),
          city: input.location,
          phone: String(place.phone || place.phoneUnformatted || ""),
          website: String(place.website || ""),
          hasWebsite: hasWebsite ? 1 : 0,
          webQualityScore: webScore,
          rating: String(place.totalScore || place.rating || ""),
          reviewsCount: Number(place.reviewsCount || 0),
          lat: String((place.location as Record<string, unknown>)?.lat || ""),
          lng: String((place.location as Record<string, unknown>)?.lng || ""),
          googleMapsUrl: String(place.url || place.googleMapsUrl || ""),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as const;

        await db.insert(googleMapsLeads).values(row);
        results.push(row);
      }

      return { sessionId, count: results.length, results };
    }),

  getBySession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db
        .select()
        .from(googleMapsLeads)
        .where(
          and(
            eq(googleMapsLeads.userId, ctx.user.id),
            eq(googleMapsLeads.sessionId, input.sessionId)
          )
        )
        .orderBy(googleMapsLeads.webQualityScore);
    }),

  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db
      .select()
      .from(googleMapsLeads)
      .where(eq(googleMapsLeads.userId, ctx.user.id))
      .orderBy(desc(googleMapsLeads.createdAt))
      .limit(200);

    const sessions: Record<string, { sessionId: string; city: string; count: number; noWebsite: number; createdAt: number }> = {};
    for (const row of rows) {
      if (!sessions[row.sessionId]) {
        sessions[row.sessionId] = {
          sessionId: row.sessionId,
          city: row.city || "",
          count: 0,
          noWebsite: 0,
          createdAt: row.createdAt,
        };
      }
      sessions[row.sessionId].count++;
      if (!row.hasWebsite) sessions[row.sessionId].noWebsite++;
    }
    return Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt);
  }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "interested", "converted", "rejected"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db
        .update(googleMapsLeads)
        .set({ status: input.status, notes: input.notes, updatedAt: Date.now() })
        .where(
          and(eq(googleMapsLeads.id, input.id), eq(googleMapsLeads.userId, ctx.user.id))
        );
      return { success: true };
    }),

  convertToLead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [gml] = await db
        .select()
        .from(googleMapsLeads)
        .where(and(eq(googleMapsLeads.id, input.id), eq(googleMapsLeads.userId, ctx.user.id)))
        .limit(1);
      if (!gml) throw new Error("Not found");

      let icebreaker = "";
      try {
        const res = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Jsi expert na B2B sales outreach. Piš v češtině. Buď konkrétní, přátelský a personalizovaný. Max 3 věty.",
            },
            {
              role: "user",
              content: `Napiš personalizovaný icebreaker pro firmu "${gml.name}" (${gml.category}) v ${gml.city}. ${gml.hasWebsite ? `Mají web: ${gml.website}` : "Nemají web."} Hodnocení: ${gml.rating} (${gml.reviewsCount} recenzí). Nabízím tvorbu moderního webu.`,
            },
          ],
        });
        icebreaker = extractText(res.choices?.[0]?.message?.content) || "";
      } catch { }

      await db.insert(leads).values({
        sessionId: 0,
        userId: ctx.user.id,
        companyName: gml.name,
        industry: gml.category || "Google Maps",
        email: "",
        website: gml.website || "",
        dataSource: "google_maps",
        status: "new",
        icebreaker,
        companyDescription: `Zdroj: Google Maps | Hodnocení: ${gml.rating} (${gml.reviewsCount} recenzí)\nAdresa: ${gml.address}\n\nAI Icebreaker:\n${icebreaker}`,
      });

      await db
        .update(googleMapsLeads)
        .set({ status: "converted", updatedAt: Date.now() })
        .where(eq(googleMapsLeads.id, input.id));

      return { success: true, icebreaker };
    }),
});

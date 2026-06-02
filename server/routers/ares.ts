/**
 * ARES Router — Czech Business Registry (Obchodní rejstřík)
 * Uses the official ARES REST API: https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/
 * Free, no API key required, rate limit: ~10 req/s
 */
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

const ARES_BASE = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";

export type AresSubject = {
  ico: string;
  obchodniJmeno: string;
  sidlo: {
    textovaAdresa?: string;
    nazevObce?: string;
    psc?: number;
    nazevUlice?: string;
    cisloDomovni?: number;
  };
  pravniForma?: string;
  stavSubjektu?: string;
  datumVzniku?: string;
  nace?: string[];
};

async function fetchAres(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(options?.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const aresRouter = router({
  // Search by company name or IČO
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(2).max(100),
      count: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }) => {
      const { query, count } = input;

      // If query looks like IČO (8 digits), fetch directly
      if (/^\d{6,8}$/.test(query.trim())) {
        const ico = query.trim().padStart(8, "0");
        const data = await fetchAres(`${ARES_BASE}/${ico}`);
        if (data) {
          return {
            subjects: [mapSubject(data)],
            total: 1,
            query,
          };
        }
      }

      // Search by company name
      const data = await fetchAres(`${ARES_BASE}/vyhledat`, {
        method: "POST",
        body: JSON.stringify({
          obchodniJmeno: query,
          pocet: count,
          start: 0,
        }),
      });

      if (!data) {
        return { subjects: [], total: 0, query };
      }

      const subjects = (data.ekonomickeSubjekty ?? []).map(mapSubject);
      return {
        subjects,
        total: data.pocetCelkem ?? subjects.length,
        query,
      };
    }),

  // Get full detail by IČO
  detail: protectedProcedure
    .input(z.object({ ico: z.string().min(6).max(8) }))
    .query(async ({ input }) => {
      const ico = input.ico.padStart(8, "0");
      const data = await fetchAres(`${ARES_BASE}/${ico}`);
      if (!data) return null;
      return mapSubjectDetail(data);
    }),

  // Import company as lead
  importAsLead: protectedProcedure
    .input(z.object({
      ico: z.string(),
      obchodniJmeno: z.string(),
      adresa: z.string().optional(),
      obec: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Import into leads table via existing lead creation
      const { getDb } = await import("../db");
      const db = getDb();
      const { leads } = await import("../../drizzle/schema");

      const [lead] = await db.insert(leads).values({
        userId: ctx.user.id,
        companyName: input.obchodniJmeno,
        location: input.adresa ?? input.obec ?? null,
        source: "ares",
        status: "new",
        score: 50,
        notes: `IČO: ${input.ico}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return { success: true, leadId: lead.id };
    }),
});

function mapSubject(d: any): AresSubject {
  return {
    ico: d.ico ?? "",
    obchodniJmeno: d.obchodniJmeno ?? "",
    sidlo: {
      textovaAdresa: d.sidlo?.textovaAdresa,
      nazevObce: d.sidlo?.nazevObce,
      psc: d.sidlo?.psc,
      nazevUlice: d.sidlo?.nazevUlice,
      cisloDomovni: d.sidlo?.cisloDomovni,
    },
    pravniForma: d.pravniForma,
    stavSubjektu: d.stavSubjektu,
    datumVzniku: d.datumVzniku,
    nace: d.czNace?.map((n: any) => n.nazev).filter(Boolean) ?? [],
  };
}

function mapSubjectDetail(d: any) {
  return {
    ...mapSubject(d),
    // Additional fields available in detail view
    datumZaniku: d.datumZaniku,
    obory: d.czNace?.map((n: any) => ({ kod: n.kod, nazev: n.nazev })) ?? [],
    registrace: d.zaznamy?.map((z: any) => ({
      typRegistrace: z.typRegistrace?.nazev,
      organ: z.organ?.nazev,
      datumZapisu: z.datumZapisu,
    })) ?? [],
  };
}

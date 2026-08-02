/**
 * LinkedIn Prospecting Service
 *
 * Sběr a kvalifikace LinkedIn leadů pomocí AI.
 * Používá Claude API pro analýzu profilů a ICP scoring.
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { prospects } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { type EvidenceClaim } from "./leados/types";

export interface LinkedInProfile {
  linkedinUrl: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  companyWebsite?: string;
  title?: string;
  industry?: string;
  employeeCount?: string;
  revenue?: string;
  location?: string;
  about?: string;
  currentRole?: string;
}

/**
 * ICP & Offer Contract — přesné zadání pro jedno hledání (viz icp.schema.json).
 * Bez této smlouvy engine neběží.
 */
export interface IcpContract {
  offer: string;
  segment: string;
  size?: string;
  decisionMaker?: string[];
  signals?: string[];
  exclude?: string[];
  minScore?: number;
  maxCandidatesPerDay?: number;
}

export interface IcpCriteria {
  industries?: string[];
  titles?: string[];
  revenueRange?: string;
  employeeCount?: string;
  location?: string;
  minScore?: number; // Minimum ICP score to qualify (0-100)
}

export interface EvidenceScore {
  fitScore: number; // 0-100 shoda s ICP
  timingScore: number; // 0-100, jak aktuální je příležitost
  reason: string;
  painHypothesis: string;
  whyThisCompany: string;
  verifiedSignals: EvidenceClaim[];
  sourceEvidence: string[];
}

// ─── ICP Scoring ──────────────────────────────────────────────────────────────

export async function scoreProspect(profile: LinkedInProfile, icp: IcpContract | IcpCriteria): Promise<EvidenceScore> {
  const c = icp as IcpContract & IcpCriteria;
  const industries = c.industries;
  const titles = c.titles ?? c.decisionMaker;
  const revenueRange = c.revenueRange;
  const employeeCount = c.employeeCount ?? c.size;
  const location = c.location;
  const signals = c.signals;
  const offer = c.offer;

  const systemPrompt = `Jsi expert na B2B prodej a kvalifikaci leadů. Analyzuj LinkedIn profil a ohodnoť, jak dobře odpovídá ICP.

ICP kritéria:
- Nabídka: ${offer || "jakákoliv"}
- Obor/průmysl: ${industries?.join(", ") || "jakýkoliv"}
- Pozice: ${titles?.join(", ") || "jakákoliv"}
- Obrat: ${revenueRange || "neurčeno"}
- Velikost firmy: ${employeeCount || "neurčeno"}
- Lokace: ${location || "ČR"}
- Signály: ${signals?.join(", ") || "žádné"}

EVIDENCE-FIRST:
- Ke každému signálu uveď veřejný důkaz (evidenceUrl).
- Rozliš evidenceType: verified_fact | probable_signal | business_hypothesis | recommendation.
- business_hypothesis NESMÍ být vydávána za ověřený fakt.

Odpověz ve formátu JSON:
{
  "fitScore": 0-100,
  "timingScore": 0-100,
  "reason": "stručné zdůvodnění skóre",
  "painHypothesis": "obchodní hypotéza (ne fakt)",
  "whyThisCompany": "proč má smysl oslovit zrovna tuto firmu",
  "verifiedSignals": [{"claim": "...", "evidenceType": "...", "evidenceUrl": "..."}],
  "sourceEvidence": ["url1", "url2"]
}`;

  const userPrompt = `Analyzuj tento LinkedIn profil:

Jméno: ${profile.name}
Pozice: ${profile.title || "neuvedeno"}
Firma: ${profile.company || "neuvedeno"}
Obor: ${profile.industry || "neuvedeno"}
Velikost firmy: ${profile.employeeCount || "neuvedeno"}
Obrat: ${profile.revenue || "neuvedeno"}
Lokace: ${profile.location || "neuvedeno"}
O mně: ${profile.about || "neuvedeno"}
Současná role: ${profile.currentRole || "neuvedeno"}
Web: ${profile.companyWebsite || "neuvedeno"}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = (response as any).choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        fitScore: Math.min(100, Math.max(0, parsed.fitScore || 0)),
        timingScore: Math.min(100, Math.max(0, parsed.timingScore || 0)),
        reason: parsed.reason || "Bez zdůvodnění",
        painHypothesis: parsed.painHypothesis || "",
        whyThisCompany: parsed.whyThisCompany || "",
        verifiedSignals: Array.isArray(parsed.verifiedSignals) ? parsed.verifiedSignals : [],
        sourceEvidence: Array.isArray(parsed.sourceEvidence) ? parsed.sourceEvidence : [],
      };
    }
    return emptyScore("Nepodařilo se analyzovat profil");
  } catch (error) {
    console.error("[Prospecting] ICP scoring failed:", error);
    return emptyScore("Chyba při analýze");
  }
}

function emptyScore(reason: string): EvidenceScore {
  return { fitScore: 0, timingScore: 0, reason, painHypothesis: "", whyThisCompany: "", verifiedSignals: [], sourceEvidence: [] };
}

// ─── Prospect Management ──────────────────────────────────────────────────────

export async function addProspect(profile: LinkedInProfile, source?: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(prospects).values({
      linkedinUrl: profile.linkedinUrl,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      company: profile.company,
      companyWebsite: profile.companyWebsite,
      title: profile.title,
      industry: profile.industry,
      employeeCount: profile.employeeCount,
      revenue: profile.revenue,
      location: profile.location,
      about: profile.about,
      currentRole: profile.currentRole,
      source: source || "linkedin",
    });
    return (result as any).insertId || 0;
  } catch (error) {
    console.error("[Prospecting] Failed to add prospect:", error);
    return null;
  }
}

export async function qualifyProspect(prospectId: number, icp: IcpCriteria): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const prospect = await db.select().from(prospects).where(eq(prospects.id, prospectId)).limit(1);
    if (!prospect[0]) return false;

    const profile: LinkedInProfile = {
      linkedinUrl: prospect[0].linkedinUrl || "",
      name: prospect[0].name,
      email: prospect[0].email || undefined,
      company: prospect[0].company || undefined,
      title: prospect[0].title || undefined,
      industry: prospect[0].industry || undefined,
      employeeCount: prospect[0].employeeCount || undefined,
      revenue: prospect[0].revenue || undefined,
      location: prospect[0].location || undefined,
      about: prospect[0].about || undefined,
      currentRole: prospect[0].currentRole || undefined,
    };

    const scored = await scoreProspect(profile, icp);
    const minScore = icp.minScore ?? 50;
    const qualified = scored.fitScore >= minScore;

    await db.update(prospects).set({
      icpScore: scored.fitScore,
      icpReason: scored.reason,
      painPoints: scored.painHypothesis,
      notes: JSON.stringify({
        timingScore: scored.timingScore,
        whyThisCompany: scored.whyThisCompany,
        verifiedSignals: scored.verifiedSignals,
        sourceEvidence: scored.sourceEvidence,
      }),
      status: qualified ? "qualified" : "unqualified",
      updatedAt: new Date(),
    }).where(eq(prospects.id, prospectId));

    return qualified;
  } catch (error) {
    console.error("[Prospecting] Failed to qualify prospect:", error);
    return false;
  }
}

export async function getQualifiedProspects(icp: IcpCriteria, limit: number = 50): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const minScore = icp.minScore ?? 50;
  return await db.select()
    .from(prospects)
    .where(and(
      eq(prospects.status, "qualified"),
    ))
    .orderBy(desc(prospects.icpScore))
    .limit(limit);
}

export async function getProspectStats(): Promise<{ total: number; qualified: number; contacted: number; replied: number; converted: number }> {
  const db = await getDb();
  if (!db) return { total: 0, qualified: 0, contacted: 0, replied: 0, converted: 0 };

  const all = await db.select().from(prospects);
  return {
    total: all.length,
    qualified: all.filter(p => p.status === "qualified").length,
    contacted: all.filter(p => p.status === "contacted").length,
    replied: all.filter(p => p.status === "replied").length,
    converted: all.filter(p => p.status === "converted").length,
  };
}

// ─── Bulk Import ──────────────────────────────────────────────────────────────

export async function importProspectsFromCsv(csvData: string, icp: IcpCriteria): Promise<{ imported: number; qualified: number; failed: number }> {
  const lines = csvData.trim().split("\n");
  const headers = lines[0].split(";").map(h => h.trim().toLowerCase());

  let imported = 0;
  let qualified = 0;
  let failed = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(";").map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

    const profile: LinkedInProfile = {
      linkedinUrl: row["linkedin_url"] || row["linkedin"] || row["url"] || "",
      name: row["name"] || row["jméno"] || "",
      email: row["email"] || "",
      phone: row["phone"] || row["telefon"] || "",
      company: row["company"] || row["firma"] || "",
      title: row["title"] || row["pozice"] || "",
      industry: row["industry"] || row["obor"] || "",
      employeeCount: row["employees"] || row["velikost"] || "",
      revenue: row["revenue"] || row["obrat"] || "",
      location: row["location"] || row["lokace"] || "",
    };

    if (!profile.name || !profile.linkedinUrl) {
      failed++;
      continue;
    }

    const prospectId = await addProspect(profile, "csv-import");
    if (prospectId) {
      imported++;
      const isQualified = await qualifyProspect(prospectId, icp);
      if (isQualified) qualified++;
    } else {
      failed++;
    }
  }

  return { imported, qualified, failed };
}

/**
 * AI Outreach Agent
 *
 * Generování personalizovaných LinkedIn zpráv pomocí Claude/ChatGPT.
 * Využívá profil prospecta + ICP + pain points pro vytvoření relevantní zprávy.
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { prospects, outreachTemplates } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { type MessageVariant, type CreepRisk, type EvidenceClaim } from "./leados/types";

export type MessageType = "connection_request" | "first_message" | "follow_up" | "breakup";

interface GenerateMessageParams {
  prospectId: number;
  messageType: MessageType;
  templateId?: number;
  customInstructions?: string;
  /** Experimentální varianta oslovení (A/B/C/D). */
  variant?: MessageVariant;
  /** Veřejné důkazy pro tvrzení v zprávě (evidence-first personalizace). */
  evidence?: EvidenceClaim[];
}

interface GeneratedMessage {
  subject?: string;
  content: string;
  approach: string;
  reasoning: string;
  /** Skóre rizika "digitálního stalkingu" (0–100). */
  creepRisk: CreepRisk;
  /** LinkedIn zprávy se NIKDY neodesílají automaticky — vyžadují lidské schválení. */
  requiresManualApproval: true;
  /** Použitá experimentální varianta. */
  variant?: MessageVariant;
  /** Důkazy přiložené k návrhu. */
  evidence?: EvidenceClaim[];
}

// ─── Message Generation ────────────────────────────────────────────────────────

export async function generateOutreachMessage(params: GenerateMessageParams): Promise<GeneratedMessage | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get prospect data
    const prospect = await db.select().from(prospects).where(eq(prospects.id, params.prospectId)).limit(1);
    if (!prospect[0]) return null;

    const p = prospect[0];

    // Get template if specified
    let template: any = null;
    if (params.templateId) {
      const t = await db.select().from(outreachTemplates).where(eq(outreachTemplates.id, params.templateId)).limit(1);
      template = t[0];
    }

    // Build system prompt based on message type
    const systemPrompt = buildSystemPrompt(params.messageType, template, params.variant);

    // Build user prompt with prospect data
    const userPrompt = buildUserPrompt(p, params.messageType, params.evidence);

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = (response as any).choices?.[0]?.message?.content || "";
    return parseGeneratedMessage(raw, params.messageType, params.variant, params.evidence);
  } catch (error) {
    console.error("[OutreachAgent] Message generation failed:", error);
    return null;
  }
}

function buildSystemPrompt(messageType: MessageType, template: any, variant?: MessageVariant): string {
  const basePrompt = `Jsi expert na B2B outbound prodej na LinkedIn. Tvým úkolem je napsat personalizovanou zprávu pro potenciálního klienta.

Pravidla:
- Zpráva musí být osobní, ne šablonovaná
- Max 300 znaků pro connection request, 600 znaků pro zprávu
- Používej konkrétní detaily z profilu
- Nepoužívej "Ahoj [jméno]" - buď kreativní
- Jazyk: český (pokud je prospect z ČR), jinak anglický
- Cíl: dostat odpověď, ne prodat hned

EVIDENCE-FIRST PERSONALIZACE:
- Každé tvrzení o firmě/profilu musí mít veřejný důkaz (evidenceUrl).
- Rozlišuj: verified_fact (ověřený fakt), probable_signal (pravděpodobný signál),
  business_hypothesis (obchodní hypotéza — NESMÍ být vydávána za fakt), recommendation (naše doporučení).
- Nikdy netvrď "ztrácíte zákazníky" apod. bez důkazu.

CREEP GUARD (skóre rizika musí zůstat nízké):
- Nezmiňuj příliš osobní detaily z historie profilu.
- Neukazuj, kolik informací o člověku víš.
- Žádná falešná chvála, předstírání vztahu, ani zmínky o rodině/bydlišti.
- Nezneužívej soukromé události. Neobcházej jako automatický odstavec.

HUMAN-IN-THE-LOOP:
- Zprávu NIKDY neodesílej automaticky. Připrav ji k ručnímu odeslání člověkem.
- Žádný LinkedIn bot, žádné automatické přidávání kontaktů.

VARIANTA:
- A: krátké spojení bez nabídky
- B: relevantní pozorování (veřejný signál)
- C: nabídka mini auditu
- D: reakce na veřejný firemní signál`;

  switch (messageType) {
    case "connection_request":
      return basePrompt + `\n\nFormát: LinkedIn connection request (max 300 znaků). Žádný prodej, jen důvod pro připojení. Varianta: ${variant ?? "A"}.`;

    case "first_message":
      return basePrompt + `\n\nFormát: První zpráva po přijetí spojení. Představ se, zmín konkrétní detail z profilu, nabídnu hodnotu (ne prodej). Max 600 znaků. Varianta: ${variant ?? "C"}.`;

    case "follow_up":
      return basePrompt + `\n\nFormát: Follow-up zpráva (pokud neodpověděli). Buď nenucený, přidej novou hodnotu nebo insight. Max 600 znaků. Varianta: ${variant ?? "B"}.`;

    case "breakup":
      return basePrompt + `\n\nFormát: Poslední zpráva v sekvenci. Slušně se rozluč, nech otevřené dveře. Max 600 znaků.`;

    default:
      return basePrompt;
  }
}

function buildUserPrompt(prospect: any, messageType: MessageType, evidence?: EvidenceClaim[]): string {
  const evidenceBlock = evidence?.length
    ? `\n\nDŮKAZY (použij jen ty, vždy s odkazem):\n${evidence
        .map(e => `- [${e.evidenceType}] ${e.claim}${e.evidenceUrl ? ` (${e.evidenceUrl})` : ""}`)
        .join("\n")}`
    : "";

  return `Napiš ${messageType === "connection_request" ? "connection request" : "zprávu"} pro tohoto prospecta:

JMÉNO: ${prospect.name}
POZICE: ${prospect.title || "neuvedeno"}
FIRMA: ${prospect.company || "neuvedeno"}
OBOR: ${prospect.industry || "neuvedeno"}
VELOST FIRMY: ${prospect.employeeCount || "neuvedeno"}
OBRAT: ${prospect.revenue || "neuvedeno"}
LOKACE: ${prospect.location || "neuvedeno"}
O MNĚ: ${prospect.about || "neuvedeno"}
SOUČASNÁ ROLE: ${prospect.currentRole || "neuvedeno"}
WEB: ${prospect.companyWebsite || "neuvedeno"}
PAIN POINTS: ${prospect.painPoints || "neuvedeno"}
ICP SKÓRE: ${prospect.icpScore || 0}/100
ICP DŮVOD: ${prospect.icpReason || "neuvedeno"}
${evidenceBlock}

${messageType === "follow_up" ? "POZNÁMKA: Je to follow-up, prospect zatím neodpověděl." : ""}
${messageType === "breakup" ? "POZNÁMKA: Je to poslední zpráva, prospect nereagoval na předchozí zprávy." : ""}

Odpověz ve formátu JSON:
{
  "content": "text zprávy",
  "approach": "jaký přístup jsi zvolil a proč",
  "reasoning": "proč si myslíš, že to zabere"
}`;
}

/**
 * Deterministický Creep Guard. Doplňuje LLM kontrolu o pravidla, která nejdou obejít.
 * Vrací skóre 0–100 a seznam flags. Skóre > 40 → zprávu zamítnout k ruční revizi.
 */
export function assessCreep(message: string): CreepRisk {
  const flags: string[] = [];
  const text = message.toLowerCase();
  let score = 0;

  const personalHistory = [/v roce \d{4}/, /rok[ue]? \d{4}/, /před \d+ (lety|roky|týdn)/, /minul(ý|é|ou) (týden|měsíc)/];
  for (const re of personalHistory) {
    if (re.test(text)) {
      flags.push("příliš osobní historie");
      score += 25;
      break;
    }
  }

  const stalking = [/viděl jsem, že/, /viděla jsem, že/, /všiml jsem si, že sleduj/, /četl jsem, že jsi/];
  for (const re of stalking) {
    if (re.test(text)) {
      flags.push("působí jako sledování");
      score += 30;
      break;
    }
  }

  if (/(rodina|manžel|manželka|děti|syn|dcera|bydlišt|adresa)/.test(text)) {
    flags.push("zmínka o rodině/bydlišti");
    score += 30;
  }
  if (/(jsme přátelé|známe se|pamatuji si tě|naše setkání)/.test(text)) {
    flags.push("předstírání vztahu");
    score += 25;
  }
  if (message.length > 0 && /!/g.test(message) && (message.match(/!/g)?.length ?? 0) >= 3) {
    flags.push("příliš agresivní interpunkce");
    score += 10;
  }

  return { score: Math.min(100, score), flags };
}

function parseGeneratedMessage(raw: string, messageType: MessageType, variant?: MessageVariant, evidence?: EvidenceClaim[]): GeneratedMessage {
  const base = { requiresManualApproval: true as const, variant, evidence };
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const content = parsed.content || raw;
      return {
        content,
        approach: parsed.approach || "",
        reasoning: parsed.reasoning || "",
        creepRisk: assessCreep(content),
        ...base,
      };
    }
    return { content: raw, approach: "", reasoning: "", creepRisk: assessCreep(raw), ...base };
  } catch {
    return { content: raw, approach: "", reasoning: "", creepRisk: assessCreep(raw), ...base };
  }
}

// ─── Template Management ──────────────────────────────────────────────────────

export async function createOutreachTemplate(data: {
  name: string;
  category: MessageType;
  industry?: string;
  title: string;
  content: string;
  variables?: string[];
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(outreachTemplates).values({
      name: data.name,
      category: data.category,
      industry: data.industry,
      title: data.title,
      content: data.content,
      variables: data.variables ? JSON.stringify(data.variables) : null,
    });
    return (result as any).insertId || 0;
  } catch (error) {
    console.error("[OutreachAgent] Failed to create template:", error);
    return null;
  }
}

export async function getTemplatesByCategory(category: MessageType, industry?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(outreachTemplates.category, category)];
  if (industry) {
    conditions.push(eq(outreachTemplates.industry, industry));
  }

  return await db.select()
    .from(outreachTemplates)
    .where(conditions.length === 1 ? conditions[0] : undefined)
    .orderBy(outreachTemplates.performanceScore);
}

export async function updateTemplatePerformance(templateId: number, replied: boolean) {
  const db = await getDb();
  if (!db) return;

  try {
    const template = await db.select().from(outreachTemplates).where(eq(outreachTemplates.id, templateId)).limit(1);
    if (!template[0]) return;

    const newUses = template[0].totalUses + 1;
    const newReplies = template[0].totalReplies + (replied ? 1 : 0);
    const newScore = Math.round((newReplies / newUses) * 100);

    await db.update(outreachTemplates).set({
      totalUses: newUses,
      totalReplies: newReplies,
      performanceScore: newScore,
      updatedAt: new Date(),
    }).where(eq(outreachTemplates.id, templateId));
  } catch (error) {
    console.error("[OutreachAgent] Failed to update template performance:", error);
  }
}

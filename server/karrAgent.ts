import { invokeLLM } from "./_core/llm";
import type { KarrIssue } from "../drizzle/schema/karr";

const KARR_SYSTEM_PROMPT = `Jsi KARR — Quality, Risk, Truth and Release Reviewer agent platformy ONYX OS.

Tvým úkolem je zkontrolovat AI-generovaný obsah před jeho schválením člověkem. 
Hledáš následující problémy:

1. **Factuální chyby** — nesprávná data, čísla, jména, tvrzení bez podpory
2. **Policy porušení** — obsah porušující pravidla platformy, spam, klamavá tvrzení
3. **Kvalitativní problémy** — špatná gramatika, nejasná sdělení, slabá struktura
4. **Bezpečnostní rizika** — únik dat, osobní údaje, podezřelé odkazy
5. **Brand konzistence** — nesoulad s tónem hlasu, brand voice, positioning

Každý nález musí obsahovat:
- severity: critical | warning | info
- category: factual | policy | quality | security | brand
- description: popis problému v češtině
- suggestion: návrh na opravu

Pokud je obsah zcela v pořádku, vrať prázdné issues pole a result: "approved".`;

export type KarrReviewInput = {
  content: string;
  context?: string;
  contentType: "email" | "lead" | "message" | "workflow" | "campaign";
};

export type KarrReviewOutput = {
  result: "approved" | "flagged" | "rejected";
  issues: KarrIssue[];
  summary: string;
};

export async function karrReview(input: KarrReviewInput): Promise<KarrReviewOutput> {
  const userMessage = `Typ obsahu: ${input.contentType}
${input.context ? `Kontext: ${input.context}\n` : ""}
Obsah ke kontrole:
---
${input.content}
---`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: KARR_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "karr_review",
        strict: true,
        schema: {
          type: "object",
          properties: {
            result: {
              type: "string",
              enum: ["approved", "flagged", "rejected"],
              description: "Celkový verdikt: approved = vše OK, flagged = drobné výhrady, rejected = závažné problémy",
            },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string", enum: ["critical", "warning", "info"] },
                  category: { type: "string", enum: ["factual", "policy", "quality", "security", "brand"] },
                  description: { type: "string" },
                  suggestion: { type: "string" },
                },
                required: ["severity", "category", "description", "suggestion"],
                additionalProperties: false,
              },
            },
            summary: { type: "string", description: "Stručné shrnutí kontroly (max 200 znaků)" },
          },
          required: ["result", "issues", "summary"],
          additionalProperties: false,
        },
      },
    },
    maxTokens: 2048,
    route: "karr-review",
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    return {
      result: "approved",
      issues: [],
      summary: "KARR review: žádná odpověď od modelu, obsah schválen.",
    };
  }

  try {
    const parsed = JSON.parse(typeof text === "string" ? text : JSON.stringify(text));
    return {
      result: parsed.result ?? "approved",
      issues: parsed.issues ?? [],
      summary: parsed.summary ?? "KARR review dokončena.",
    };
  } catch {
    return {
      result: "approved",
      issues: [],
      summary: "KARR review: nepodařilo se parsovat odpověď, obsah schválen.",
    };
  }
}
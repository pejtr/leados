/**
 * CML dual brain — „mužsko-ženské uvažování".
 *
 * HERMES (primary LLM via invokeLLM) drafts the answer; HERA (a second,
 * independent model — DeepSeek or Gemini) validates and finalizes it before
 * it reaches the owner. Validation NEVER blocks a reply: any failure or
 * missing key falls back to the HERMES draft.
 *
 * Provider selection: CML_VALIDATOR=deepseek|gemini|off overrides; otherwise
 * auto-detect by DEEPSEEK_API_KEY, then GEMINI_API_KEY, else none.
 */

export type ValidatorProvider = "deepseek" | "gemini" | "none";

export function validatorProvider(): ValidatorProvider {
  const forced = (process.env.CML_VALIDATOR || "").trim().toLowerCase();
  if (forced === "off" || forced === "none") return "none";
  if (forced === "deepseek") return process.env.DEEPSEEK_API_KEY ? "deepseek" : "none";
  if (forced === "gemini") return process.env.GEMINI_API_KEY ? "gemini" : "none";
  // Auto: HERA should be a DIFFERENT model than the primary (HERMES) brain.
  // Primary = Anthropic when its key exists, else DeepSeek (see _core/llm.ts).
  const primaryIsDeepseek = !process.env.ANTHROPIC_API_KEY && !!process.env.DEEPSEEK_API_KEY;
  if (primaryIsDeepseek) {
    if (process.env.GEMINI_API_KEY) return "gemini";
    return "deepseek"; // same-model second pass — weaker, but better than nothing
  }
  if (process.env.DEEPSEEK_API_KEY) return "deepseek";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "none";
}

const HERA_SYSTEM = `Jsi HERA — validační polovina duálního uvažování orchestrátora CML („mužsko-ženské uvažování": HERMES navrhuje, ty validuješ). Dostaneš dotaz ownera a návrh odpovědi od HERMA.
Zkontroluj fakta, logiku, úplnost, rizika a tón (česky, věcně, prostý text pro Telegram, krátké odstavce). Oprav chyby, doplň chybějící podstatné věci, škrtni balast. Když je návrh dobrý, nech ho v zásadě být.
Vrať POUZE finální text odpovědi pro ownera — žádné meta-komentáře o validaci, žádné uvozovky ani nadpisy navíc.`;

function buildValidationRequest(question: string, draft: string): string {
  return `DOTAZ OWNERA:\n${question}\n\nNÁVRH ODPOVĚDI (HERMES):\n${draft}`;
}

async function viaDeepseek(question: string, draft: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: HERA_SYSTEM },
          { role: "user", content: buildValidationRequest(question, draft) },
        ],
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[CML] HERA (deepseek) HTTP ${res.status}`);
      return null;
    }
    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } finally {
    clearTimeout(timer);
  }
}

async function viaGemini(question: string, draft: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: HERA_SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: buildValidationRequest(question, draft) }] }],
        }),
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      console.warn(`[CML] HERA (gemini) HTTP ${res.status}`);
      return null;
    }
    const data: any = await res.json();
    const parts: any[] = data?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map(p => p?.text ?? "").join("").trim();
    return text || null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Validate a HERMES draft through the second model.
 * Returns the finalized answer, or null when validation is unavailable/failed
 * (caller sends the draft as-is).
 */
export async function validateAnswer(
  question: string,
  draft: string,
  timeoutMs = 30_000
): Promise<string | null> {
  const provider = validatorProvider();
  if (provider === "none") return null;
  try {
    const result =
      provider === "deepseek"
        ? await viaDeepseek(question, draft, timeoutMs)
        : await viaGemini(question, draft, timeoutMs);
    if (result) console.log(`[CML] Duální mozek: HERA (${provider}) zvalidovala odpověď`);
    return result;
  } catch (err: any) {
    console.warn(`[CML] HERA validace (${provider}) selhala:`, err?.message);
    return null;
  }
}

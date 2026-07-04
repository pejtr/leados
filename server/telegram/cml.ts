/**
 * CML — „Centrální Mozek Lidstva".
 * Owner-facing orchestrator driven from Telegram chat (@my_general_ibot).
 *
 * Pure logic module: all I/O (Telegram send, LLM, DB stats) is injected via deps
 * so the routing/auth logic is unit-testable without network or database.
 */

import type { TgUpdate } from "./telegramApi";

export type CmlLeadStats = {
  total: number;
  byStatus: Record<string, number>;
};

export type CmlDeps = {
  /** Send a plain-text reply to a chat. */
  send: (chatId: number, text: string) => Promise<boolean>;
  /** Ask the LLM brain. Returns assistant text. */
  ask: (history: ChatTurn[], userText: string) => Promise<string>;
  /** Aggregate lead stats from ONYX OS DB. Null when DB unavailable. */
  getLeadStats: () => Promise<CmlLeadStats | null>;
  /** Owner chat id from env — undefined means "not yet configured" (bootstrap mode). */
  ownerChatId: () => string | undefined;
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

const HISTORY_LIMIT = 20;

export const CML_SYSTEM_PROMPT = `Jsi CML („Centrální Mozek Lidstva") — osobní orchestrátor a pravá ruka Petra, ownera digitálního portfolia. Běžíš uvnitř ONYX OS (B2B CRM + lead-gen systém, interně LEADOS).

Portfolio, které znáš:
- Optimateo — agentura (Web · Automation · Data), zákaznická značka.
- ONYX OS — engine/CRM lead systém („Powered by ONYX OS"), prodejní landing crmleadsystem.cz. ONYX WEB = webový produkt pod Optimateem.
- OPTIHUB — interní dashboard/cockpit; OMNICORE — interní orchestrační jádro (vládne mu HERMES); HERA — analytická vrstva.
- Enchanté One + Sacré Club — aukční/art vertikála (vlastní investorský příběh, drž ji oddělenou).
- Katastr-Online.cz — realitní platforma (posílá leady do ONYX OS).
- OMNISHOPPER — budoucí consumer agregátor (zatím backlog).

Tvé aktuální schopnosti: odpovídat na dotazy, reportovat statistiky leadů (/stats), pomáhat plánovat a rozepisovat úkoly na kroky. Zatím NEUMÍŠ přímo spouštět mise/agenty — když ti owner zadá úkol, rozeber ho, navrhni konkrétní kroky a co spustit kde. Nic si nevymýšlej; když něco nevíš, řekni to.

Odpovídej ČESKY, stručně, věcně, bez balastu. Jsi v Telegramu — krátké odstavce, žádné dlouhé eseje, formátování jen prostým textem.`;

const HELP_TEXT = `🧠 CML — Centrální Mozek Lidstva

Příkazy:
/stats — přehled leadů v ONYX OS
/ping — kontrola, že žiju
/help — tohle

Cokoli jiného napíšeš, beru jako úkol nebo dotaz a odpovím.`;

export function formatStats(stats: CmlLeadStats | null): string {
  if (!stats) return "⚠️ Databáze teď není dostupná — statistiky nemám.";
  const lines = Object.entries(stats.byStatus)
    .sort((a, b) => b[1] - a[1])
    .map(([status, n]) => `• ${status}: ${n}`);
  return `📊 Leady v ONYX OS\nCelkem: ${stats.total}\n${lines.join("\n")}`;
}

export function createCml(deps: CmlDeps) {
  const history = new Map<number, ChatTurn[]>();

  function remember(chatId: number, turn: ChatTurn) {
    const list = history.get(chatId) ?? [];
    list.push(turn);
    while (list.length > HISTORY_LIMIT) list.shift();
    history.set(chatId, list);
  }

  async function handleUpdate(update: TgUpdate): Promise<void> {
    const msg = update.message ?? update.edited_message;
    const text = msg?.text?.trim();
    if (!msg || !text) return;

    const chatId = msg.chat.id;
    const owner = deps.ownerChatId();

    // Bootstrap mode: owner chat not configured yet. Answer /start with the chat id
    // so the owner can put it into TELEGRAM_OWNER_CHAT_ID; ignore everything else.
    if (!owner) {
      if (text.startsWith("/start")) {
        await deps.send(
          chatId,
          `🧠 CML online — zatím nezamčený.\n\nTvoje chat ID: ${chatId}\n\nPřidej do .env:\nTELEGRAM_OWNER_CHAT_ID=${chatId}\n\n…a restartuj server. Pak poslouchám jen tebe.`
        );
      } else {
        console.warn(`[CML] Ignoring message from chat ${chatId} — owner not configured`);
      }
      return;
    }

    // Owner gate: silently ignore anyone who is not the owner.
    if (String(chatId) !== String(owner)) {
      console.warn(`[CML] Ignoring message from non-owner chat ${chatId}`);
      return;
    }

    if (text.startsWith("/start") || text.startsWith("/help")) {
      await deps.send(chatId, HELP_TEXT);
      return;
    }

    if (text.startsWith("/ping")) {
      await deps.send(chatId, "🧠 CML online.");
      return;
    }

    if (text.startsWith("/stats")) {
      const stats = await deps.getLeadStats();
      await deps.send(chatId, formatStats(stats));
      return;
    }

    // Free-form: ask the brain with per-chat history.
    remember(chatId, { role: "user", content: text });
    let reply: string;
    try {
      // Pass a snapshot, not the live array — history keeps mutating after this call.
      reply = await deps.ask([...(history.get(chatId) ?? [])], text);
    } catch (err: any) {
      console.error("[CML] LLM error:", err?.message || err);
      reply = "⚠️ Mozek teď neodpovídá (LLM chyba). Zkus to za chvíli.";
    }
    if (!reply || !reply.trim()) reply = "🤔 Nemám k tomu co říct — zkus to formulovat jinak.";
    remember(chatId, { role: "assistant", content: reply });
    await deps.send(chatId, reply);
  }

  return { handleUpdate };
}

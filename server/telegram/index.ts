/**
 * CML Telegram wiring — real deps + long-polling loop.
 * Started from server/_core/index.ts after the HTTP server is up.
 *
 * Polling (getUpdates) is used instead of a webhook so CML works identically
 * in local dev, Manus, and Railway without a public URL.
 */

import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { leads } from "../../drizzle/schema";
import { invokeLLM, type Message } from "../_core/llm";
import {
  telegramEnabled,
  sendTelegramMessage,
  getTelegramUpdates,
  deleteTelegramWebhook,
} from "./telegramApi";
import { createCml, CML_SYSTEM_PROMPT, type ChatTurn, type CmlLeadStats } from "./cml";

async function getLeadStats(): Promise<CmlLeadStats | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select({ status: leads.status, n: sql<number>`count(*)` })
      .from(leads)
      .groupBy(leads.status);
    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      const n = Number(row.n) || 0;
      byStatus[String(row.status)] = n;
      total += n;
    }
    return { total, byStatus };
  } catch (err: any) {
    console.warn("[CML] getLeadStats failed:", err?.message);
    return null;
  }
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map(part => (typeof part === "string" ? part : part?.type === "text" ? part.text : ""))
      .join("");
  }
  return "";
}

async function ask(history: ChatTurn[], _userText: string): Promise<string> {
  // History already contains the latest user turn (cml.ts remembers before asking).
  const messages: Message[] = [
    { role: "system", content: CML_SYSTEM_PROMPT },
    ...history.map(turn => ({ role: turn.role, content: turn.content }) as Message),
  ];
  const result = await invokeLLM({ messages });
  return extractText(result.choices?.[0]?.message?.content).trim();
}

let started = false;

export async function startCmlTelegram(): Promise<void> {
  if (started) return;
  if (!telegramEnabled()) {
    console.log("[CML] TELEGRAM_BOT_TOKEN not set — CML Telegram orchestrator disabled");
    return;
  }
  started = true;

  const cml = createCml({
    send: (chatId, text) => sendTelegramMessage(chatId, text),
    ask,
    getLeadStats,
    ownerChatId: () => process.env.TELEGRAM_OWNER_CHAT_ID?.trim() || undefined,
  });

  // Ensure no webhook is configured — getUpdates conflicts with webhooks.
  await deleteTelegramWebhook();
  console.log(
    `[CML] Telegram orchestrator online (polling)${
      process.env.TELEGRAM_OWNER_CHAT_ID ? "" : " — BOOTSTRAP MODE: send /start to the bot to get your chat id"
    }`
  );

  let offset: number | undefined;
  let errorStreak = 0;

  // Fire-and-forget loop; never throws out.
  void (async () => {
    for (;;) {
      try {
        const updates = await getTelegramUpdates(offset);
        errorStreak = 0;
        for (const update of updates) {
          offset = update.update_id + 1;
          // Handle sequentially — owner chat, low volume, order matters.
          await cml.handleUpdate(update).catch(err =>
            console.error("[CML] handleUpdate error:", err?.message || err)
          );
        }
      } catch (err: any) {
        errorStreak++;
        console.warn(`[CML] Polling error (#${errorStreak}):`, err?.message || err);
        // Backoff: 5s, 10s, 20s… capped at 60s.
        await new Promise(r => setTimeout(r, Math.min(5000 * 2 ** (errorStreak - 1), 60_000)));
      }
    }
  })();
}

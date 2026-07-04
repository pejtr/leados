/**
 * CML Telegram wiring — real deps + long-polling loop.
 * Started from server/_core/index.ts after the HTTP server is up.
 *
 * Polling (getUpdates) is used instead of a webhook so CML works identically
 * in local dev, Manus, and Railway without a public URL.
 */

import { sql, eq } from "drizzle-orm";
import { getDb } from "../db";
import { leads, users } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { invokeLLM, type Message } from "../_core/llm";
import * as projectsDb from "../projectsDb";
import {
  telegramEnabled,
  sendTelegramMessage,
  getTelegramUpdates,
  deleteTelegramWebhook,
} from "./telegramApi";
import { createCml, CML_SYSTEM_PROMPT, type ChatTurn, type CmlLeadStats } from "./cml";
import { loadHistory, saveTurn } from "./cmlMemory";
import { validateAnswer, validatorProvider } from "./dualBrain";

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

async function ask(history: ChatTurn[], userText: string): Promise<string> {
  // History already contains the latest user turn (cml.ts remembers before asking).
  const messages: Message[] = [
    { role: "system", content: CML_SYSTEM_PROMPT },
    ...history.map(turn => ({ role: turn.role, content: turn.content }) as Message),
  ];
  // Dual brain („mužsko-ženské uvažování"): HERMES drafts…
  const result = await invokeLLM({ messages });
  const draft = extractText(result.choices?.[0]?.message?.content).trim();
  if (!draft) return draft;
  // …HERA validates through a second model; on failure the draft stands.
  const validated = await validateAnswer(userText, draft);
  return validated ?? draft;
}

/** Resolve the ONYX OS user id that owns hub projects: owner openId, else first admin, else first user. */
async function resolveOwnerUserId(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (ENV.ownerOpenId) {
    const [byOpenId] = await db.select().from(users).where(eq(users.openId, ENV.ownerOpenId)).limit(1);
    if (byOpenId) return byOpenId.id;
  }
  const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (admin) return admin.id;
  const [first] = await db.select().from(users).limit(1);
  if (first) return first.id;
  throw new Error("Žádný uživatel v DB — přihlas se nejdřív do ONYX OS");
}

function hubBaseUrl(): string {
  return (process.env.HUB_PUBLIC_URL || "http://localhost:3001").replace(/\/$/, "");
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
    listProjects: async () => {
      const userId = await resolveOwnerUserId();
      const rows = await projectsDb.listProjects(userId);
      return rows.map(p => ({ id: p.id, name: p.name, apiKey: p.apiKey, url: p.url }));
    },
    createProject: async (name, url) => {
      const userId = await resolveOwnerUserId();
      const p = await projectsDb.createProject({ userId, name, url, category: "portfolio" });
      return { id: p.id, name: p.name, apiKey: p.apiKey, url: p.url };
    },
    hubBaseUrl,
    loadHistory,
    saveTurn,
  });

  // Ensure no webhook is configured — getUpdates conflicts with webhooks.
  await deleteTelegramWebhook();
  console.log(`[CML] Duální mozek: HERA validátor = ${validatorProvider()}`);
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

import { notifyOwner as forgeNotify } from "./_core/notification";

/**
 * Reliable owner notification with a host-independent Telegram fallback.
 *
 * The built-in Manus Forge notifier only works inside the Manus runtime. In
 * production (Railway/Vercel/VPS) those env vars are absent, so leads would be
 * saved but never delivered. This wrapper ALSO pushes to Telegram when
 * TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are set — instant phone notification,
 * no domain or SMTP needed. It never throws, so it can't break the lead path.
 *
 * Setup: create a bot via @BotFather → TELEGRAM_BOT_TOKEN; send it a message,
 * then read your chat id from https://api.telegram.org/bot<token>/getUpdates →
 * TELEGRAM_CHAT_ID.
 */

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TG_CHAT = process.env.TELEGRAM_CHAT_ID ?? "";

async function notifyTelegram(title: string, content: string): Promise<boolean> {
  if (!TG_TOKEN || !TG_CHAT) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // plain text (no parse_mode) to avoid Markdown escaping issues
      body: JSON.stringify({ chat_id: TG_CHAT, text: `${title}\n\n${content}` }),
    });
    if (!res.ok) {
      console.warn(`[Notify] Telegram failed (${res.status})`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notify] Telegram error:", error);
    return false;
  }
}

export async function notifyOwner(payload: { title: string; content: string }): Promise<boolean> {
  let forgeOk = false;
  try {
    forgeOk = await forgeNotify(payload);
  } catch (error) {
    // Forge unavailable (e.g. running off-Manus) — fall through to Telegram.
    console.warn("[Notify] Forge notifier unavailable:", error instanceof Error ? error.message : error);
  }

  const tgOk = await notifyTelegram(payload.title, payload.content);

  if (!forgeOk && !tgOk) {
    console.error(`[Notify] ⚠️ Owner notification NOT delivered (no channel configured): ${payload.title}`);
  }
  return forgeOk || tgOk;
}

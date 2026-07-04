/**
 * Thin Telegram Bot API client for CML (Centrální Mozek Lidstva).
 * No external deps — native fetch. Enabled only when TELEGRAM_BOT_TOKEN is set.
 */

const API_BASE = "https://api.telegram.org";
const MESSAGE_CHUNK = 3900; // Telegram hard limit is 4096; keep headroom

export type TgChat = { id: number; type: string; title?: string; username?: string };
export type TgMessage = {
  message_id: number;
  from?: { id: number; is_bot: boolean; first_name?: string; username?: string };
  chat: TgChat;
  date: number;
  text?: string;
};
export type TgUpdate = { update_id: number; message?: TgMessage; edited_message?: TgMessage };

function botToken(): string | undefined {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  return t && t.trim().length > 10 ? t.trim() : undefined;
}

export function telegramEnabled(): boolean {
  return !!botToken();
}

export async function tgCall<T = unknown>(
  method: string,
  body?: Record<string, unknown>,
  timeoutMs = 35_000
): Promise<T | null> {
  const token = botToken();
  if (!token) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const json: any = await res.json().catch(() => null);
    if (!json?.ok) {
      console.warn(`[Telegram] ${method} failed:`, json?.description || res.status);
      return null;
    }
    return json.result as T;
  } catch (err: any) {
    console.warn(`[Telegram] ${method} error:`, err?.message || err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Send a plain-text message, chunked to fit Telegram's length limit. */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string
): Promise<boolean> {
  if (!telegramEnabled() || !text) return false;
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > 0) {
    chunks.push(rest.slice(0, MESSAGE_CHUNK));
    rest = rest.slice(MESSAGE_CHUNK);
  }
  let allOk = true;
  for (const chunk of chunks) {
    const result = await tgCall("sendMessage", { chat_id: chatId, text: chunk });
    if (!result) allOk = false;
  }
  return allOk;
}

/** Long-poll for updates. Returns [] on error so the loop can back off and continue. */
export async function getTelegramUpdates(
  offset: number | undefined,
  timeoutSec = 25
): Promise<TgUpdate[]> {
  const result = await tgCall<TgUpdate[]>(
    "getUpdates",
    {
      timeout: timeoutSec,
      allowed_updates: ["message"],
      ...(offset !== undefined ? { offset } : {}),
    },
    (timeoutSec + 10) * 1000
  );
  return result ?? [];
}

/** Remove any configured webhook so getUpdates polling can run without conflicts. */
export async function deleteTelegramWebhook(): Promise<void> {
  await tgCall("deleteWebhook", { drop_pending_updates: false });
}

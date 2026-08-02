/**
 * SMS/WhatsApp Notification Service (Twilio)
 *
 * Nastavení:
 * 1. Vytvoř Twilio účet na https://www.twilio.com
 * 2. Nastav TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER v .env
 * 3. Pro WhatsApp: nastav TWILIO_WHATSAPP_FROM v .env (format: whatsapp:+14155238886)
 */

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

interface SmsOptions {
  to: string;
  body: string;
  from?: string;
}

interface WhatsAppOptions {
  to: string;
  body: string;
  from?: string;
}

function getTwilioCredentials(): { accountSid: string; authToken: string; fromNumber: string; whatsappFrom: string } | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM?.trim();

  if (!accountSid || !authToken || !fromNumber) return null;

  return {
    accountSid,
    authToken,
    fromNumber,
    whatsappFrom: whatsappFrom || "whatsapp:+14155238886",
  };
}

export async function sendSms(options: SmsOptions): Promise<boolean> {
  const creds = getTwilioCredentials();
  if (!creds) {
    console.warn("[SMS] Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.");
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const params = new URLSearchParams({
      To: options.to,
      From: options.from || creds.fromNumber,
      Body: options.body,
    });

    const response = await fetch(
      `${TWILIO_API_BASE}/Accounts/${creds.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        signal: controller.signal,
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[SMS] Twilio error (${response.status}):`, error);
      return false;
    }

    console.log("[SMS] Message sent successfully.");
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SMS] Delivery failed: ${msg}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendWhatsApp(options: WhatsAppOptions): Promise<boolean> {
  const creds = getTwilioCredentials();
  if (!creds) {
    console.warn("[WhatsApp] Twilio not configured.");
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const params = new URLSearchParams({
      To: options.to,
      From: options.from || creds.whatsappFrom,
      Body: options.body,
    });

    const response = await fetch(
      `${TWILIO_API_BASE}/Accounts/${creds.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        signal: controller.signal,
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[WhatsApp] Twilio error (${response.status}):`, error);
      return false;
    }

    console.log("[WhatsApp] Message sent successfully.");
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[WhatsApp] Delivery failed: ${msg}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── High-level notification helpers ──────────────────────────────────────────

export async function notifyLeadSms(phone: string, name: string): Promise<boolean> {
  return sendSms({
    to: phone,
    body: `Ahoj ${name}! Děkujeme za váš zájem o OPTIMATEO. Ozveme se vám co nejdřív. Pokud máte dotaz, napište nám na info@optimateo.com`,
  });
}

export async function notifyPaymentSms(phone: string, name: string, amount: number, orderId: number): Promise<boolean> {
  return sendSms({
    to: phone,
    body: `OPTIMATEO: Platba ${amount.toLocaleString("cs-CZ")} Kč za objednávku #${orderId} byla přijata. Děkujeme!`,
  });
}

export async function notifyProjectUpdateSms(phone: string, projectId: string, status: string): Promise<boolean> {
  return sendSms({
    to: phone,
    body: `OPTIMATEO: Projekt ${projectId} změnil status na "${status}". Podrobnosti v dashboardu.`,
  });
}

export async function notifyLeadWhatsApp(phone: string, name: string): Promise<boolean> {
  return sendWhatsApp({
    to: `whatsapp:${phone}`,
    body: `Ahoj ${name}! Děkujeme za váš zájem o OPTIMATEO. Ozveme se vám co nejdřív. Pokud máte dotaz, napište nám na info@optimateo.com`,
  });
}

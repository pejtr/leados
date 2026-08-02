/**
 * Meta Conversions API (CAPI) – server-side tracking
 *
 * Uses SHA256-hashed PII for event matching.
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import { createHash } from "crypto";

interface MetaEvent {
  event_name: string;
  event_time: number;
  event_id?: string;
  action_source: "website";
  event_source_url?: string;
  user_data: {
    em?: string;
    ph?: string;
    fn?: string;
    ln?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: Record<string, unknown>;
}

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function getAccessToken(): string | null {
  return process.env.META_ACCESS_TOKEN?.trim() || null;
}

function getPixelId(): string | null {
  return process.env.META_PIXEL_ID?.trim() || null;
}

function getEventUrl(): string {
  return `https://graph.facebook.com/v19.0/${getPixelId()}/events`;
}

export async function trackMetaServerEvent(params: {
  eventName: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  ipAddress?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
  eventId?: string;
  value?: number;
  currency?: string;
  extraData?: Record<string, unknown>;
}): Promise<boolean> {
  const accessToken = getAccessToken();
  const pixelId = getPixelId();
  if (!accessToken || !pixelId) return false;

  const userData: MetaEvent["user_data"] = {};
  if (params.email) userData.em = sha256(params.email);
  if (params.phone) {
    const digits = params.phone.replace(/\D/g, "");
    userData.ph = sha256(digits);
  }
  if (params.firstName) userData.fn = sha256(params.firstName);
  if (params.lastName) userData.ln = sha256(params.lastName);
  if (params.ipAddress) userData.client_ip_address = params.ipAddress;
  if (params.userAgent) userData.client_user_agent = params.userAgent;
  if (params.fbc) userData.fbc = params.fbc;
  if (params.fbp) userData.fbp = params.fbp;

  const event: MetaEvent = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    action_source: "website",
    user_data: userData,
  };

  if (params.value !== undefined || params.currency || params.extraData) {
    event.custom_data = {
      ...(params.value !== undefined && { value: params.value }),
      ...(params.currency && { currency: params.currency }),
      ...params.extraData,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(getEventUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        data: [event],
        access_token: accessToken,
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      console.error(`[Meta CAPI] Request failed (${response.status}):`, result);
      return false;
    }
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Meta CAPI] Event delivery failed: ${msg}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function trackMetaLead(params: {
  email?: string;
  phone?: string;
  name?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<boolean> {
  const [firstName, lastName] = (params.name || "").split(" ", 2);
  return trackMetaServerEvent({
    eventName: "Lead",
    email: params.email,
    phone: params.phone,
    firstName,
    lastName,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

export async function trackMetaPurchase(params: {
  value: number;
  orderId: string;
  email?: string;
  phone?: string;
  name?: string;
}): Promise<boolean> {
  const [firstName, lastName] = (params.name || "").split(" ", 2);
  return trackMetaServerEvent({
    eventName: "Purchase",
    email: params.email,
    phone: params.phone,
    firstName,
    lastName,
    value: params.value,
    currency: "CZK",
    eventId: params.orderId,
    extraData: { content_type: "product", content_ids: [params.orderId] },
  });
}

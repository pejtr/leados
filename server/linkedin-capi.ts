/**
 * LinkedIn Conversions API (server-side)
 *
 * Posílá konverze na LinkedIn API přímo ze serveru.
 * To je důležité, protože browser-side tracking blokují ad-blockery a iOS.
 *
 * Dokumentace:
 * https://learn.microsoft.com/en-us/linkedin/marketing/conversions/conversions-api
 *
 * Potřebné env vars:
 * - LINKEDIN_ACCESS_TOKEN  – OAuth token pro LinkedIn Ads API
 * - LINKEDIN_CONVERSION_ID – UUID konverzního pravidla z Campaign Manageru
 * - LINKEDIN_AD_ACCOUNT_ID – ID reklamního účtu (např. "urn:li:sponsoredAccount:123456")
 */

import { createHash } from "crypto";

// ─── Konfigurace ─────────────────────────────────────────────────────────────

const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN ?? "";
const CONVERSION_ID = process.env.LINKEDIN_CONVERSION_ID ?? "";
const API_BASE = "https://api.linkedin.com/rest";
const LINKEDIN_VERSION = "202605";

// ─── Helpery ─────────────────────────────────────────────────────────────────

function sha256(value: string): string {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function normalizePhone(phone: string): string {
  // Odstraní vše kromě číslic
  return phone.replace(/[^0-9]/g, "");
}

// ─── Hlavní funkce ───────────────────────────────────────────────────────────

export type LinkedInConversionPayload = {
  email: string;
  phone?: string;
  name?: string;
  value?: number;
  currency?: string;
  eventId?: string;
  source?: string;
};

/**
 * Pošle konverzní událost na LinkedIn Conversions API.
 *
 * @returns true pokud se odeslání podařilo
 */
export async function sendLinkedInConversion(
  payload: LinkedInConversionPayload
): Promise<boolean> {
  if (!ACCESS_TOKEN || !CONVERSION_ID) {
    console.warn(
      "[LinkedIn CAPI] Missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_CONVERSION_ID"
    );
    return false;
  }

  const timestamp = Math.floor(Date.now());
  const eventId = payload.eventId || `lead-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = {
      conversion: CONVERSION_ID,
      conversionHappenedAt: timestamp,
      conversionValue: payload.value
        ? {
            amount: String(payload.value),
            currencyCode: payload.currency || "CZK",
          }
        : undefined,
      eventId,
      user: {
        userIds: [
          ...(payload.email
            ? [
                {
                  idType: "SHA256_EMAIL",
                  idValue: sha256(normalizeEmail(payload.email)),
                },
              ]
            : []),
          ...(payload.phone
            ? [
                {
                  idType: "SHA256_PHONE",
                  idValue: sha256(normalizePhone(payload.phone)),
                },
              ]
            : []),
        ],
        ...(payload.name
          ? {
              name: {
                firstName: sha256(payload.name.split(" ")[0] || ""),
                lastName: sha256(payload.name.split(" ").slice(1).join(" ") || ""),
              },
            }
          : {}),
      },
    };

    const headers: Record<string, string> = {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": LINKEDIN_VERSION,
      "X-RestLi-Protocol-Version": "2.0.0",
    };

    const response = await fetch(
      `${API_BASE}/conversionEvents`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[LinkedIn CAPI] Error ${response.status}:`,
        errorText.slice(0, 500)
      );
      return false;
    }

    console.log(`[LinkedIn CAPI] ✅ Conversion sent: ${eventId}`);
    return true;
  } catch (error) {
    console.error("[LinkedIn CAPI] Network error:", error);
    return false;
  }
}

/**
 * Zjednodušená verze pro volání z inquiries.create
 */
export async function trackLinkedInLead(
  email: string,
  phone?: string,
  name?: string,
  value?: number
): Promise<boolean> {
  return sendLinkedInConversion({
    email,
    phone,
    name,
    value,
    currency: "CZK",
    source: "optivio-web",
  });
}

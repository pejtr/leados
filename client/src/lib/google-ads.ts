/**
 * Google Ads Conversion Tracking
 *
 * Nastavení:
 * 1. V Google Ads vytvoř Conversion Action (Tools → Conversions)
 * 2. Zkopíruj Conversion ID (např. AW-123456789)
 * 3. Nastav jako VITE_GOOGLE_ADS_CONVERSION_ID v .env
 * 4. Pro offline conversion import nastav GOOGLE_ADS_DEVELOPER_TOKEN v .env
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function getConversionId(): string | null {
  const id = String(import.meta.env.VITE_GOOGLE_ADS_CONVERSION_ID || "").trim();
  return id || null;
}

function ensureGtag(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.gtag !== "function") return false;
  return true;
}

export function trackGoogleAdsConversion(conversionLabel: string, value?: number) {
  if (!ensureGtag()) return;
  const conversionId = getConversionId();
  if (!conversionId) return;

  const params: Record<string, unknown> = {
    send_to: `${conversionId}/${conversionLabel}`,
  };
  if (value !== undefined) {
    params.value = value;
    params.currency = "CZK";
  }
  window.gtag("event", "conversion", params);
}

export function trackGoogleAdsLead() {
  if (!ensureGtag()) return;
  const conversionId = getConversionId();
  if (!conversionId) return;

  window.gtag("event", "conversion", {
    send_to: `${conversionId}/LEAD_CONVERSION_LABEL`,
  });
}

export function trackGoogleAdsPurchase(value: number, transactionId?: string) {
  if (!ensureGtag()) return;
  const conversionId = getConversionId();
  if (!conversionId) return;

  window.gtag("event", "conversion", {
    send_to: `${conversionId}/PURCHASE_CONVERSION_LABEL`,
    value,
    currency: "CZK",
    transaction_id: transactionId,
  });
}

export function trackGoogleAdsEnhancedConversion(userData: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
}) {
  if (!ensureGtag()) return;

  const enhanced: Record<string, unknown> = {};
  if (userData.email) enhanced.email = userData.email;
  if (userData.phone) enhanced.phone_number = userData.phone;
  if (userData.firstName) enhanced.first_name = userData.firstName;
  if (userData.lastName) enhanced.last_name = userData.lastName;
  if (userData.street) enhanced.address = { street: userData.street };
  if (userData.city) enhanced.address = { ...(enhanced.address as object), city: userData.city };
  if (userData.postalCode) enhanced.address = { ...(enhanced.address as object), postal_code: userData.postalCode };
  if (userData.countryCode) enhanced.address = { ...(enhanced.address as object), country: userData.countryCode };

  window.gtag("set", "user_data", enhanced);
}

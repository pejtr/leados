/**
 * LinkedIn Insight Tag – B2B retargeting a konverzní tracking
 *
 * Nastavení:
 * 1. Vytvoř Insight Tag v LinkedIn Campaign Manager → Analyze → Insight Tag
 * 2. Zkopíruj ID (např. 1234567)
 * 3. Nastav jako VITE_LINKEDIN_INSIGHT_ID v .env
 *
 * Pro Conversions API (server-side):
 * 4. Vytvoř LinkedIn App v https://www.linkedin.com/developers/
 * 5. Získej Access Token (OAuth 2.0) pro Ads Management API
 * 6. Nastav jako LINKEDIN_ACCESS_TOKEN v .env
 * 7. Nastav LINKEDIN_CONVERSION_ID (ID konverzního pravidla z Campaign Manageru)
 */

type ConsentValue = 0 | 1;

declare global {
  interface Window {
    /**
     * LinkedIn Insight Tag globals
     */
    _linkedin_data_partner_id?: string;
    lintrk?: ((...args: unknown[]) => void) & { q?: unknown[] };
    lintrd?: { q?: unknown[] };
  }
}

const SCRIPT_ID = "linkedin-insight-script";
const INSIGHT_URL = "https://snap.licdn.com/li.lms-analytics/insight.min.js";

/**
 * Zjistí, zda uživatel dal souhlas s LinkedIn trackingem.
 */
export function getLinkedInConsent(): ConsentValue {
  if (typeof window === "undefined") return 0;

  const stored =
    window.localStorage.getItem("linkedin_consent") ||
    window.localStorage.getItem("marketing_consent") ||
    window.localStorage.getItem("cookie_consent_marketing");

  return stored === "1" || stored === "true" ? 1 : 0;
}

/**
 * Uloží souhlas s LinkedIn trackingem.
 */
export function setLinkedInConsent(consent: boolean) {
  if (typeof window === "undefined") return;
  const value = consent ? "1" : "0";
  window.localStorage.setItem("linkedin_consent", value);
  if (!consent) {
    document.getElementById(SCRIPT_ID)?.remove();
    delete window.lintrk;
    delete window._linkedin_data_partner_id;
  }
}

/**
 * Inicializuje LinkedIn Insight Tag (vloží script do <head>).
 * Volá se až po udělení souhlasu.
 */
export function initLinkedInInsight() {
  if (typeof window === "undefined") return;

  const partnerId = import.meta.env.VITE_LINKEDIN_INSIGHT_ID;
  if (!partnerId) {
    console.warn("[LinkedIn] Missing VITE_LINKEDIN_INSIGHT_ID");
    return;
  }

  // Už je nahraný
  if (document.getElementById(SCRIPT_ID)) return;

  // Nastav partner ID
  window._linkedin_data_partner_id = partnerId;

  // Vlož skript
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.type = "text/javascript";
  script.async = true;
  script.src = INSIGHT_URL;
  document.head.appendChild(script);

  // Inicializuj frontu
  if (typeof window.lintrk !== "function") {
    const lintrk: NonNullable<Window["lintrk"]> = function (...args: unknown[]) {
      (lintrk.q = lintrk.q || []).push(args);
    };
    lintrk.q = [];
    window.lintrk = lintrk;
  }
}

/**
 * Sleduje konverzní událost na LinkedIn (browser-side).
 *
 * @param conversionId - ID konverzního pravidla z LinkedIn Campaign Manageru
 * @param value - Hodnota konverze (volitelné)
 */
export function trackLinkedInConversion(conversionId?: string, value?: number) {
  if (typeof window === "undefined") return;

  const id = conversionId || import.meta.env.VITE_LINKEDIN_CONVERSION_ID;
  if (!id) return;

  const consent = getLinkedInConsent();
  if (!consent) return;

  try {
    window.lintrk?.("track", { conversion_id: id });

    if (value !== undefined) {
      window.lintrk?.("track", {
        conversion_id: id,
        value,
        currency: "CZK",
      });
    }
  } catch (error) {
    console.error("[LinkedIn] Conversion tracking error:", error);
  }
}

/**
 * Jednorázová inicializace – zavolat při startu appky.
 * Insight tag se nahraje jen pokud už je souhlas.
 */
export function ensureLinkedInInsight() {
  if (getLinkedInConsent()) {
    initLinkedInInsight();
  }
}

/**
 * Meta Pixel (Facebook/Instagram) – retargeting a konverzní tracking
 *
 * Nastavení:
 * 1. Vytvoř Meta Pixel v https://business.facebook.com/events_manager
 * 2. Zkopíruj Pixel ID (např. 123456789012345)
 * 3. Nastav jako VITE_META_PIXEL_ID v .env
 *
 * Pro Conversions API (server-side):
 * 4. Vytvoř Access Token v Business Manager → Settings → Access Tokens
 * 5. Nastav jako META_ACCESS_TOKEN v .env
 * 6. Nastav META_PIXEL_ID v .env (server-side)
 */

type ConsentValue = 0 | 1;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: Window["fbq"];
  }
}

const SCRIPT_ID = "meta-pixel-script";
const PIXEL_URL = "https://connect.facebook.net/en_US/fbevents.js";

export function getMetaConsent(): ConsentValue {
  if (typeof window === "undefined") return 0;
  const stored =
    window.localStorage.getItem("meta_consent") ||
    window.localStorage.getItem("marketing_consent") ||
    window.localStorage.getItem("cookie_consent_marketing");
  return stored === "1" || stored === "true" ? 1 : 0;
}

export function setMetaConsent(consent: boolean) {
  if (typeof window === "undefined") return;
  const value = consent ? "1" : "0";
  window.localStorage.setItem("meta_consent", value);
  if (!consent) {
    document.getElementById(SCRIPT_ID)?.remove();
    delete window.fbq;
    delete window._fbq;
  }
}

function getPixelId(): string | null {
  const id = String(import.meta.env.VITE_META_PIXEL_ID || "").trim();
  return id || null;
}

export function initMetaPixel() {
  if (typeof window === "undefined") return;
  const pixelId = getPixelId();
  if (!pixelId) return;
  if (document.getElementById(SCRIPT_ID)) return;

  if (typeof window.fbq !== "function") {
    const fbq: any = function (...args: unknown[]) {
      (fbq.q = fbq.q || []).push(args);
    };
    fbq.q = [];
    fbq.l = Date.now();
    window.fbq = fbq;
    window._fbq = fbq;
  }

  window.fbq("init", pixelId);

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = PIXEL_URL;
  document.head.appendChild(script);
}

export function trackMetaPageView() {
  if (typeof window === "undefined" || !getMetaConsent()) return;
  window.fbq?.("track", "PageView");
}

export function trackMetaLead(value?: number) {
  if (typeof window === "undefined" || !getMetaConsent()) return;
  if (value !== undefined) {
    window.fbq?.("track", "Lead", { value, currency: "CZK" });
  } else {
    window.fbq?.("track", "Lead");
  }
}

export function trackMetaPurchase(value: number, orderId?: string) {
  if (typeof window === "undefined" || !getMetaConsent()) return;
  window.fbq?.("track", "Purchase", {
    value,
    currency: "CZK",
    content_type: "product",
    ...(orderId ? { content_ids: [orderId] } : {}),
  });
}

export function trackMetaCompleteRegistration() {
  if (typeof window === "undefined" || !getMetaConsent()) return;
  window.fbq?.("track", "CompleteRegistration");
}

export function trackMetaCustomEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !getMetaConsent()) return;
  window.fbq?.("trackCustom", eventName, params);
}

export function ensureMetaPixel() {
  if (getMetaConsent()) {
    initMetaPixel();
  }
}

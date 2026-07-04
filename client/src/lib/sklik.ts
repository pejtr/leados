type ConsentValue = 0 | 1;

type SklikRetargetingPayload = {
  category?: string;
  pageType?: string;
  rtgUrl?: string;
};

type SklikConversionPayload = {
  id?: number;
  orderId?: string;
  value?: number | null;
};

declare global {
  interface Window {
    rc?: {
      retargetingHit?: (config: Record<string, unknown>) => void;
      conversionHit?: (config: Record<string, unknown>) => void;
    };
    sznIVA?: {
      IS?: {
        updateIdentities?: (identities: Record<string, unknown>) => void;
      };
    };
  }
}

const SCRIPT_SRC = "https://c.seznam.cz/js/rc.js";
const SCRIPT_ID = "sklik-rc-script";
let scriptPromise: Promise<boolean> | null = null;

function parseId(value: unknown) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function getSklikConsent(): ConsentValue {
  if (typeof window === "undefined") return 0;

  const stored =
    window.localStorage.getItem("sklik_consent") ||
    window.localStorage.getItem("marketing_consent") ||
    window.localStorage.getItem("cookie_consent_marketing");

  return stored === "1" || stored === "true" ? 1 : 0;
}

export function setSklikConsent(consent: boolean) {
  if (typeof window === "undefined") return;
  const value = consent ? "1" : "0";
  window.localStorage.setItem("sklik_consent", value);
  window.localStorage.setItem("marketing_consent", value);
  window.localStorage.setItem("cookie_consent_marketing", value);
}

async function ensureSklikScript() {
  if (typeof window === "undefined") return false;
  if (window.rc) return true;
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.rc)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = false;
    script.addEventListener("load", () => resolve(Boolean(window.rc)), { once: true });
    script.addEventListener("error", () => resolve(false), { once: true });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function trackSklikRetargeting(payload: SklikRetargetingPayload = {}) {
  const rtgId = parseId(import.meta.env.VITE_SKLIK_RETARGETING_ID);
  if (!rtgId) return false;

  const ready = await ensureSklikScript();
  if (!ready || !window.rc?.retargetingHit) return false;

  window.rc.retargetingHit({
    rtgId,
    pageType: payload.pageType || "other",
    category: payload.category,
    rtgUrl: payload.rtgUrl || window.location.href,
    consent: getSklikConsent(),
  });

  return true;
}

export async function trackSklikConversion(payload: SklikConversionPayload = {}) {
  const id = parseId(payload.id || import.meta.env.VITE_SKLIK_CONVERSION_ID);
  if (!id) return false;

  const ready = await ensureSklikScript();
  if (!ready || !window.rc?.conversionHit) return false;

  window.rc.conversionHit({
    id,
    value: payload.value ?? null,
    orderId: payload.orderId,
    consent: getSklikConsent(),
  });

  return true;
}

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
    SEM?: {
      (command: "track", event: string, data?: Record<string, unknown>): void;
      (command: "updateConsent", data: Record<string, unknown>): void;
    };
  }
}

const SCRIPT_SRC = "https://c.seznam.cz/js/rc.js";
const SCRIPT_ID = "sklik-rc-script";
const SEM_SCRIPT_ID = "seznam-sem-script";
let scriptPromise: Promise<boolean> | null = null;
let semScriptPromise: Promise<boolean> | null = null;
let semInitialPageLoaded = false;

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

  if (!consent) {
    document.getElementById(SCRIPT_ID)?.remove();
    document.getElementById(SEM_SCRIPT_ID)?.remove();
    delete window.rc;
    delete window.SEM;
    scriptPromise = null;
    semScriptPromise = null;
    semInitialPageLoaded = false;
  }
}

function getSemId() {
  const value = String(import.meta.env.VITE_SEZNAM_SEM_ID || "").trim();
  return value || null;
}

async function ensureSemScript() {
  const semId = getSemId();
  if (!semId || typeof window === "undefined" || !getSklikConsent()) return false;
  if (window.SEM) return true;
  if (semScriptPromise) return semScriptPromise;

  semScriptPromise = new Promise((resolve) => {
    const existing = document.getElementById(SEM_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(typeof window.SEM === "function"), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SEM_SCRIPT_ID;
    script.src = "https://l.seznam.cz/sul.js?id=" + encodeURIComponent(semId);
    script.async = true;
    script.addEventListener("load", () => resolve(typeof window.SEM === "function"), { once: true });
    script.addEventListener("error", () => resolve(false), { once: true });
    document.head.appendChild(script);
  });

  return semScriptPromise;
}

function grantSemConsent() {
  window.SEM?.("updateConsent", {
    consent_mode: {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
      functionality_storage: "denied",
    },
  });
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
  if (!getSklikConsent()) return false;

  let semTracked = false;
  if (await ensureSemScript()) {
    grantSemConsent();
    if (semInitialPageLoaded) {
      window.SEM?.("track", "PageView");
    } else {
      semInitialPageLoaded = true;
    }
    semTracked = true;
  }

  let legacyTracked = false;
  const rtgId = parseId(import.meta.env.VITE_SKLIK_RETARGETING_ID);
  if (rtgId && await ensureSklikScript() && window.rc?.retargetingHit) {
    window.rc.retargetingHit({
      rtgId,
      pageType: payload.pageType || "other",
      category: payload.category,
      rtgUrl: payload.rtgUrl || window.location.href,
      consent: getSklikConsent(),
    });
    legacyTracked = true;
  }

  return semTracked || legacyTracked;
}

export async function trackSklikConversion(payload: SklikConversionPayload = {}) {
  if (!getSklikConsent()) return false;

  let semTracked = false;
  if (await ensureSemScript()) {
    grantSemConsent();
    if (typeof payload.value === "number" && payload.value > 0 && payload.orderId) {
      window.SEM?.("track", "Purchase", {
        order_id: payload.orderId,
        currency: "CZK",
        value: payload.value,
      });
    } else {
      window.SEM?.("track", "Lead");
    }
    semTracked = true;
  }

  let legacyTracked = false;
  const id = parseId(payload.id || import.meta.env.VITE_SKLIK_CONVERSION_ID);
  if (id && await ensureSklikScript() && window.rc?.conversionHit) {
    window.rc.conversionHit({
      id,
      value: payload.value ?? null,
      orderId: payload.orderId,
      consent: getSklikConsent(),
    });
    legacyTracked = true;
  }

  return semTracked || legacyTracked;
}

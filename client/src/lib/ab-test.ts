import { getAttribution } from "./attribution";
import { isChannelConsented } from "./consent";

export type Variant = "A" | "B";

let cachedVariant: Variant | null = null;
const startedForms = new Set<string>();

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getVisitorId() {
  const stored = localStorage.getItem("ab_visitor_id");
  if (stored) return stored;

  const visitorId = globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem("ab_visitor_id", visitorId);
  return visitorId;
}

export async function getVariant(): Promise<Variant> {
  if (!isChannelConsented("google")) return "A";
  if (cachedVariant) return cachedVariant;

  const stored = localStorage.getItem("ab_variant");
  if (stored === "A" || stored === "B") {
    cachedVariant = stored as Variant;
    return cachedVariant;
  }

  try {
    const visitorId = getVisitorId();
    cachedVariant = hashString(visitorId) % 2 === 0 ? "A" : "B";
    localStorage.setItem("ab_variant", cachedVariant);
    return cachedVariant;
  } catch (error) {
    console.error("Failed to get AB variant:", error);
    return "A";
  }
}

export async function trackEvent(event: string, metadata?: Record<string, unknown>) {
  if (!isChannelConsented("google")) return;
  const variant = await getVariant();
  const isHomepageExposure = event === "page_view" && metadata?.path === "/";
  if (isHomepageExposure) sessionStorage.setItem("ab_homepage_exposed", "true");

  const eventMetadata = {
    ...getAttribution(),
    path: window.location.pathname,
    ab_experiment_exposed: sessionStorage.getItem("ab_homepage_exposed") === "true",
    ...metadata,
  };

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, {
      event_category: "ab_test",
      event_label: variant,
      ab_variant: variant,
      ...eventMetadata,
    });
  }

  try {
    await fetch("/api/trpc/ab.trackConversion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        json: { variant, event, metadata: eventMetadata },
      }),
    });
  } catch (error) {
    console.error("Failed to track AB event:", error);
  }
}

export async function trackCTAClick(buttonText: string, location: string) {
  return trackEvent(location === "hero" ? "hero_cta_click" : "cta_click", {
    buttonText,
    location,
    timestamp: new Date().toISOString(),
  });
}

export async function trackFormSubmit(formName: string) {
  return trackEvent("form_submit", {
    formName,
    timestamp: new Date().toISOString(),
  });
}

export function trackFormStart(formName: string, eventName = "form_start") {
  const key = `${eventName}:${formName}`;
  if (startedForms.has(key)) return;
  startedForms.add(key);
  void trackEvent(eventName, { formName, path: window.location.pathname });
}

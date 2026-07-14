const STORAGE_KEY = "marketing_consent_choice";
const STORAGE_DETAIL = "consent_details";
const STORAGE_UPDATED_AT = "consent_updated_at";
const STORAGE_VERSION = "consent_version";
const CURRENT_VERSION = "1";
const DAY_IN_MS = 24 * 60 * 60 * 1_000;

export const CONSENT_UPDATED_EVENT = "optimateo:consent-updated";

export type ConsentChannels = {
  sklik: boolean;
  meta: boolean;
  google: boolean;
  linkedin: boolean;
};

export const DEFAULT_CONSENT_CHANNELS: ConsentChannels = {
  sklik: false,
  meta: false,
  google: false,
  linkedin: false,
};

export function hasValidConsentChoice() {
  if (typeof window === "undefined") return true;
  const choice = window.localStorage.getItem(STORAGE_KEY);
  const version = window.localStorage.getItem(STORAGE_VERSION);
  const updatedAt = Number(window.localStorage.getItem(STORAGE_UPDATED_AT));
  if ((choice !== "accepted" && choice !== "rejected") || version !== CURRENT_VERSION || !Number.isFinite(updatedAt)) {
    return false;
  }

  const maxAge = choice === "accepted" ? 365 * DAY_IN_MS : 180 * DAY_IN_MS;
  return Date.now() - updatedAt < maxAge;
}

export function getConsentChannels(): ConsentChannels {
  if (typeof window === "undefined" || !hasValidConsentChoice()) return DEFAULT_CONSENT_CHANNELS;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_DETAIL) || "{}") as Partial<ConsentChannels>;
    return {
      sklik: parsed.sklik === true,
      meta: parsed.meta === true,
      google: parsed.google === true,
      linkedin: parsed.linkedin === true,
    };
  } catch {
    return DEFAULT_CONSENT_CHANNELS;
  }
}

export function isChannelConsented(channel: keyof ConsentChannels) {
  return getConsentChannels()[channel];
}

export function hasAnyTrackingConsent() {
  return Object.values(getConsentChannels()).some(Boolean);
}

export function saveConsentChoice(channels: ConsentChannels) {
  const accepted = Object.values(channels).some(Boolean);
  window.localStorage.setItem(STORAGE_KEY, accepted ? "accepted" : "rejected");
  window.localStorage.setItem(STORAGE_DETAIL, JSON.stringify(channels));
  window.localStorage.setItem(STORAGE_UPDATED_AT, String(Date.now()));
  window.localStorage.setItem(STORAGE_VERSION, CURRENT_VERSION);
}

export function clearNonEssentialClientStorage() {
  ["ab_visitor_id", "ab_variant", "optimateo_attribution_v1"].forEach((key) => window.localStorage.removeItem(key));
  window.sessionStorage.removeItem("ab_homepage_exposed");
}

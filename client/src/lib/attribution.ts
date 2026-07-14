import { hasAnyTrackingConsent } from "./consent";

const STORAGE_KEY = "optimateo_attribution_v1";

const CAMPAIGN_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "sznaiid",
] as const;

type CampaignKey = (typeof CAMPAIGN_KEYS)[number];
export type Attribution = Partial<Record<CampaignKey, string>> & {
  landing_page?: string;
  referrer?: string;
  captured_at?: string;
};

type StoredAttribution = {
  first: Attribution;
  last: Attribution;
};

let inMemoryAttribution: StoredAttribution | null = null;

function readStoredAttribution(): StoredAttribution | null {
  if (typeof window === "undefined") return null;
  if (!hasAnyTrackingConsent()) return inMemoryAttribution;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as StoredAttribution) : inMemoryAttribution;
  } catch {
    return null;
  }
}

export function captureAttributionFromUrl(): StoredAttribution | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const campaign: Attribution = {};

  for (const key of CAMPAIGN_KEYS) {
    const value = params.get(key)?.trim();
    if (value) campaign[key] = value;
  }

  const previous = readStoredAttribution();
  if (Object.keys(campaign).length === 0) return previous;

  const current: Attribution = {
    ...campaign,
    landing_page: `${window.location.pathname}${window.location.search}`,
    captured_at: new Date().toISOString(),
  };

  if (document.referrer) current.referrer = document.referrer;

  const next: StoredAttribution = {
    first: previous?.first || current,
    last: current,
  };
  inMemoryAttribution = next;

  if (hasAnyTrackingConsent()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Tracking must never block a conversion when storage is unavailable.
    }
  }

  return next;
}

export function getAttribution(): Record<string, string> {
  const stored = readStoredAttribution();
  if (!stored) return {};

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(stored.first)) {
    if (value) result[`first_${key}`] = value;
  }
  for (const [key, value] of Object.entries(stored.last)) {
    if (value) result[`last_${key}`] = value;
  }

  return result;
}

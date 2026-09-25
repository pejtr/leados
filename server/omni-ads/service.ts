import { asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { omniAdCreatives, omniAdSites } from "../../drizzle/schema";

const arrayOfStrings = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
};

function publicCreative(creative: typeof omniAdCreatives.$inferSelect) {
  return {
    creativeKey: creative.creativeKey,
    advertiserKey: creative.advertiserKey,
    stream: creative.stream,
    format: creative.format,
    title: creative.title,
    assetUrl: creative.assetUrl,
    destinationUrl: creative.destinationUrl,
    altText: creative.altText || creative.title,
    tags: arrayOfStrings(creative.tags),
    priority: creative.priority,
    frequencyCap: creative.frequencyCap,
    frequencyWindowHours: creative.frequencyWindowHours,
    minRepeatMinutes: creative.minRepeatMinutes,
  };
}

export async function getPublicOmniAdsConfig(siteKey: string) {
  const disabled = {
    version: 1 as const,
    enabled: false,
    siteKey,
    customStream: [] as ReturnType<typeof publicCreative>[],
    mainstream: [] as ReturnType<typeof publicCreative>[],
  };

  const db = await getDb();
  if (!db) return disabled;

  try {
    const [site] = await db
      .select()
      .from(omniAdSites)
      .where(eq(omniAdSites.siteKey, siteKey))
      .limit(1);

    if (!site?.enabled) return disabled;

    const creatives = await db
      .select()
      .from(omniAdCreatives)
      .where(eq(omniAdCreatives.enabled, true))
      .orderBy(asc(omniAdCreatives.priority));

    const eligible = creatives.filter((creative) => {
      const targets = arrayOfStrings(creative.targetSiteKeys);
      return targets.length === 0 || targets.includes(siteKey);
    });

    return {
      version: 1 as const,
      enabled: true,
      siteKey,
      autoPlacement: site.autoPlacement,
      defaults: {
        frequencyCap: site.frequencyCap,
        frequencyWindowHours: site.frequencyWindowHours,
        minRepeatMinutes: site.minRepeatMinutes,
      },
      customStream: site.customStreamEnabled
        ? eligible.filter((creative) => creative.stream === "custom").map(publicCreative)
        : [],
      mainstream: site.mainstreamFallbackEnabled
        ? eligible.filter((creative) => creative.stream === "mainstream").map(publicCreative)
        : [],
    };
  } catch (error) {
    console.error("[OMNI ADS] config failed closed", error);
    return disabled;
  }
}

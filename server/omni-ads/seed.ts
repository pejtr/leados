import type { Pool } from "mysql2/promise";

const DEFAULT_SITES = [
  ["katastr-online.cz", "Katastr Online", "www.katastr-online.cz"],
  ["do-italie.cz", "DO ITÁLIE", "www.do-italie.cz"],
  ["bezmasajidla.cz", "Bezmasá Jídla", "www.bezmasajidla.cz"],
  ["flightscanner24", "FlightScanner24", null],
  ["humandesignmapa.cz", "Human Design Mapa", "www.humandesignmapa.cz"],
  ["xmlvalidatoronline.com", "XML Validator Online", "xmlvalidatoronline.com"],
  ["akcni-letenky.com", "Akční Letenky", "www.akcni-letenky.com"],
  ["lastminutedovolene.cz", "Last Minute Dovolené", "www.lastminutedovolene.cz"],
  ["ohorai.com", "OHORAI", "www.ohorai.com"],
] as const;

export async function seedOmniAdsDefaults(pool: Pool): Promise<void> {
  for (const [siteKey, name, domain] of DEFAULT_SITES) {
    await pool.execute(
      "INSERT IGNORE INTO omni_ad_sites (siteKey, name, domain, enabled, customStreamEnabled, mainstreamFallbackEnabled, autoPlacement) VALUES (?, ?, ?, false, true, true, false)",
      [siteKey, name, domain],
    );
  }

  await pool.execute(
    `INSERT IGNORE INTO omni_ad_creatives
      (creativeKey, advertiserKey, stream, format, title, assetUrl, destinationUrl, altText, tags, targetSiteKeys, priority, frequencyCap, frequencyWindowHours, minRepeatMinutes, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
    [
      "ohorai-essence-mainstream-001",
      "ohorai",
      "mainstream",
      "image",
      "Vůně, která vám rozzáří život",
      "https://files.manuscdn.com/user_upload_by_module/session_file/89740521/kHMUXlMPeoZAzGhj.png",
      "https://www.ohorai.com/",
      "OHORAI — aromaterapeutické esence, ruční tvorba a muzikoterapie",
      JSON.stringify(["ohorai", "aromaterapie", "wellbeing", "handmade", "portrait"]),
      JSON.stringify([]),
      100,
      2,
      168,
      1440,
    ],
  );
}

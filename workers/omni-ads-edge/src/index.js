import RUNTIME_SOURCE from "./runtime-source.js";

const SITE_KEY = /^[a-z0-9][a-z0-9.-]{1,95}$/;
const CREATIVE_KEY = /^[a-z0-9][a-z0-9._-]{1,127}$/i;
const EVENT_TYPES = new Set(["impression", "click"]);

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...jsonHeaders, ...extraHeaders },
  });
}

function disabled(siteKey) {
  return {
    version: 1,
    enabled: false,
    siteKey,
    customStream: [],
    mainstream: [],
  };
}

function stringArray(value) {
  return Array.isArray(value)
    ? value.filter((entry) => typeof entry === "string")
    : [];
}

function publicCreative(creative) {
  return {
    creativeKey: creative.creativeKey,
    advertiserKey: creative.advertiserKey,
    stream: creative.stream,
    format: creative.format || "image",
    title: creative.title,
    assetUrl: creative.assetUrl,
    destinationUrl: creative.destinationUrl,
    altText: creative.altText || creative.title,
    tags: stringArray(creative.tags),
    priority: Number(creative.priority || 100),
    frequencyCap: Number(creative.frequencyCap || 3),
    frequencyWindowHours: Number(
      creative.frequencyWindowHours || 168,
    ),
    minRepeatMinutes: Number(
      creative.minRepeatMinutes || 360,
    ),
  };
}

async function readSite(env, siteKey) {
  return env.OMNI_ADS_CONFIG.get(
    "site:" + siteKey,
    "json",
  );
}

async function readCreatives(env) {
  const value = await env.OMNI_ADS_CONFIG.get(
    "creatives",
    "json",
  );
  return Array.isArray(value) ? value : [];
}

async function publicConfig(env, siteKey) {
  const off = disabled(siteKey);
  const site = await readSite(env, siteKey);
  if (!site || site.enabled !== true) return off;

  const creatives = await readCreatives(env);
  const eligible = creatives.filter((creative) => {
    if (!creative || creative.enabled === false) return false;
    const targets = stringArray(creative.targetSiteKeys);
    return targets.length === 0 || targets.includes(siteKey);
  });

  return {
    version: 1,
    enabled: true,
    siteKey,
    autoPlacement: site.autoPlacement === true,
    defaults: {
      frequencyCap: Number(site.frequencyCap || 3),
      frequencyWindowHours: Number(
        site.frequencyWindowHours || 168,
      ),
      minRepeatMinutes: Number(
        site.minRepeatMinutes || 360,
      ),
    },
    customStream:
      site.customStreamEnabled === false
        ? []
        : eligible
            .filter(
              (creative) => creative.stream === "custom",
            )
            .sort(
              (a, b) =>
                Number(a.priority || 100) -
                Number(b.priority || 100),
            )
            .map(publicCreative),
    mainstream:
      site.mainstreamFallbackEnabled === false
        ? []
        : eligible
            .filter(
              (creative) =>
                creative.stream === "mainstream",
            )
            .sort(
              (a, b) =>
                Number(a.priority || 100) -
                Number(b.priority || 100),
            )
            .map(publicCreative),
  };
}

function isAdmin(request, env) {
  if (!env.OMNI_ADS_ADMIN_TOKEN) return false;
  const auth = request.headers.get("Authorization") || "";
  return auth === "Bearer " + env.OMNI_ADS_ADMIN_TOKEN;
}

function normalizeSite(input, siteKey) {
  return {
    siteKey,
    name:
      typeof input.name === "string"
        ? input.name.slice(0, 160)
        : siteKey,
    domain:
      typeof input.domain === "string"
        ? input.domain.slice(0, 255)
        : null,
    enabled: input.enabled === true,
    customStreamEnabled:
      input.customStreamEnabled !== false,
    mainstreamFallbackEnabled:
      input.mainstreamFallbackEnabled !== false,
    autoPlacement: input.autoPlacement === true,
    frequencyCap: Math.max(
      1,
      Math.min(20, Number(input.frequencyCap || 3)),
    ),
    frequencyWindowHours: Math.max(
      1,
      Math.min(
        720,
        Number(input.frequencyWindowHours || 168),
      ),
    ),
    minRepeatMinutes: Math.max(
      0,
      Math.min(
        10080,
        Number(input.minRepeatMinutes || 360),
      ),
    ),
  };
}

function normalizeCreative(input) {
  if (
    !input ||
    typeof input.creativeKey !== "string" ||
    !CREATIVE_KEY.test(input.creativeKey) ||
    typeof input.assetUrl !== "string" ||
    typeof input.destinationUrl !== "string"
  ) {
    return null;
  }

  let asset;
  let destination;
  try {
    asset = new URL(input.assetUrl);
    destination = new URL(input.destinationUrl);
  } catch {
    return null;
  }

  if (
    asset.protocol !== "https:" ||
    destination.protocol !== "https:"
  ) {
    return null;
  }

  return {
    creativeKey: input.creativeKey,
    advertiserKey:
      typeof input.advertiserKey === "string"
        ? input.advertiserKey.slice(0, 96)
        : "unknown",
    stream:
      input.stream === "custom"
        ? "custom"
        : "mainstream",
    format: input.format === "video" ? "video" : "image",
    title:
      typeof input.title === "string"
        ? input.title.slice(0, 255)
        : input.creativeKey,
    assetUrl: asset.toString(),
    destinationUrl: destination.toString(),
    altText:
      typeof input.altText === "string"
        ? input.altText.slice(0, 512)
        : undefined,
    tags: stringArray(input.tags).slice(0, 32),
    targetSiteKeys: stringArray(
      input.targetSiteKeys,
    ).slice(0, 64),
    priority: Math.max(
      1,
      Math.min(9999, Number(input.priority || 100)),
    ),
    frequencyCap: Math.max(
      1,
      Math.min(20, Number(input.frequencyCap || 3)),
    ),
    frequencyWindowHours: Math.max(
      1,
      Math.min(
        720,
        Number(input.frequencyWindowHours || 168),
      ),
    ),
    minRepeatMinutes: Math.max(
      0,
      Math.min(
        10080,
        Number(input.minRepeatMinutes || 360),
      ),
    ),
    enabled: input.enabled !== false,
  };
}

async function handleEvent(request, env) {
  const length = Number(
    request.headers.get("Content-Length") || "0",
  );
  if (length > 8192) return new Response(null, { status: 204 });

  let input;
  try {
    input = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 204 });
  }

  const siteKey =
    typeof input.siteKey === "string" ? input.siteKey : "";
  const creativeKey =
    typeof input.creativeKey === "string"
      ? input.creativeKey
      : "";
  const eventType =
    typeof input.eventType === "string"
      ? input.eventType
      : "";

  if (
    !SITE_KEY.test(siteKey) ||
    !CREATIVE_KEY.test(creativeKey) ||
    !EVENT_TYPES.has(eventType)
  ) {
    return new Response(null, { status: 204 });
  }

  const site = await readSite(env, siteKey);
  if (!site || site.enabled !== true) {
    return new Response(null, { status: 204 });
  }

  const creatives = await readCreatives(env);
  if (
    !creatives.some(
      (creative) =>
        creative &&
        creative.enabled !== false &&
        creative.creativeKey === creativeKey,
    )
  ) {
    return new Response(null, { status: 204 });
  }

  const placement =
    typeof input.placement === "string"
      ? input.placement.slice(0, 96)
      : null;
  const pagePath =
    typeof input.pagePath === "string"
      ? input.pagePath.slice(0, 512)
      : null;

  let referrerHost = null;
  const referrer = request.headers.get("Referer");
  if (referrer) {
    try {
      referrerHost = new URL(referrer).hostname.slice(0, 255);
    } catch {
      referrerHost = null;
    }
  }

  try {
    await env.OMNI_ADS_DB.prepare(
      "INSERT INTO omni_ad_events " +
        "(timestamp, site_key, creative_key, event_type, placement, page_path, referrer_host) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        Date.now(),
        siteKey,
        creativeKey,
        eventType,
        placement,
        pagePath,
        referrerHost,
      )
      .run();
  } catch {
    // Telemetry failure never breaks the ad experience.
  }

  return new Response(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

async function adminSites(request, env, url) {
  if (!isAdmin(request, env)) {
    return json({ error: "unauthorized" }, 401);
  }

  if (
    request.method === "GET" &&
    url.pathname.endsWith("/sites")
  ) {
    const listed = await env.OMNI_ADS_CONFIG.list({
      prefix: "site:",
      limit: 1000,
    });
    const sites = [];
    for (const key of listed.keys) {
      const site = await env.OMNI_ADS_CONFIG.get(
        key.name,
        "json",
      );
      if (site) sites.push(site);
    }
    sites.sort((a, b) =>
      String(a.name).localeCompare(String(b.name)),
    );
    return json({ sites });
  }

  const prefix = "/omni-ads/v1/admin/sites/";
  if (
    request.method !== "POST" ||
    !url.pathname.startsWith(prefix)
  ) {
    return json({ error: "not_found" }, 404);
  }

  const siteKey = decodeURIComponent(
    url.pathname.slice(prefix.length),
  );
  if (!SITE_KEY.test(siteKey)) {
    return json({ error: "invalid_site_key" }, 400);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const site = normalizeSite(input, siteKey);
  await env.OMNI_ADS_CONFIG.put(
    "site:" + siteKey,
    JSON.stringify(site),
  );
  return json({ ok: true, site });
}

async function adminCreatives(request, env) {
  if (!isAdmin(request, env)) {
    return json({ error: "unauthorized" }, 401);
  }

  if (request.method === "GET") {
    return json({ creatives: await readCreatives(env) });
  }

  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const creative = normalizeCreative(input);
  if (!creative) {
    return json({ error: "invalid_creative" }, 400);
  }

  const creatives = await readCreatives(env);
  const next = creatives.filter(
    (entry) =>
      entry &&
      entry.creativeKey !== creative.creativeKey,
  );
  next.push(creative);

  await env.OMNI_ADS_CONFIG.put(
    "creatives",
    JSON.stringify(next),
  );
  return json({ ok: true, creative });
}

async function adminStats(request, env) {
  if (!isAdmin(request, env)) {
    return json({ error: "unauthorized" }, 401);
  }

  const result = await env.OMNI_ADS_DB.prepare(
    "SELECT site_key AS siteKey, creative_key AS creativeKey, " +
      "event_type AS eventType, COUNT(*) AS count " +
      "FROM omni_ad_events " +
      "GROUP BY site_key, creative_key, event_type " +
      "ORDER BY count DESC LIMIT 500",
  ).all();

  return json({ rows: result.results || [] });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers":
            "Authorization,Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (
      request.method === "GET" &&
      path === "/omni-ads/runtime.js"
    ) {
      return new Response(RUNTIME_SOURCE, {
        status: 200,
        headers: {
          "Content-Type":
            "application/javascript; charset=utf-8",
          "Cache-Control":
            "public, max-age=300, stale-while-revalidate=3600",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const configPrefix = "/omni-ads/v1/config/";
    if (
      request.method === "GET" &&
      path.startsWith(configPrefix)
    ) {
      const siteKey = decodeURIComponent(
        path.slice(configPrefix.length),
      );
      if (!SITE_KEY.test(siteKey)) {
        return json(disabled(siteKey), 400);
      }
      return json(await publicConfig(env, siteKey));
    }

    if (
      request.method === "POST" &&
      path === "/omni-ads/v1/event"
    ) {
      return handleEvent(request, env);
    }

    if (path.startsWith("/omni-ads/v1/admin/sites")) {
      return adminSites(request, env, url);
    }

    if (path === "/omni-ads/v1/admin/creatives") {
      return adminCreatives(request, env);
    }

    if (path === "/omni-ads/v1/admin/stats") {
      return adminStats(request, env);
    }

    return json({ error: "not_found" }, 404);
  },
};

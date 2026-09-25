import express, { type Express, type Request } from "express";
import type { Pool } from "mysql2/promise";
import { getPublicOmniAdsConfig } from "./service";
import { ensureOmniAdsSchema } from "./schema";

const SITE_KEY = /^[a-z0-9][a-z0-9.-]{1,95}$/;
const CREATIVE_KEY = /^[a-z0-9][a-z0-9._-]{1,127}$/i;
const EVENT_TYPE = new Set(["impression", "click"]);

const RUNTIME_SOURCE = String.raw\`(() => {
  "use strict";

  const script =
    document.currentScript ||
    document.querySelector("script[data-omni-site]");
  if (!script) return;

  const siteKey = script.dataset.omniSite;
  if (!siteKey) return;

  const runtimeOrigin = new URL(script.src, window.location.href).origin;
  const storagePrefix = "omniAds:v1:" + siteKey + ":";

  function readHistory(creativeKey) {
    try {
      const value = JSON.parse(localStorage.getItem(storagePrefix + creativeKey) || "[]");
      return Array.isArray(value) ? value.filter(Number.isFinite) : [];
    } catch {
      return [];
    }
  }

  function isEligible(creative, defaults) {
    const now = Date.now();
    const windowMs =
      (creative.frequencyWindowHours || defaults.frequencyWindowHours || 168) * 3600000;
    const minRepeatMs =
      (creative.minRepeatMinutes || defaults.minRepeatMinutes || 360) * 60000;
    const cap = creative.frequencyCap || defaults.frequencyCap || 3;
    const recent = readHistory(creative.creativeKey).filter((value) => now - value < windowMs);

    if (recent.length >= cap) return false;
    if (recent.length > 0 && now - recent[recent.length - 1] < minRepeatMs) return false;
    return true;
  }

  function remember(creativeKey) {
    const now = Date.now();
    const recent = readHistory(creativeKey)
      .filter((value) => now - value < 30 * 86400000)
      .slice(-19);
    recent.push(now);
    try {
      localStorage.setItem(storagePrefix + creativeKey, JSON.stringify(recent));
    } catch {
      // Storage may be unavailable. Rendering still works; server remains stateless.
    }
  }

  function sendEvent(eventType, creative, placement) {
    const payload = {
      siteKey,
      creativeKey: creative.creativeKey,
      eventType,
      placement,
      pagePath: window.location.pathname,
    };

    fetch(runtimeOrigin + "/omni-ads/v1/event", {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  function pickCreative(config) {
    const defaults = config.defaults || {};
    const custom = (config.customStream || []).filter((creative) =>
      isEligible(creative, defaults),
    );
    const mainstream = (config.mainstream || []).filter((creative) =>
      isEligible(creative, defaults),
    );

    const pool = custom.length > 0 ? custom : mainstream;
    if (pool.length === 0) return null;

    const topPriority = Math.min(...pool.map((creative) => creative.priority || 100));
    const topPool = pool.filter(
      (creative) => (creative.priority || 100) === topPriority,
    );
    return topPool[Math.floor(Math.random() * topPool.length)] || pool[0];
  }

  function renderCreative(slot, creative) {
    const placement = slot.dataset.omniAdsSlot || "default";
    const wrapper = document.createElement("div");
    wrapper.dataset.omniAdsRendered = creative.creativeKey;
    wrapper.style.cssText =
      "width:100%;max-width:1200px;margin:24px auto;text-align:center;box-sizing:border-box";

    const disclosure = document.createElement("div");
    disclosure.textContent = "Doporučení / reklama";
    disclosure.style.cssText =
      "font:500 10px/1.4 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin:0 0 6px";

    const link = document.createElement("a");
    link.href = creative.destinationUrl;
    link.target = "_blank";
    link.rel = "noopener sponsored";
    link.setAttribute("aria-label", creative.title || "Reklama");
    link.style.cssText = "display:block;text-decoration:none";

    if (creative.format === "image") {
      const image = document.createElement("img");
      image.src = creative.assetUrl;
      image.alt = creative.altText || creative.title || "Reklama";
      image.loading = "lazy";
      image.decoding = "async";
      image.style.cssText =
        "display:block;width:100%;height:auto;max-width:100%;margin:0 auto;border-radius:12px";
      link.appendChild(image);
    } else {
      return;
    }

    link.addEventListener("click", () => sendEvent("click", creative, placement));
    wrapper.append(disclosure, link);
    slot.replaceChildren(wrapper);
    remember(creative.creativeKey);
    sendEvent("impression", creative, placement);
  }

  fetch(
    runtimeOrigin +
      "/omni-ads/v1/config/" +
      encodeURIComponent(siteKey),
    { mode: "cors", credentials: "omit" },
  )
    .then((response) => (response.ok ? response.json() : null))
    .then((config) => {
      if (!config || config.enabled !== true) return;

      let slots = Array.from(document.querySelectorAll("[data-omni-ads-slot]"));
      if (slots.length === 0 && config.autoPlacement === true) {
        const slot = document.createElement("div");
        slot.dataset.omniAdsSlot = "auto-footer";
        const footer = document.querySelector("footer");
        if (footer && footer.parentNode) {
          footer.parentNode.insertBefore(slot, footer);
        } else {
          document.body.appendChild(slot);
        }
        slots = [slot];
      }

      for (const slot of slots) {
        const creative = pickCreative(config);
        if (creative) renderCreative(slot, creative);
      }
    })
    .catch(() => {
      // Fail closed: no config means no ad and no layout shift.
    });
})();\`;

function referrerHost(req: Request): string | null {
  const raw = req.get("referer");
  if (!raw) return null;
  try {
    return new URL(raw).hostname.slice(0, 255);
  } catch {
    return null;
  }
}

export async function registerOmniAdsRuntime(
  app: Express,
  pool: Pool | null,
): Promise<void> {
  if (pool) await ensureOmniAdsSchema(pool);

  app.get("/omni-ads/runtime.js", (_req, res) => {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(RUNTIME_SOURCE);
  });

  app.get("/omni-ads/v1/config/:siteKey", async (req, res) => {
    const siteKey = req.params.siteKey || "";
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");

    if (!SITE_KEY.test(siteKey)) {
      return res.status(400).json({
        version: 1,
        enabled: false,
        siteKey,
        customStream: [],
        mainstream: [],
      });
    }

    return res.json(await getPublicOmniAdsConfig(siteKey));
  });

  app.post(
    "/omni-ads/v1/event",
    express.text({ type: "text/plain", limit: "8kb" }),
    async (req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (!pool) return res.status(204).end();

      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(typeof req.body === "string" ? req.body : "{}");
      } catch {
        return res.status(204).end();
      }

      const siteKey = typeof body.siteKey === "string" ? body.siteKey : "";
      const creativeKey =
        typeof body.creativeKey === "string" ? body.creativeKey : "";
      const eventType =
        typeof body.eventType === "string" ? body.eventType : "";
      const placement =
        typeof body.placement === "string" ? body.placement.slice(0, 96) : null;
      const pagePath =
        typeof body.pagePath === "string" ? body.pagePath.slice(0, 512) : null;

      if (
        !SITE_KEY.test(siteKey) ||
        !CREATIVE_KEY.test(creativeKey) ||
        !EVENT_TYPE.has(eventType)
      ) {
        return res.status(204).end();
      }

      try {
        await pool.execute(
          "INSERT INTO omni_ad_events (timestamp, siteKey, creativeKey, eventType, placement, pagePath, referrerHost) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            Date.now(),
            siteKey,
            creativeKey,
            eventType,
            placement,
            pagePath,
            referrerHost(req),
          ],
        );
      } catch (error) {
        console.error("[OMNI ADS] event write failed", error);
      }

      return res.status(204).end();
    },
  );
}

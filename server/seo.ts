import type { Express } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { CORE_OFFERS, WEB_PACKAGES } from "../shared/service-catalog";
import { DEFAULT_SEO, ROUTE_SEO, type RouteSeo } from "../shared/seo-config";
import { PUBLIC_SITE_URL } from "../shared/brand-config";

let templatePromise: Promise<string> | null = null;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function replaceOrInsert(html: string, pattern: RegExp, replacement: string) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace("</head>", "  " + replacement + "\n  </head>");
}

function setMeta(html: string, attribute: "name" | "property", key: string, content: string) {
  const pattern = new RegExp("<meta\\s+" + attribute + "=[\"']" + key + "[\"'][^>]*>", "i");
  const tag = '<meta ' + attribute + '="' + key + '" content="' + escapeHtml(content) + '" />';
  return replaceOrInsert(html, pattern, tag);
}

function buildPageSchema(route: string, seo: RouteSeo) {
  if (seo.noIndex || !seo.schemaType) return null;
  const url = PUBLIC_SITE_URL + (route === "/" ? "/" : route);

  if (seo.schemaType === "OfferCatalog") {
    return {
      "@context": "https://schema.org",
      "@type": "OfferCatalog",
      name: "Ceník služeb OPTIMATEO",
      url,
      itemListElement: [...Object.values(CORE_OFFERS), ...Object.values(WEB_PACKAGES)].map((offer) => ({
        "@type": "Offer",
        priceCurrency: "CZK",
        price: offer.priceInCzk,
        itemOffered: { "@type": "Service", name: offer.name, description: offer.description },
      })),
    };
  }

  if (seo.schemaType === "Service") {
    return {
      "@context": "https://schema.org",
      "@type": "Service",
      name: seo.title.split("|")[0].trim(),
      description: seo.description,
      url,
      areaServed: { "@type": "Country", name: "Česko" },
      provider: { "@type": "ProfessionalService", name: "OPTIMATEO", url: PUBLIC_SITE_URL },
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seo.title.split("|")[0].trim(),
    description: seo.description,
    url,
  };
}

export function renderSeoHtml(template: string, route: string) {
  const seo = ROUTE_SEO[route] || DEFAULT_SEO;
  const canonical = PUBLIC_SITE_URL + (route === "/" ? "/" : route);
  let html = template.replace(/<title>[^<]*<\/title>/i, "<title>" + escapeHtml(seo.title) + "</title>");
  html = setMeta(html, "name", "description", seo.description);
  html = setMeta(html, "name", "robots", seo.noIndex ? "noindex, nofollow" : "index, follow");
  html = setMeta(html, "property", "og:title", seo.title);
  html = setMeta(html, "property", "og:description", seo.description);
  html = setMeta(html, "property", "og:url", canonical);
  html = setMeta(html, "name", "twitter:title", seo.title);
  html = setMeta(html, "name", "twitter:description", seo.description);
  html = replaceOrInsert(
    html,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    '<link rel="canonical" href="' + escapeHtml(canonical) + '" />',
  );

  const schema = buildPageSchema(route, seo);
  if (schema) {
    const script = '<script id="optimateo-server-page-schema" type="application/ld+json">'
      + JSON.stringify(schema).replaceAll("<", "\\u003c")
      + "</script>";
    html = html.replace("</head>", "  " + script + "\n  </head>");
  }

  return html;
}

export function registerSeoRoutes(app: Express) {
  if (process.env.NODE_ENV !== "production") return;
  const routes = Object.keys(ROUTE_SEO);

  app.get(routes, async (req, res, next) => {
    try {
      const normalizedPath = req.path.length > 1 ? req.path.replace(/\/+$/, "") : "/";
      const seo = ROUTE_SEO[normalizedPath] || DEFAULT_SEO;
      templatePromise ??= fs.readFile(path.resolve(import.meta.dirname, "public", "index.html"), "utf8");
      const template = await templatePromise;
      res.setHeader("Cache-Control", "no-cache");
      if (seo.noIndex) res.setHeader("X-Robots-Tag", "noindex, nofollow");
      res.status(normalizedPath === "/404" ? 404 : 200).type("html").send(renderSeoHtml(template, normalizedPath));
    } catch (error) {
      next(error);
    }
  });
}

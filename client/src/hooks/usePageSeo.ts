import { useEffect } from "react";
import { PUBLIC_SITE_URL } from "@shared/brand-config";

const DEFAULT_IMAGE = `${PUBLIC_SITE_URL}/optimateo-brand.png`;

type PageSeoOptions = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  schema?: Record<string, unknown>;
};

function setMeta(selector: string, attribute: "name" | "property", value: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function usePageSeo({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  noIndex = false,
  type = "website",
  schema,
}: PageSeoOptions) {
  useEffect(() => {
    const canonicalUrl = new URL(path, PUBLIC_SITE_URL).toString();
    const imageUrl = new URL(image, PUBLIC_SITE_URL).toString();

    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[name="robots"]', "name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:type"]', "property", "og:type", type);
    setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMeta('meta[property="og:image"]', "property", "og:image", imageUrl);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", imageUrl);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const schemaId = "optimateo-page-schema";
    document.getElementById(schemaId)?.remove();
    if (schema && !noIndex) {
      const script = document.createElement("script");
      script.id = schemaId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => document.getElementById(schemaId)?.remove();
  }, [description, image, noIndex, path, schema, title, type]);
}

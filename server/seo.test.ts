import { describe, expect, it } from "vitest";
import { renderSeoHtml } from "./seo";

const template = `<!doctype html>
<html>
  <head>
    <title>Default</title>
    <meta name="description" content="Default" />
    <meta name="robots" content="index, follow" />
    <meta property="og:title" content="Default" />
    <meta property="og:description" content="Default" />
    <meta property="og:url" content="https://www.optimateo.com/" />
    <meta name="twitter:title" content="Default" />
    <meta name="twitter:description" content="Default" />
    <link rel="canonical" href="https://www.optimateo.com/" />
  </head>
  <body></body>
</html>`;

describe("route SEO HTML", () => {
  it("renders unique metadata and service schema for a landing page", () => {
    const html = renderSeoHtml(template, "/lp/b2b");

    expect(html).toContain("<title>B2B lead generation, web a CRM | OPTIMATEO</title>");
    expect(html).toContain('href="https://www.optimateo.com/lp/b2b"');
    expect(html).toContain('"@type":"Service"');
    expect(html).toContain('content="index, follow"');
  });

  it("marks internal pages as noindex in the first HTML response", () => {
    const html = renderSeoHtml(template, "/admin");

    expect(html).toContain("<title>Administrace | OPTIMATEO</title>");
    expect(html).toContain('content="noindex, nofollow"');
    expect(html).not.toContain("optimateo-server-page-schema");
  });
});

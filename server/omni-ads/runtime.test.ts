import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { registerOmniAdsRuntime } from "./runtime";

let server: Server | null = null;

async function start() {
  const app = express();
  await registerOmniAdsRuntime(app, null);
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server!.once("listening", () => resolve()));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve) => server!.close(() => resolve()));
  server = null;
});

describe("OMNI ADS public runtime", () => {
  it("serves the shared runtime script", async () => {
    const base = await start();
    const response = await fetch(base + "/omni-ads/runtime.js");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/javascript");
    expect(body).toContain("data-omni-site");
    expect(body).toContain("customStream");
    expect(body).toContain("mainstream");
  });

  it("fails closed when no database/config is available", async () => {
    const base = await start();
    const response = await fetch(base + "/omni-ads/v1/config/katastr-online.cz");
    const body = await response.json() as { enabled: boolean; siteKey: string };

    expect(response.status).toBe(200);
    expect(body.enabled).toBe(false);
    expect(body.siteKey).toBe("katastr-online.cz");
  });

  it("rejects malformed site keys", async () => {
    const base = await start();
    const response = await fetch(base + "/omni-ads/v1/config/INVALID!!");
    const body = await response.json() as { enabled: boolean };

    expect(response.status).toBe(400);
    expect(body.enabled).toBe(false);
  });

  it("accepts anonymous telemetry as a no-op without a DB", async () => {
    const base = await start();
    const response = await fetch(base + "/omni-ads/v1/event", {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({
        siteKey: "katastr-online.cz",
        creativeKey: "ohorai-essence-mainstream-001",
        eventType: "impression",
        placement: "content-tail",
        pagePath: "/",
      }),
    });

    expect(response.status).toBe(204);
  });
});

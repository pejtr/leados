import { describe, expect, it, vi } from "vitest";

import { readMetaEventsBridgeStatus } from "./metaEvents";

describe("Meta events MCP bridge", () => {
  it("fails closed when OMNIFORGE bridge config is absent", async () => {
    await expect(readMetaEventsBridgeStatus({})).resolves.toEqual({
      configured: false,
      reachable: false,
      status: null,
      reason: "omniforge_meta_bridge_not_configured",
    });
  });

  it("reads sanitized OMNIFORGE conversion status with bearer auth", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          metaConversions: {
            enabled: true,
            allowlistedBrands: ["doitalie"],
            brands: [
              {
                brandSlug: "doitalie",
                datasetConfigured: true,
                pixelConfigured: true,
                testMode: true,
              },
            ],
          },
          secretsExposed: false,
          mutations: 0,
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const result = await readMetaEventsBridgeStatus(
      {
        OPTIHUB_OMNIFORGE_URL: "https://forge.optihub.cz/",
        OPTIHUB_OMNIFORGE_CONTROL_TOKEN: "control-secret",
      },
      fetchImpl
    );

    expect(result.configured).toBe(true);
    expect(result.reachable).toBe(true);
    expect(result.reason).toBe("ready");

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(
      "https://forge.optihub.cz/api/v1/internal/meta/conversions/status"
    );
    expect((init?.headers as Record<string, string>)["authorization"]).toBe(
      "Bearer control-secret"
    );
    expect(JSON.stringify(result)).not.toContain("control-secret");
  });

  it("reports upstream auth failure without exposing credentials", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("", { status: 401 }));

    const result = await readMetaEventsBridgeStatus(
      {
        OPTIHUB_OMNIFORGE_URL: "https://forge.optihub.cz",
        OPTIHUB_OMNIFORGE_CONTROL_TOKEN: "secret",
      },
      fetchImpl
    );

    expect(result).toEqual({
      configured: true,
      reachable: false,
      status: null,
      reason: "omniforge_status_http_401",
    });
    expect(JSON.stringify(result)).not.toContain("secret");
  });
});

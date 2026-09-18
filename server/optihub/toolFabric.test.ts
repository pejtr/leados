import { describe, expect, it } from "vitest";

import { OMNI_TOOL_CATALOG, planOmniToolRoute } from "./toolFabric/catalog";
import { callOmniReadTool, probeOmniToolProvider } from "./toolFabric/broker";
import { resolveOmniToolProviders } from "./toolFabric/config";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("OMNI Tool Fabric", () => {
  it("catalogs the nine approved providers and disables writes by default", () => {
    expect(OMNI_TOOL_CATALOG.map(item => item.id)).toEqual([
      "firecrawl", "brave-search", "stripe", "figma", "notion", "mem0", "composio", "playwright", "e2b",
    ]);
    expect(OMNI_TOOL_CATALOG.every(item => item.writeDefaultDisabled)).toBe(true);
  });

  it("routes revenue research read-only and billing through a human gate", () => {
    expect(planOmniToolRoute("lead_research")).toMatchObject({
      providers: ["brave-search", "firecrawl"],
      risk: "read",
      humanGateRequired: false,
    });
    expect(planOmniToolRoute("billing")).toMatchObject({
      providers: ["stripe"],
      risk: "financial",
      humanGateRequired: true,
    });
  });

  it("requires global and provider activation", () => {
    const disabled = resolveOmniToolProviders({
      FIRECRAWL_API_KEY: "test",
      OPTIHUB_TOOL_FIRECRAWL_ENABLED: "true",
    } as NodeJS.ProcessEnv);
    expect(disabled.find(item => item.definition.id === "firecrawl")?.enabled).toBe(false);

    const enabled = resolveOmniToolProviders({
      OPTIHUB_TOOL_FABRIC_ENABLED: "true",
      OPTIHUB_TOOL_FIRECRAWL_ENABLED: "true",
      FIRECRAWL_API_KEY: "test",
    } as NodeJS.ProcessEnv);
    expect(enabled.find(item => item.definition.id === "firecrawl")).toMatchObject({
      configured: true,
      enabled: true,
      statusReason: "ready",
    });
  });

  it("rejects mutating tools before network execution", async () => {
    await expect(
      callOmniReadTool(
        "stripe",
        "create_refund",
        {},
        {
          OPTIHUB_TOOL_FABRIC_ENABLED: "true",
          OPTIHUB_TOOL_STRIPE_ENABLED: "true",
          STRIPE_SECRET_KEY: "test",
        } as NodeJS.ProcessEnv,
        async () => { throw new Error("network should not run"); },
      ),
    ).rejects.toThrow("not allowlisted as read-only");
  });

  it("probes and calls an allowlisted read tool through MCP", async () => {
    const methods: string[] = [];
    const fetchImpl: typeof fetch = async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { method?: string; id?: number; params?: { name?: string } };
      methods.push(body.method ?? "");
      if (body.method === "initialize") return jsonResponse({ jsonrpc: "2.0", id: body.id, result: {} });
      if (body.method === "tools/list") return jsonResponse({ jsonrpc: "2.0", id: body.id, result: { tools: [{ name: "firecrawl_search" }] } });
      return jsonResponse({ jsonrpc: "2.0", id: body.id, result: { tool: body.params?.name } });
    };
    const env = {
      OPTIHUB_TOOL_FABRIC_ENABLED: "true",
      OPTIHUB_TOOL_FIRECRAWL_ENABLED: "true",
      FIRECRAWL_API_KEY: "test",
    } as NodeJS.ProcessEnv;

    await expect(probeOmniToolProvider("firecrawl", env, fetchImpl)).resolves.toMatchObject({ ok: true, toolCount: 1 });
    await expect(callOmniReadTool("firecrawl", "firecrawl_search", { query: "lead generation" }, env, fetchImpl)).resolves.toMatchObject({ tool: "firecrawl_search" });
    expect(methods).toEqual(["initialize", "tools/list", "initialize", "tools/call"]);
  });
});

import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";
import { ENV } from "./env";
import type { Tool } from "./llm";

let client: Client | null = null;
let transport: StdioClientTransport | null = null;

function getServerConfig(): { command: string; args: string[] } | null {
  const mcpEnabled = process.env.MCP_ENABLED === "true" || ENV.googleWorkspaceMcpEnabled;
  const command = process.env.MCP_SERVER_COMMAND;
  if (!mcpEnabled || !command) return null;
  const args = process.env.MCP_SERVER_ARGS
    ? process.env.MCP_SERVER_ARGS.split(" ").filter(Boolean)
    : [];
  return { command, args };
}

async function ensureClient(): Promise<Client> {
  if (client) return client;
  const config = getServerConfig();
  if (!config) throw new Error("MCP is not enabled or configured");
  client = new Client(
    { name: "onyx-os", version: "1.0.0" },
    { capabilities: {} },
  );
  transport = new StdioClientTransport({
    command: config.command,
    args: config.args,
  });
  await client.connect(transport);
  return client;
}

export async function loadMcpTools(): Promise<Tool[]> {
  const config = getServerConfig();
  if (!config) return [];
  try {
    const c = await ensureClient();
    const result = await c.listTools();
    return result.tools
      .filter(
        t =>
          ENV.mcpAllowedTools.length === 0 ||
          ENV.mcpAllowedTools.includes(t.name),
      )
      .map(t => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema as Record<string, unknown>,
        },
      }));
  } catch (e) {
    console.warn("[MCP] Failed to load tools:", e);
    return [];
  }
}

export async function executeMcpTool(
  name: string,
  args: string,
): Promise<unknown> {
  const c = await ensureClient();
  let parsedArgs: Record<string, unknown> = {};
  if (args) {
    try {
      parsedArgs = JSON.parse(args);
    } catch {
      // use raw string if JSON parse fails
    }
  }
  const result = await c.callTool({ name, arguments: parsedArgs });
  if (result.isError) {
    const errorText =
      (result.content as Array<{ type: string; text: string }>)
        ?.filter(c => c.type === "text")
        .map(c => c.text)
        .join("\n") || "Unknown MCP tool error";
    throw new Error(`MCP tool "${name}" failed: ${errorText}`);
  }
  const text =
    (result.content as Array<{ type: string; text: string }>)
      ?.filter(c => c.type === "text")
      .map(c => c.text)
      .join("\n") || "";
  return text || result;
}

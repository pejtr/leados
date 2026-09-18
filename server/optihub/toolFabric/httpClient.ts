export interface McpHttpClientOptions {
  readonly endpoint: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
}

interface JsonRpcEnvelope {
  readonly jsonrpc?: string;
  readonly id?: unknown;
  readonly result?: unknown;
  readonly error?: { readonly code?: number; readonly message?: string };
}

function parseSse(text: string): JsonRpcEnvelope {
  const payloads = text
    .split(/\r?\n/)
    .filter(line => line.startsWith("data:"))
    .map(line => line.slice(5).trim())
    .filter(Boolean);
  if (!payloads.length) throw new Error("MCP upstream returned empty SSE response");
  return JSON.parse(payloads[payloads.length - 1]!) as JsonRpcEnvelope;
}

async function parseResponse(response: Response): Promise<JsonRpcEnvelope> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (!response.ok) throw new Error(`MCP upstream HTTP ${response.status}`);
  if (contentType.includes("text/event-stream")) return parseSse(text);
  if (!text.trim()) throw new Error("MCP upstream returned an empty response");
  return JSON.parse(text) as JsonRpcEnvelope;
}

export class McpHttpClient {
  private readonly fetchImpl: typeof fetch;
  private readonly endpoint: string;
  private readonly baseHeaders: Readonly<Record<string, string>>;
  private readonly timeoutMs: number;
  private sessionId: string | null = null;
  private initialized = false;
  private nextId = 1;

  constructor(options: McpHttpClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.endpoint = options.endpoint;
    this.baseHeaders = options.headers ?? {};
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  private async rpc(method: string, params?: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const id = this.nextId++;
    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...this.baseHeaders,
      };
      if (this.sessionId) headers["mcp-session-id"] = this.sessionId;
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ jsonrpc: "2.0", id, method, ...(params === undefined ? {} : { params }) }),
        signal: controller.signal,
      });
      const envelope = await parseResponse(response);
      const returnedSession = response.headers.get("mcp-session-id");
      if (returnedSession) this.sessionId = returnedSession;
      if (envelope.error) {
        throw new Error(`MCP upstream error ${envelope.error.code ?? "?"}: ${envelope.error.message ?? "unknown"}`);
      }
      return envelope.result;
    } finally {
      clearTimeout(timer);
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "optihub-tool-fabric", version: "1.0.0" },
    });
    this.initialized = true;
  }

  async listTools(): Promise<readonly Record<string, unknown>[]> {
    await this.initialize();
    const result = (await this.rpc("tools/list")) as { tools?: readonly Record<string, unknown>[] };
    return Array.isArray(result?.tools) ? result.tools : [];
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    await this.initialize();
    return this.rpc("tools/call", { name, arguments: args });
  }
}

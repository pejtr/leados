import { ENV } from "./env";
import { getDb } from "../db/core";
import { and, gte, sum, eq } from "drizzle-orm";
import { llmUsage } from "../../drizzle/schema";
import { getUserTokenLimits } from "../db/users";
import { insertLlmUsage } from "../db/llm-usage";

// ─── Retry configuration ─────────────────────────────────────────────────────
const LLM_MAX_RETRIES = ENV.llmMaxRetries;
const LLM_RETRY_BASE_MS = ENV.llmRetryBaseMs;

/** HTTP status codes eligible for automatic retry. */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message;
    // Match "LLM invoke failed: <status>" pattern
    const statusMatch = msg.match(/LLM invoke failed: (\d{3})/);
    if (statusMatch) {
      return RETRYABLE_STATUSES.has(parseInt(statusMatch[1], 10));
    }
    // Network / fetch failures
    if (msg.includes("fetch failed") || msg.includes("ECONNRESET") || msg.includes("ETIMEDOUT")) {
      return true;
    }
  }
  return false;
}

export function parseRetryAfter(error: unknown): number | null {
  if (error instanceof Error) {
    const match = error.message.match(/retry[_-]after:\s*(\d+)/i);
    if (match) return parseInt(match[1], 10) * 1000;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= LLM_MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt >= LLM_MAX_RETRIES || !isRetryableError(err)) {
        throw err;
      }
      const retryAfterMs = parseRetryAfter(err);
      const delay = retryAfterMs ?? LLM_RETRY_BASE_MS * Math.pow(2, attempt);
      console.warn(
        `[LLM:${label}] Attempt ${attempt + 1}/${LLM_MAX_RETRIES} failed, retrying in ${delay}ms…`
      );
      await sleep(delay);
    }
  }
  throw lastError;
}

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  userId?: number;
  route?: string;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

/** Extract plain text from LLM response content (handles both string and content array forms). */
export function extractText(content: string | Array<TextContent | ImageContent | FileContent>): string {
  if (typeof content === "string") return content;
  return content
    .filter((c): c is TextContent => c.type === "text")
    .map((c) => c.text)
    .join("");
}

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

const assertApiKey = () => {
  if (!ENV.anthropicApiKey && !ENV.deepseekApiKey && !ENV.forgeApiKey) {
    throw new Error(
      "No LLM provider configured (set ANTHROPIC_API_KEY, DEEPSEEK_API_KEY, or BUILT_IN_FORGE_API_KEY)"
    );
  }
};

// ─── Anthropic direct path (Manus-independent) ─────────────────────────────
// Maps the OpenAI-style contract used across the codebase onto the Anthropic
// Messages API and back, preserving the InvokeResult shape for all callers.

const flattenToText = (content: Message["content"]): string => {
  const parts = Array.isArray(content) ? content : [content];
  return parts
    .map(p => {
      if (typeof p === "string") return p;
      if (p.type === "text") return p.text;
      return JSON.stringify(p);
    })
    .join("\n");
};

async function invokeAnthropic(params: InvokeParams): Promise<InvokeResult> {
  const { messages, tools, toolChoice, tool_choice, maxTokens, max_tokens } = params;

  const systemText = messages
    .filter(m => m.role === "system")
    .map(m => flattenToText(m.content))
    .join("\n\n");

  const chatMessages = messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: flattenToText(m.content),
    }))
    // Anthropic requires the first message to be from the user
    .filter((m, i, arr) => !(i === 0 && m.role === "assistant") || arr.length === 1);

  const body: Record<string, unknown> = {
    model: ENV.anthropicModel,
    max_tokens: maxTokens ?? max_tokens ?? 8192,
    messages: chatMessages.length > 0 ? chatMessages : [{ role: "user", content: " " }],
  };
  if (systemText) body.system = systemText;

  // Structured output: emulate OpenAI response_format/json_schema via a forced tool.
  const normalizedResponseFormat = normalizeResponseFormat(params);
  let structuredToolName: string | null = null;
  const anthropicTools: Array<Record<string, unknown>> = [];

  if (normalizedResponseFormat?.type === "json_schema") {
    structuredToolName = normalizedResponseFormat.json_schema.name || "structured_output";
    anthropicTools.push({
      name: structuredToolName,
      description: "Return the structured result matching the required schema.",
      input_schema: normalizedResponseFormat.json_schema.schema,
    });
    body.tool_choice = { type: "tool", name: structuredToolName };
  } else if (tools && tools.length > 0) {
    for (const t of tools) {
      anthropicTools.push({
        name: t.function.name,
        description: t.function.description ?? "",
        input_schema: t.function.parameters ?? { type: "object", properties: {} },
      });
    }
    const choice = normalizeToolChoice(toolChoice || tool_choice, tools);
    if (choice === "none") {
      anthropicTools.length = 0;
    } else if (choice && choice !== "auto" && typeof choice === "object") {
      body.tool_choice = { type: "tool", name: choice.function.name };
    }
  }
  if (anthropicTools.length > 0) body.tools = anthropicTools;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const data: any = await response.json();
  const blocks: any[] = Array.isArray(data.content) ? data.content : [];
  const textOut = blocks.filter(b => b.type === "text").map(b => b.text).join("");
  const toolUses = blocks.filter(b => b.type === "tool_use");

  // Forced structured output: surface the tool input as JSON string content,
  // matching what json_schema callers expect to parse.
  const structuredUse = structuredToolName
    ? toolUses.find(b => b.name === structuredToolName)
    : undefined;

  const toolCalls: ToolCall[] | undefined =
    !structuredUse && toolUses.length > 0
      ? toolUses.map(b => ({
          id: b.id,
          type: "function" as const,
          function: { name: b.name, arguments: JSON.stringify(b.input ?? {}) },
        }))
      : undefined;

  const finishReason =
    data.stop_reason === "tool_use"
      ? structuredUse ? "stop" : "tool_calls"
      : data.stop_reason === "max_tokens"
        ? "length"
        : "stop";

  return {
    id: data.id ?? "anthropic",
    created: Math.floor(Date.now() / 1000),
    model: data.model ?? ENV.anthropicModel,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: structuredUse ? JSON.stringify(structuredUse.input ?? {}) : textOut,
          ...(toolCalls ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: finishReason,
      },
    ],
    usage: data.usage
      ? {
          prompt_tokens: data.usage.input_tokens ?? 0,
          completion_tokens: data.usage.output_tokens ?? 0,
          total_tokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
        }
      : undefined,
  };
}

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

const COST_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5": { input: 0.003, output: 0.015 },
  "claude-3-haiku-20240307": { input: 0.00025, output: 0.00125 },
  "claude-3-sonnet-20240229": { input: 0.003, output: 0.015 },
  "claude-3-opus-20240229": { input: 0.015, output: 0.075 },
  "deepseek-chat": { input: 0.00027, output: 0.0011 },
  "deepseek-reasoner": { input: 0.00055, output: 0.00219 },
  "gemini-2.5-flash": { input: 0.0001, output: 0.0004 },
  "gemini-2.0-flash": { input: 0.0001, output: 0.0004 },
  "gemini-1.5-pro": { input: 0.00125, output: 0.005 },
};

function estimateCost(model: string, provider: string, promptTokens: number, completionTokens: number): number {
  let pricing = COST_PER_1K_TOKENS[model];
  if (!pricing) {
    if (provider === "forge") pricing = { input: 0.0001, output: 0.0004 };
    else if (provider === "deepseek") pricing = { input: 0.00027, output: 0.0011 };
    else pricing = { input: 0.003, output: 0.015 };
  }
  return (promptTokens * pricing.input + completionTokens * pricing.output) / 1000;
}

// In-memory TTL cache for budget limits to avoid a DB read on every LLM call.
const budgetCache = new Map<number, { limits: { dailyTokenLimit: number | null; monthlyTokenLimit: number | null }; expires: number }>();
const BUDGET_CACHE_TTL_MS = 60_000;

async function getCachedBudgetLimits(userId: number): Promise<{ dailyTokenLimit: number | null; monthlyTokenLimit: number | null }> {
  const cached = budgetCache.get(userId);
  const now = Date.now();
  if (cached && cached.expires > now) return cached.limits;
  const limits = await getUserTokenLimits(userId);
  budgetCache.set(userId, { limits, expires: now + BUDGET_CACHE_TTL_MS });
  return limits;
}

async function checkLlmBudget(userId: number): Promise<void> {
  const limits = await getCachedBudgetLimits(userId);
  if (!limits.dailyTokenLimit && !limits.monthlyTokenLimit) return;

  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (limits.dailyTokenLimit) {
    const [result] = await db.select({ used: sum(llmUsage.totalTokens) })
      .from(llmUsage)
      .where(and(eq(llmUsage.userId, userId), gte(llmUsage.createdAt, startOfDay)));
    const used = Number(result?.used ?? 0);
    if (used >= limits.dailyTokenLimit) {
      throw new Error(`BUDGET_EXCEEDED: Daily token limit of ${limits.dailyTokenLimit} reached (used ${used})`);
    }
  }

  if (limits.monthlyTokenLimit) {
    const [result] = await db.select({ used: sum(llmUsage.totalTokens) })
      .from(llmUsage)
      .where(and(eq(llmUsage.userId, userId), gte(llmUsage.createdAt, startOfMonth)));
    const used = Number(result?.used ?? 0);
    if (used >= limits.monthlyTokenLimit) {
      throw new Error(`BUDGET_EXCEEDED: Monthly token limit of ${limits.monthlyTokenLimit} reached (used ${used})`);
    }
  }
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();
  const startTime = Date.now();
  const { userId, route, ...llmParams } = params;

  // Budget check: skip for admin users
  if (userId && ENV.llmBudgetEnforcementEnabled) {
    await checkLlmBudget(userId).catch((err) => {
      if (err.message?.includes("BUDGET_EXCEEDED")) throw err;
      console.error("[llm] Budget check failed:", err);
    });
  }

  // Prefer the direct Anthropic path (Manus-independent) whenever a key is set.
  if (ENV.anthropicApiKey) {
    const result = await retryWithBackoff(() => invokeAnthropic(llmParams), "anthropic");
    recordLlmUsage(userId, route, "anthropic", startTime, result, undefined).catch(() => {});
    return result;
  }

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = llmParams;

  // OpenAI-compatible path: DeepSeek direct (Manus-independent) when its key
  // is set, otherwise the legacy Manus Forge gateway.
  const useDeepseek = !!ENV.deepseekApiKey;
  const apiUrl = useDeepseek
    ? "https://api.deepseek.com/chat/completions"
    : resolveApiUrl();
  const apiKey = useDeepseek ? ENV.deepseekApiKey : ENV.forgeApiKey;

  const payload: Record<string, unknown> = {
    model: useDeepseek ? ENV.deepseekModel : "gemini-2.5-flash",
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  if (useDeepseek) {
    // deepseek-chat caps output at 8k and has no `thinking` field
    payload.max_tokens = 8192;
  } else {
    payload.max_tokens = 32768;
    payload.thinking = { budget_tokens: 128 };
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    if (useDeepseek && normalizedResponseFormat.type === "json_schema") {
      // DeepSeek supports json_object only — enforce the schema via instruction.
      payload.response_format = { type: "json_object" };
      (payload.messages as unknown[]).unshift({
        role: "system",
        content: `Return ONLY a valid JSON object matching this exact schema: ${JSON.stringify(
          normalizedResponseFormat.json_schema.schema
        )}`,
      });
    } else {
      payload.response_format = normalizedResponseFormat;
    }
  }

  const provider = useDeepseek ? "deepseek" : "forge";

  const result = await retryWithBackoff(async () => {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
      );
    }

    return (await response.json()) as InvokeResult;
  }, provider);

  if (ENV.llmCostTrackingEnabled) {
    recordLlmUsage(userId, route, provider, startTime, result, undefined).catch(() => {});
  }

  return result;
}

async function recordLlmUsage(
  userId: number | undefined,
  route: string | undefined,
  provider: string,
  startTime: number,
  result: InvokeResult,
  error: string | undefined,
): Promise<void> {
  if (!userId) return;
  const durationMs = Date.now() - startTime;
  const usage = result.usage;
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? 0;
  const cost = estimateCost(result.model, provider, promptTokens, completionTokens);

  try {
    await insertLlmUsage({
      userId,
      model: result.model,
      provider,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostCents: String(cost * 100),
      durationMs,
      route: route ?? null,
      success: error ? 0 : 1,
      errorMessage: error ?? null,
    });
  } catch (err) {
    console.error("[llm] Failed to record usage:", err);
  }
}

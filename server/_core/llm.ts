import { ENV } from "./env";

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
  if (!ENV.anthropicApiKey && !ENV.forgeApiKey) {
    throw new Error("No LLM provider configured (set ANTHROPIC_API_KEY, or BUILT_IN_FORGE_API_KEY)");
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

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  // Prefer the direct Anthropic path (Manus-independent) whenever a key is set.
  if (ENV.anthropicApiKey) {
    return invokeAnthropic(params);
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
  } = params;

  const payload: Record<string, unknown> = {
    model: "gemini-2.5-flash",
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

  payload.max_tokens = 32768
  payload.thinking = {
    "budget_tokens": 128
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
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
}

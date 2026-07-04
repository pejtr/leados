import { describe, it, expect, vi } from "vitest";
import { createCml, formatStats, type CmlDeps } from "./cml";
import type { TgUpdate } from "./telegramApi";

function makeUpdate(chatId: number, text: string): TgUpdate {
  return {
    update_id: 1,
    message: {
      message_id: 1,
      chat: { id: chatId, type: "private" },
      date: Math.floor(Date.now() / 1000),
      text,
    },
  };
}

function makeDeps(overrides: Partial<CmlDeps> = {}) {
  const deps: CmlDeps = {
    send: vi.fn(async () => true),
    ask: vi.fn(async () => "odpověď mozku"),
    getLeadStats: vi.fn(async () => ({ total: 5, byStatus: { new: 3, contacted: 2 } })),
    ownerChatId: () => "111",
    listProjects: vi.fn(async () => [
      { id: 1, name: "Katastr Online", apiKey: "lpos_abc123", url: "https://katastr-online.cz" },
    ]),
    createProject: vi.fn(async (name: string, url?: string) => ({
      id: 2, name, apiKey: "lpos_new456", url: url ?? null,
    })),
    hubBaseUrl: () => "https://crmleadsystem.com",
    ...overrides,
  };
  return deps;
}

describe("CML owner gate", () => {
  it("silently ignores messages from non-owner chats", async () => {
    const deps = makeDeps();
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(999, "ahoj"));
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.ask).not.toHaveBeenCalled();
  });

  it("bootstrap mode: replies to /start with the chat id when owner is not configured", async () => {
    const deps = makeDeps({ ownerChatId: () => undefined });
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(424242, "/start"));
    expect(deps.send).toHaveBeenCalledTimes(1);
    const [chatId, text] = (deps.send as any).mock.calls[0];
    expect(chatId).toBe(424242);
    expect(text).toContain("424242");
    expect(text).toContain("TELEGRAM_OWNER_CHAT_ID");
  });

  it("bootstrap mode: ignores non-/start messages", async () => {
    const deps = makeDeps({ ownerChatId: () => undefined });
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(424242, "udělej mi report"));
    expect(deps.send).not.toHaveBeenCalled();
  });
});

describe("CML commands", () => {
  it("/stats sends formatted lead stats", async () => {
    const deps = makeDeps();
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(111, "/stats"));
    expect(deps.getLeadStats).toHaveBeenCalled();
    const text = (deps.send as any).mock.calls[0][1];
    expect(text).toContain("Celkem: 5");
    expect(text).toContain("new: 3");
  });

  it("/ping answers online", async () => {
    const deps = makeDeps();
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(111, "/ping"));
    expect((deps.send as any).mock.calls[0][1]).toContain("online");
  });

  it("free text goes to the LLM brain and reply is sent back", async () => {
    const deps = makeDeps();
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(111, "naplánuj kampaň"));
    expect(deps.ask).toHaveBeenCalledTimes(1);
    expect((deps.send as any).mock.calls[0][1]).toBe("odpověď mozku");
  });

  it("LLM failure produces a graceful fallback message, not a crash", async () => {
    const deps = makeDeps({ ask: vi.fn(async () => { throw new Error("boom"); }) });
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(111, "něco"));
    expect((deps.send as any).mock.calls[0][1]).toContain("CML teď neodpovídá");
  });

  it("keeps per-chat history and passes it to the brain", async () => {
    const deps = makeDeps();
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(111, "první zpráva"));
    await cml.handleUpdate(makeUpdate(111, "druhá zpráva"));
    const secondCallHistory = (deps.ask as any).mock.calls[1][0];
    expect(secondCallHistory.length).toBe(3); // user, assistant, user
    expect(secondCallHistory[0].content).toBe("první zpráva");
  });
});

describe("CML hub commands", () => {
  it("/projects lists connected projects with keys", async () => {
    const deps = makeDeps();
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(111, "/projects"));
    const text = (deps.send as any).mock.calls[0][1];
    expect(text).toContain("Katastr Online");
    expect(text).toContain("lpos_abc123");
  });

  it("/newproject creates a project and returns key + hub handoff", async () => {
    const deps = makeDeps();
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(111, "/newproject Enchanté One | https://enchante.one"));
    expect(deps.createProject).toHaveBeenCalledWith("Enchanté One", "https://enchante.one");
    const text = (deps.send as any).mock.calls[0][1];
    expect(text).toContain("lpos_new456");
    expect(text).toContain("HUB_BASE_URL=https://crmleadsystem.com");
    expect(text).toContain("/api/hub/manifest");
  });

  it("/newproject without args shows usage", async () => {
    const deps = makeDeps();
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(111, "/newproject"));
    expect(deps.createProject).not.toHaveBeenCalled();
    expect((deps.send as any).mock.calls[0][1]).toContain("Použití");
  });
});

describe("CML persistent memory", () => {
  it("hydrates history from persistent storage once and passes it to the brain", async () => {
    const stored = [
      { role: "user" as const, content: "co je Optimateo?" },
      { role: "assistant" as const, content: "Tvoje agentura." },
    ];
    const loadHistory = vi.fn(async () => stored);
    const saveTurn = vi.fn(async () => {});
    const deps = makeDeps({ loadHistory, saveTurn });
    const cml = createCml(deps);

    await cml.handleUpdate(makeUpdate(111, "a co ONYX OS?"));
    expect(loadHistory).toHaveBeenCalledTimes(1);
    const passedHistory = (deps.ask as any).mock.calls[0][0];
    expect(passedHistory.length).toBe(3); // 2 stored + new user turn
    expect(passedHistory[0].content).toBe("co je Optimateo?");

    await cml.handleUpdate(makeUpdate(111, "dík"));
    expect(loadHistory).toHaveBeenCalledTimes(1); // hydrated only once
  });

  it("persists both user and assistant turns via saveTurn", async () => {
    const saveTurn = vi.fn(async () => {});
    const deps = makeDeps({ loadHistory: vi.fn(async () => null), saveTurn });
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(111, "ahoj"));
    const roles = saveTurn.mock.calls.map((c: any[]) => c[1].role);
    expect(roles).toEqual(["user", "assistant"]);
  });

  it("works without persistence deps (in-memory fallback)", async () => {
    const deps = makeDeps();
    const cml = createCml(deps);
    await cml.handleUpdate(makeUpdate(111, "test"));
    expect((deps.send as any).mock.calls[0][1]).toBe("odpověď mozku");
  });
});

describe("formatStats", () => {
  it("handles unavailable DB", () => {
    expect(formatStats(null)).toContain("není dostupná");
  });
});

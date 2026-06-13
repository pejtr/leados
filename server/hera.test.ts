/**
 * HERA — Marketing AI Orchestrator tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";
import {
  classifyMarketingIntent,
  heraChat,
  generateHeraDailyBrief,
  HERA_COACHES,
  HERA_COACH_IDS,
  getHeraCoaches,
  HERA_MISSION_TEMPLATES,
  executeHeraMission,
  heraPanel,
} from "./heraAgent";
import { AI_PERSONAS, getPersonaById } from "./aiPersonas";

const mockLLM = vi.mocked(invokeLLM);

function llmResponse(content: string) {
  return {
    id: "test",
    created: 0,
    model: "test",
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
  } as any;
}

beforeEach(() => {
  mockLLM.mockReset();
});

describe("HERA coach registry", () => {
  it("every routed coach id exists in AI_PERSONAS", () => {
    for (const [intent, coachId] of Object.entries(HERA_COACHES)) {
      const persona = getPersonaById(coachId);
      expect(persona, `intent "${intent}" routes to missing persona "${coachId}"`).toBeDefined();
    }
  });

  it("contains the four new B2B coaches", () => {
    for (const id of ["neil_rackham", "jeb_blount", "aaron_ross", "robert_cialdini"]) {
      const p = getPersonaById(id);
      expect(p, `persona ${id} missing`).toBeDefined();
      expect(p!.category).toBe("Sales & Business");
      expect(p!.systemPrompt("CTX")).toContain("CTX");
    }
  });

  it("new coaches have valid tiers", () => {
    const valid = ["free", "gold", "diamond", undefined];
    for (const p of AI_PERSONAS) {
      expect(valid, `persona ${p.id} has invalid tier ${p.tier}`).toContain(p.tier);
    }
  });

  it("getHeraCoaches returns unique personas for all routed ids", () => {
    const coaches = getHeraCoaches();
    expect(coaches.length).toBe(HERA_COACH_IDS.length);
    const ids = coaches.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("classifyMarketingIntent", () => {
  it("parses a valid classification", async () => {
    mockLLM.mockResolvedValueOnce(
      llmResponse(JSON.stringify({ intent: "offers", confidence: 0.92, reasoning: "offer talk" }))
    );
    const result = await classifyMarketingIntent("Pomoz mi s nabídkou", []);
    expect(result.intent).toBe("offers");
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it("falls back to general_marketing on invalid JSON", async () => {
    mockLLM.mockResolvedValueOnce(llmResponse("not json at all"));
    const result = await classifyMarketingIntent("???", []);
    expect(result.intent).toBe("general_marketing");
  });

  it("falls back to general_marketing on unknown intent", async () => {
    mockLLM.mockResolvedValueOnce(
      llmResponse(JSON.stringify({ intent: "quantum_sales", confidence: 0.99, reasoning: "x" }))
    );
    const result = await classifyMarketingIntent("???", []);
    expect(result.intent).toBe("general_marketing");
  });

  it("falls back when LLM throws", async () => {
    mockLLM.mockRejectedValueOnce(new Error("LLM down"));
    const result = await classifyMarketingIntent("???", []);
    expect(result.intent).toBe("general_marketing");
    expect(result.confidence).toBe(0.5);
  });
});

describe("heraChat", () => {
  it("routes prospecting intent to Jeb Blount and returns coach metadata", async () => {
    mockLLM
      .mockResolvedValueOnce(
        llmResponse(JSON.stringify({ intent: "prospecting", confidence: 0.88, reasoning: "pipeline" }))
      )
      .mockResolvedValueOnce(llmResponse("Tady je tvůj denní prospecting plán."));

    const result = await heraChat({
      userMessage: "Jak naplnit pipeline?",
      conversationHistory: [],
      platformContext: "Celkem leadů: 42",
    });

    expect(result.coachId).toBe("jeb_blount");
    expect(result.intent).toBe("prospecting");
    expect(result.content).toContain("prospecting plán");
    expect(result.activeCoach?.name).toBe("Jeb Blount");
    expect(result.routingDecision).toContain("Jeb Blount");
  });

  it("injects platform context into the coach system prompt", async () => {
    mockLLM
      .mockResolvedValueOnce(
        llmResponse(JSON.stringify({ intent: "closing", confidence: 0.9, reasoning: "objections" }))
      )
      .mockResolvedValueOnce(llmResponse("Closing advice"));

    await heraChat({
      userMessage: "Klient říká že je to drahé",
      conversationHistory: [],
      platformContext: "UNIQUE_CTX_MARKER_123",
    });

    const chatCall = mockLLM.mock.calls[1][0];
    const systemMsg = chatCall.messages[0];
    expect(systemMsg.role).toBe("system");
    expect(String(systemMsg.content)).toContain("UNIQUE_CTX_MARKER_123");
    expect(String(systemMsg.content)).toContain("[HERA]");
  });

  it("returns fallback content when LLM returns empty", async () => {
    mockLLM
      .mockResolvedValueOnce(
        llmResponse(JSON.stringify({ intent: "offers", confidence: 0.9, reasoning: "x" }))
      )
      .mockResolvedValueOnce(llmResponse(""));

    const result = await heraChat({
      userMessage: "Nabídka",
      conversationHistory: [],
      platformContext: "",
    });
    expect(result.content).toContain("zkuste to prosím znovu");
  });
});

describe("HERA missions (parity with HERMES)", () => {
  it("every mission step coach exists in AI_PERSONAS and is HERA-routable", () => {
    for (const mission of HERA_MISSION_TEMPLATES) {
      expect(mission.type.startsWith("hera_"), `mission ${mission.type} must use hera_ prefix`).toBe(true);
      for (const step of mission.steps) {
        expect(getPersonaById(step.coach), `mission ${mission.type}: missing coach ${step.coach}`).toBeDefined();
        expect(HERA_COACH_IDS, `mission ${mission.type}: coach ${step.coach} not in HERA roster`).toContain(step.coach);
      }
    }
  });

  it("executes all steps sequentially and synthesizes", async () => {
    const template = HERA_MISSION_TEMPLATES.find((m) => m.type === "hera_pipeline_revival")!;
    // one LLM call per step + one synthesis call
    for (let i = 0; i < template.steps.length; i++) {
      mockLLM.mockResolvedValueOnce(llmResponse(`Výstup kroku ${i + 1}`));
    }
    mockLLM.mockResolvedValueOnce(
      llmResponse(
        JSON.stringify({
          synthesis: "Souhrn mise",
          keyInsights: ["insight 1"],
          nextActions: ["akce 1", "akce 2"],
        })
      )
    );

    const result = await executeHeraMission({
      missionType: "hera_pipeline_revival",
      platformContext: "Leady: 5",
    });

    expect(result.stepResults).toHaveLength(template.steps.length);
    expect(result.stepResults[0].output).toBe("Výstup kroku 1");
    expect(result.synthesis).toBe("Souhrn mise");
    expect(result.nextActions).toHaveLength(2);
    expect(mockLLM).toHaveBeenCalledTimes(template.steps.length + 1);
  });

  it("later steps receive earlier step outputs in the prompt", async () => {
    const template = HERA_MISSION_TEMPLATES.find((m) => m.type === "hera_pipeline_revival")!;
    for (let i = 0; i < template.steps.length; i++) {
      mockLLM.mockResolvedValueOnce(llmResponse(`KROK_${i + 1}_VYSTUP`));
    }
    mockLLM.mockResolvedValueOnce(llmResponse(JSON.stringify({ synthesis: "s", keyInsights: [], nextActions: [] })));

    await executeHeraMission({ missionType: "hera_pipeline_revival", platformContext: "" });

    const secondStepCall = mockLLM.mock.calls[1][0];
    const userMsg = String(secondStepCall.messages[1].content);
    expect(userMsg).toContain("KROK_1_VYSTUP");
  });

  it("throws on unknown mission type", async () => {
    await expect(
      executeHeraMission({ missionType: "hera_nonexistent", platformContext: "" })
    ).rejects.toThrow("Unknown HERA mission type");
  });

  it("survives broken synthesis JSON with a fallback", async () => {
    const template = HERA_MISSION_TEMPLATES.find((m) => m.type === "hera_content_week")!;
    for (let i = 0; i < template.steps.length; i++) {
      mockLLM.mockResolvedValueOnce(llmResponse("ok"));
    }
    mockLLM.mockResolvedValueOnce(llmResponse("NOT JSON"));

    const result = await executeHeraMission({ missionType: "hera_content_week", platformContext: "" });
    expect(result.synthesis).toContain("Mise dokončena");
  });
});

describe("heraPanel (mastermind parity)", () => {
  it("collects responses from all coaches and synthesizes", async () => {
    mockLLM
      .mockResolvedValueOnce(llmResponse("Hormozi take"))
      .mockResolvedValueOnce(llmResponse("Blount take"))
      .mockResolvedValueOnce(llmResponse("Panel syntéza"));

    const result = await heraPanel({
      message: "Jak zvednout konverze?",
      coachIds: ["alex_hormozi", "jeb_blount"],
      platformContext: "Leady: 10",
    });

    expect(result.responses).toHaveLength(2);
    expect(result.responses.map((r) => r.coachId)).toEqual(["alex_hormozi", "jeb_blount"]);
    expect(result.synthesis).toBe("Panel syntéza");
  });

  it("throws when no valid coaches are selected", async () => {
    await expect(
      heraPanel({ message: "x", coachIds: ["nonexistent_coach"], platformContext: "" })
    ).rejects.toThrow("No valid coaches");
  });

  it("a failing coach does not break the panel", async () => {
    mockLLM
      .mockRejectedValueOnce(new Error("coach down"))
      .mockResolvedValueOnce(llmResponse("Blount take"))
      .mockResolvedValueOnce(llmResponse("syntéza"));

    const result = await heraPanel({
      message: "x",
      coachIds: ["alex_hormozi", "jeb_blount"],
      platformContext: "",
    });
    expect(result.responses).toHaveLength(2);
    expect(result.responses[0].content).toContain("není dostupný");
  });
});

describe("generateHeraDailyBrief", () => {
  it("returns the LLM brief", async () => {
    mockLLM.mockResolvedValueOnce(llmResponse("## 🎯 HERA — dnešní marketingové akce\n1. Akce"));
    const brief = await generateHeraDailyBrief("Leady: 10");
    expect(brief).toContain("HERA");
  });

  it("returns fallback on empty LLM output", async () => {
    mockLLM.mockResolvedValueOnce(llmResponse(""));
    const brief = await generateHeraDailyBrief("Leady: 10");
    expect(brief).toContain("HERA");
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateMockLeads, validateIndustry, SUPPORTED_INDUSTRIES } from "./leadPipeline";

// ─── Mock invokeLLM ───────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({ industry: "Technology", confidence: 0.95, isValid: true }),
        },
      },
    ],
  }),
}));

// ─── generateMockLeads ───────────────────────────────────────────

describe("generateMockLeads", () => {
  it("returns the requested number of leads", () => {
    const leads = generateMockLeads("Technology", "United States", 5, "Manager");
    expect(leads).toHaveLength(5);
  });

  it("sets industry and location correctly", () => {
    const leads = generateMockLeads("Finance", "Germany", 3, "Director");
    leads.forEach((l) => {
      expect(l.industry).toBe("Finance");
      expect(l.location).toBe("Germany");
      expect(l.seniorityLevel).toBe("Director");
    });
  });

  it("generates leads with required fields", () => {
    const leads = generateMockLeads("SaaS", "United Kingdom", 2, "VP");
    leads.forEach((l) => {
      expect(l.companyName).toBeTruthy();
      expect(l.email).toMatch(/@/);
      expect(l.website).toMatch(/^https?:\/\//);
      expect(l.linkedinUrl).toMatch(/linkedin\.com/);
    });
  });

  it("handles count larger than template list", () => {
    const leads = generateMockLeads("Technology", "US", 15, "C-Level");
    expect(leads).toHaveLength(15);
    // All should have unique-ish names
    const names = leads.map((l) => l.companyName);
    expect(new Set(names).size).toBeGreaterThan(1);
  });

  it("works for unknown industry", () => {
    const leads = generateMockLeads("Quantum Computing", "Mars", 3, "Manager");
    expect(leads).toHaveLength(3);
    leads.forEach((l) => expect(l.industry).toBe("Quantum Computing"));
  });
});

// ─── validateIndustry ────────────────────────────────────────────

describe("validateIndustry", () => {
  it("returns a valid industry object from LLM", async () => {
    const result = await validateIndustry("Technology");
    expect(result).toMatchObject({
      industry: "Technology",
      confidence: expect.any(Number),
      isValid: expect.any(Boolean),
    });
  });

  it("falls back gracefully when LLM fails", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockRejectedValueOnce(new Error("LLM unavailable"));
    const result = await validateIndustry("Finance");
    expect(result.industry).toBeTruthy();
    expect(typeof result.isValid).toBe("boolean");
  });
});

// ─── SUPPORTED_INDUSTRIES ────────────────────────────────────────

describe("SUPPORTED_INDUSTRIES", () => {
  it("contains at least 10 industries", () => {
    expect(SUPPORTED_INDUSTRIES.length).toBeGreaterThanOrEqual(10);
  });

  it("contains Technology and Finance", () => {
    expect(SUPPORTED_INDUSTRIES).toContain("Technology");
    expect(SUPPORTED_INDUSTRIES).toContain("Finance");
  });
});

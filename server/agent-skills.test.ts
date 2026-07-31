import { describe, expect, it } from "vitest";
import type { BrandMemory } from "../drizzle/schema";
import {
  PUBLIC_SKILLS,
  SKILLS,
  buildSystemPrompt,
  getRoutedSkill,
  getSkill,
} from "./agent-skills";

const importedSkillIds = [
  "chief-content-officer",
  "research-analyst",
  "landing-page-cro",
  "saas-validator",
  "workflow-architect",
  "ux-product-auditor",
  "newsletter-writer",
  "youtube-producer",
  "campaign-planner",
  "growth-consultant",
  "ceo-advisor",
  "prompt-optimizer",
] as const;

describe("specialist skill catalog", () => {
  it("loads all twelve imported specialist packs with production prompts", () => {
    for (const id of importedSkillIds) {
      const skill = getSkill(id);

      expect(skill, id).toBeDefined();
      expect(skill?.source, id).toBe("specialist-pack");
      expect(skill?.systemPrompt.length, id).toBeGreaterThan(5_000);
      expect(skill?.suggestedPrompts.length, id).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps the public catalog curated while retaining latent specialists", () => {
    const publicIds = new Set(PUBLIC_SKILLS.map(skill => skill.id));

    expect(PUBLIC_SKILLS).toHaveLength(12);
    expect(publicIds.has("landing-page-cro")).toBe(true);
    expect(publicIds.has("workflow-architect")).toBe(true);
    expect(publicIds.has("growth-consultant")).toBe(true);
    expect(publicIds.has("chief-content-officer")).toBe(false);
    expect(publicIds.has("research-analyst")).toBe(false);
    expect(publicIds.has("prompt-optimizer")).toBe(false);
    expect(SKILLS.length).toBeGreaterThan(PUBLIC_SKILLS.length);
  });

  it("routes orchestrated requests to public and latent specialists", () => {
    expect(
      getRoutedSkill("Potřebuji provést UX audit našeho onboardingu")?.id
    ).toBe("ux-product-auditor");
    expect(
      getRoutedSkill("Mám nový SaaS nápad a potřebuji validaci MVP")?.id
    ).toBe("saas-validator");
    expect(
      getRoutedSkill("Napiš plán pro náš YouTube kanál a thumbnail")?.id
    ).toBe("youtube-producer");
    expect(getRoutedSkill("Jaké bude zítra počasí?")).toBeUndefined();
  });

  it("combines delivery rules, delegated expertise and brand memory", () => {
    const cmo = getSkill("cmo");
    const specialist = getSkill("campaign-planner");
    const brandMemory = {
      companyName: "Testovací firma",
      industry: "Gastronomie",
      products: JSON.stringify(["Rozvoz obědů"]),
    } as BrandMemory;

    expect(cmo).toBeDefined();
    expect(specialist).toBeDefined();

    const prompt = buildSystemPrompt(cmo!, brandMemory, specialist);

    expect(prompt).toContain("Pravidla doručení pro OPTIMATEO");
    expect(prompt).toContain("Interní specializace pro tento požadavek");
    expect(prompt).toContain("Plánovač kampaní");
    expect(prompt).toContain("<brand_memory>");
    expect(prompt).toContain("Testovací firma");
    expect(prompt).toContain("Rozvoz obědů");
  });
});

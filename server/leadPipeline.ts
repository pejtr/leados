/**
 * Lead Generation Pipeline
 * Validates industry → scrapes leads → enriches with website content → generates AI icebreakers
 */
import { invokeLLM } from "./_core/llm";

export const SUPPORTED_INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Real Estate", "Marketing", "Legal", "Consulting",
  "E-commerce", "SaaS", "Fintech", "Biotech", "Logistics",
  "Media", "Hospitality", "Energy", "Automotive", "Telecommunications",
];

// ─── Types ───────────────────────────────────────────────────────

export interface RawLead {
  companyName: string;
  email: string;
  website: string;
  industry: string;
  location: string;
  companySize: string;
  seniorityLevel: string;
  contactName: string;
  linkedinUrl: string;
  companyDescription: string;
  icebreaker: string;
  isEnriched: boolean;
}

// ─── 1. Industry Validation ──────────────────────────────────────

export async function validateIndustry(input: string): Promise<{ industry: string; confidence: number; isValid: boolean }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an industry classifier. Given user input, match it to one of these industries: ${SUPPORTED_INDUSTRIES.join(", ")}. Respond ONLY with valid JSON.`,
        },
        {
          role: "user",
          content: `Classify this industry input: "${input}". Return JSON: {"industry": "<matched>", "confidence": <0.0-1.0>, "isValid": <true/false>}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "industry_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              industry: { type: "string" },
              confidence: { type: "number" },
              isValid: { type: "boolean" },
            },
            required: ["industry", "confidence", "isValid"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0]?.message?.content;
    if (content && typeof content === 'string') return JSON.parse(content);
  } catch (e) {
    console.warn("[validateIndustry] LLM error, falling back:", e);
  }
  // Fallback: simple string match
  const matched = SUPPORTED_INDUSTRIES.find((i) => i.toLowerCase().includes(input.toLowerCase()) || input.toLowerCase().includes(i.toLowerCase()));
  return matched
    ? { industry: matched, confidence: 0.85, isValid: true }
    : { industry: input, confidence: 0.4, isValid: true };
}

// ─── 2. Mock Lead Scraper ────────────────────────────────────────

const COMPANY_TEMPLATES: Record<string, string[]> = {
  Technology: ["TechCorp Solutions", "DataStream Inc", "CloudNova", "ByteForge", "NexGen Systems", "Quantum Dynamics", "InnovateTech", "CyberPulse", "DevMatrix", "AlgoWave"],
  Finance: ["CapitalEdge Partners", "WealthStream", "FinVault", "TrustBridge Capital", "NovaBanking", "PrimeAssets", "ClearFund", "Meridian Finance", "Apex Wealth", "BlueSky Investments"],
  Healthcare: ["MediCore Solutions", "HealthBridge", "BioNova Labs", "CareStream", "VitalPath", "MedTech Innovations", "HealthFirst", "CurePath", "BioSync", "PharmaCore"],
  Marketing: ["BrandPulse Agency", "GrowthLab", "PixelCraft", "MarketMind", "ViralEdge", "ContentForge", "LeadBoost", "DigitalNova", "ImpactMedia", "BrandStream"],
  SaaS: ["SaaSify", "CloudBase", "AppForge", "StreamSoft", "PlatformX", "SoftNova", "AppStream", "CloudEdge", "SaaSCore", "PlatformPulse"],
  Fintech: ["PayNova", "BlockLedger", "CryptoEdge", "FinStream", "LendForge", "WalletCore", "TradePulse", "MoneyMatrix", "CashFlow AI", "NeoBank Pro"],
  "E-commerce": ["ShopForge", "CartNova", "BuyStream", "MarketEdge", "StoreMatrix", "CommerceCore", "RetailPulse", "ShopMatrix", "BuyNova", "CartEdge"],
  Consulting: ["StratEdge Consulting", "MindForge", "PeakAdvisors", "CoreStrategy", "NovaPeak", "InsightMatrix", "VisionEdge", "PrimeConsult", "ApexAdvisors", "ClearPath"],
  Logistics: ["ShipNova", "CargoEdge", "FreightMatrix", "LogiStream", "DeliverCore", "RouteForge", "FleetPulse", "SupplyNova", "TrackEdge", "MovePro"],
  Education: ["LearnForge", "EduNova", "SkillMatrix", "CourseEdge", "TeachStream", "KnowledgeCore", "AcademyPulse", "StudyNova", "EduMatrix", "LearnEdge"],
};

const DOMAIN_EXTS: Record<string, string> = {
  Technology: ".io", Finance: ".com", Healthcare: ".com", Marketing: ".agency",
  SaaS: ".io", Fintech: ".io", "E-commerce": ".com", Consulting: ".com",
  Logistics: ".com", Education: ".com",
};

const SIZES = ["1-10", "11-50", "51-200", "201-1000", "1001-5000"];
const FIRST_NAMES = ["James", "Sarah", "Michael", "Emma", "David", "Laura", "Robert", "Anna", "John", "Maria", "Chris", "Jessica", "Daniel", "Sophie", "Mark"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White"];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }

export function generateMockLeads(industry: string, location: string, count: number, seniorityLevel: string): RawLead[] {
  const templates = COMPANY_TEMPLATES[industry] ?? Array.from({ length: 10 }, (_, i) => `${industry} Co ${i + 1}`);
  const ext = DOMAIN_EXTS[industry] ?? ".com";
  const leads: RawLead[] = [];

  for (let i = 0; i < count; i++) {
    const company = i < templates.length ? templates[i]! : `${industry} Ventures ${i + 1}`;
    const slug = company.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fname = rand(FIRST_NAMES);
    const lname = rand(LAST_NAMES);
    leads.push({
      companyName: company,
      email: `contact@${slug}${ext}`,
      website: `https://www.${slug}${ext}`,
      industry,
      location,
      companySize: rand(SIZES),
      seniorityLevel,
      contactName: `${fname} ${lname}`,
      linkedinUrl: `https://linkedin.com/company/${slug}`,
      companyDescription: `${company} is a leading ${industry.toLowerCase()} company based in ${location}, delivering innovative solutions to modern businesses.`,
      icebreaker: "",
      isEnriched: false,
    });
  }
  return leads;
}

// ─── 3. Apify Scraper ────────────────────────────────────────────

export async function scrapeLeadsApify(
  industry: string,
  location: string,
  count: number,
  seniorityLevel: string,
  apifyToken: string
): Promise<RawLead[]> {
  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/curious_coder~linkedin-company-search/run-sync-get-dataset-items?token=${apifyToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchQuery: `${industry} companies in ${location}`, maxResults: count }),
        signal: AbortSignal.timeout(120_000),
      }
    );
    if (!response.ok) throw new Error(`Apify HTTP ${response.status}`);
    const data = await response.json() as any[];
    return data.map((item) => ({
      companyName: item.name ?? "Unknown",
      email: item.email ?? "",
      website: item.website ?? "",
      industry,
      location,
      companySize: String(item.staffCount ?? ""),
      seniorityLevel,
      contactName: "",
      linkedinUrl: item.linkedInUrl ?? "",
      companyDescription: item.description ?? "",
      icebreaker: "",
      isEnriched: false,
    }));
  } catch (e) {
    console.warn("[scrapeLeadsApify] Failed, using mock data:", e);
    return generateMockLeads(industry, location, count, seniorityLevel);
  }
}

// ─── 4. Website Scraper ──────────────────────────────────────────

export async function scrapeWebsite(url: string): Promise<string> {
  if (!url || !url.startsWith("http")) return "";
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadGenBot/1.0)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return "";
    const html = await response.text();
    // Simple HTML strip
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
    return text;
  } catch {
    return "";
  }
}

// ─── 5. Icebreaker Generator ─────────────────────────────────────

export async function generateIcebreaker(lead: RawLead, websiteContent: string): Promise<string> {
  const description = websiteContent || lead.companyDescription;
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a B2B sales expert. Write short, personalized icebreaker messages for cold outreach emails. Be specific, natural, and professional. Never mention AI or automation.",
        },
        {
          role: "user",
          content: `Write a 2-3 sentence icebreaker for this company:
Company: ${lead.companyName}
Industry: ${lead.industry}
Location: ${lead.location}
Size: ${lead.companySize}
Contact: ${lead.contactName} (${lead.seniorityLevel})
About: ${description.slice(0, 400)}

Return ONLY the icebreaker text, no quotes or extra formatting.`,
        },
      ],
    });
    const msg = response.choices[0]?.message?.content;
    return (typeof msg === 'string' ? msg.trim() : '') || '';
  } catch (e) {
    console.warn("[generateIcebreaker] LLM error:", e);
    return `I came across ${lead.companyName} and was impressed by your work in ${lead.industry}. I'd love to explore how we might collaborate.`;
  }
}

// ─── 6. Full Pipeline ────────────────────────────────────────────

export interface PipelineOptions {
  industry: string;
  location: string;
  count: number;
  seniorityLevel: string;
  apifyToken?: string;
  onProgress?: (step: string, current: number, total: number) => void;
}

export async function runLeadPipeline(opts: PipelineOptions): Promise<RawLead[]> {
  const { industry, location, count, seniorityLevel, apifyToken, onProgress } = opts;

  // Step 1: Validate industry
  onProgress?.("Validating industry...", 0, count);
  const validated = await validateIndustry(industry);
  const resolvedIndustry = validated.industry;

  // Step 2: Scrape leads
  onProgress?.("Scraping leads...", 0, count);
  const rawLeads = apifyToken
    ? await scrapeLeadsApify(resolvedIndustry, location, count, seniorityLevel, apifyToken)
    : generateMockLeads(resolvedIndustry, location, count, seniorityLevel);

  // Step 3: Enrich with icebreakers
  const enriched: RawLead[] = [];
  for (let i = 0; i < rawLeads.length; i++) {
    const lead = rawLeads[i]!;
    onProgress?.(`Generating icebreaker for ${lead.companyName}...`, i + 1, rawLeads.length);
    const websiteContent = await scrapeWebsite(lead.website);
    const icebreaker = await generateIcebreaker(lead, websiteContent);
    enriched.push({ ...lead, icebreaker, isEnriched: true });
  }

  return enriched;
}

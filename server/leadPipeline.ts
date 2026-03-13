/**
 * Lead Generation Pipeline
 * Validates industry → scrapes leads (LinkedIn via Apify OR mock) → enriches with AI icebreakers
 *
 * Apify actor used: harvestapi/linkedin-company-search
 * Docs: https://apify.com/harvestapi/linkedin-company-search
 */
import { invokeLLM } from "./_core/llm";

// ─── Segment Presets ────────────────────────────────────────────

export interface SegmentPreset {
  id: string;
  label: string;
  icon: string;
  industry: string;
  defaultLocation: string;
  defaultCount: number;
  defaultSeniority: string;
  icebreakerTone: string;
  description: string;
}

export const SEGMENT_PRESETS: SegmentPreset[] = [
  {
    id: "finance-insurance",
    label: "Insurance Leads",
    icon: "Shield",
    industry: "Finance",
    defaultLocation: "United States",
    defaultCount: 20,
    defaultSeniority: "Manager",
    icebreakerTone: "professional and trust-focused",
    description: "Target financial advisors, insurance brokers, and wealth managers.",
  },
  {
    id: "finance-mortgage",
    label: "Mortgage & Lending",
    icon: "Home",
    industry: "Finance",
    defaultLocation: "United States",
    defaultCount: 20,
    defaultSeniority: "Director",
    icebreakerTone: "consultative and ROI-focused",
    description: "Target mortgage brokers, lending officers, and real estate finance teams.",
  },
  {
    id: "finance-investment",
    label: "Investment & Wealth",
    icon: "TrendingUp",
    industry: "Finance",
    defaultLocation: "United States",
    defaultCount: 15,
    defaultSeniority: "C-Level",
    icebreakerTone: "sophisticated and value-driven",
    description: "Target investment managers, private equity, and wealth management firms.",
  },
  {
    id: "real-estate",
    label: "Real Estate",
    icon: "Building2",
    industry: "Real Estate",
    defaultLocation: "United States",
    defaultCount: 25,
    defaultSeniority: "Manager",
    icebreakerTone: "local market-focused and relationship-driven",
    description: "Target real estate agents, brokers, developers, and property managers.",
  },
  {
    id: "mlm-recruitment",
    label: "MLM & Recruitment",
    icon: "Users",
    industry: "Consulting",
    defaultLocation: "United States",
    defaultCount: 30,
    defaultSeniority: "Manager",
    icebreakerTone: "opportunity-focused and motivational",
    description: "Target team leaders, network marketers, and recruitment professionals.",
  },
  {
    id: "b2b-saas",
    label: "B2B SaaS",
    icon: "Zap",
    industry: "SaaS",
    defaultLocation: "United States",
    defaultCount: 20,
    defaultSeniority: "VP",
    icebreakerTone: "tech-savvy and efficiency-focused",
    description: "Target SaaS companies, software vendors, and technology decision-makers.",
  },
  {
    id: "b2b-general",
    label: "B2B General",
    icon: "Briefcase",
    industry: "Consulting",
    defaultLocation: "United States",
    defaultCount: 20,
    defaultSeniority: "Director",
    icebreakerTone: "professional and solution-oriented",
    description: "Target B2B companies across industries with custom products or services.",
  },
];

export const SUPPORTED_INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Real Estate", "Marketing", "Legal", "Consulting",
  "E-commerce", "SaaS", "Fintech", "Biotech", "Logistics",
  "Media", "Hospitality", "Energy", "Automotive", "Telecommunications",
];

// LinkedIn industry ID map (harvestapi uses numeric IDs)
// Full list: https://github.com/HarvestAPI/linkedin-industry-codes-v2
const LINKEDIN_INDUSTRY_IDS: Record<string, number[]> = {
  Technology: [96, 4, 6],           // IT Services, Software Development, Computer Hardware
  Finance: [43, 41, 1810],          // Financial Services, Banking, Investment Management
  Healthcare: [14, 139, 2266],      // Hospitals, Medical Practices, Biotechnology Research
  Education: [69, 68],              // E-Learning, Higher Education
  Retail: [27, 47],                 // Retail, Consumer Goods
  Manufacturing: [22, 30],          // Industrial Automation, Machinery Manufacturing
  "Real Estate": [44],              // Real Estate
  Marketing: [80, 1862],            // Advertising Services, Marketing Services
  Legal: [10],                      // Law Practice
  Consulting: [2, 1862],            // Business Consulting, Management Consulting
  "E-commerce": [27, 47],           // Retail, Consumer Goods
  SaaS: [4, 96],                    // Software Development, IT Services
  Fintech: [43, 4],                 // Financial Services, Software Development
  Biotech: [139, 2266],             // Biotechnology Research, Pharmaceutical Manufacturing
  Logistics: [16, 24],              // Freight and Package Transportation, Truck Transportation
  Media: [6, 35],                   // Broadcast Media Production, Entertainment Providers
  Hospitality: [31, 53],            // Hospitality, Restaurants
  Energy: [3, 138],                 // Oil and Gas, Utilities
  Automotive: [1, 23],              // Motor Vehicle Manufacturing, Automotive
  Telecommunications: [8],          // Telecommunications
};

// ─── Types ───────────────────────────────────────────────────────

export type DataSource = "mock" | "linkedin_apify";

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
  dataSource: DataSource;
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
    if (content && typeof content === "string") return JSON.parse(content);
  } catch (e) {
    console.warn("[validateIndustry] LLM error, falling back:", e);
  }
  const matched = SUPPORTED_INDUSTRIES.find(
    (i) => i.toLowerCase().includes(input.toLowerCase()) || input.toLowerCase().includes(i.toLowerCase())
  );
  return matched
    ? { industry: matched, confidence: 0.85, isValid: true }
    : { industry: input, confidence: 0.4, isValid: true };
}

// ─── 2. Apify LinkedIn Scraper ───────────────────────────────────

interface ApifyLinkedInCompany {
  id?: string | number;
  universalName?: string;
  name?: string;
  tagline?: string;
  website?: string;
  phone?: string | null;
  employeeCount?: number;
  employeeCountRange?: { start?: number; end?: number | null };
  description?: string;
  industries?: Array<{ id?: string; name?: string }>;
  locations?: Array<{
    city?: string;
    country?: string;
    headquarter?: boolean;
    parsed?: { text?: string; country?: string; city?: string };
  }>;
  specialities?: string[];
  linkedinUrl?: string;
  navigationUrl?: string;
  logo?: string;
  foundedOn?: { year?: number };
}

function mapEmployeeRange(count?: number, range?: { start?: number; end?: number | null }): string {
  if (range?.start) {
    return range.end ? `${range.start}-${range.end}` : `${range.start}+`;
  }
  if (count) {
    if (count <= 10) return "1-10";
    if (count <= 50) return "11-50";
    if (count <= 200) return "51-200";
    if (count <= 1000) return "201-1000";
    if (count <= 5000) return "1001-5000";
    return "5000+";
  }
  return "";
}

function extractHQ(locations?: ApifyLinkedInCompany["locations"]): string {
  if (!locations?.length) return "";
  const hq = locations.find((l) => l.headquarter) ?? locations[0];
  return hq?.parsed?.text ?? `${hq?.city ?? ""}, ${hq?.country ?? ""}`.replace(/^, |, $/, "");
}

function buildLinkedInUrl(item: ApifyLinkedInCompany): string {
  if (item.linkedinUrl) return item.linkedinUrl;
  if (item.navigationUrl) return item.navigationUrl;
  if (item.universalName) return `https://www.linkedin.com/company/${item.universalName}/`;
  return "";
}

/**
 * Run the harvestapi/linkedin-company-search Apify actor synchronously
 * and wait for results. Uses the run-sync endpoint with a 3-minute timeout.
 */
export async function scrapeLeadsApify(
  industry: string,
  location: string,
  count: number,
  seniorityLevel: string,
  apifyToken: string
): Promise<RawLead[]> {
  const industryIds = LINKEDIN_INDUSTRY_IDS[industry] ?? [];

  // Build actor input
  const actorInput: Record<string, unknown> = {
    scraperMode: "full",
    searchQuery: industry,
    maxItems: Math.min(count, 50),
  };

  // Add location filter if provided
  if (location && location.toLowerCase() !== "worldwide" && location.toLowerCase() !== "global") {
    actorInput.locations = [location];
  }

  // Add industry IDs filter if we have a mapping
  if (industryIds.length > 0) {
    actorInput.industryIds = industryIds;
  }

  console.log(`[Apify] Starting harvestapi/linkedin-company-search run for "${industry}" in "${location}", max ${count} items`);
  console.log(`[Apify] Input:`, JSON.stringify(actorInput));

  try {
    // Use run-sync-get-dataset-items to run and immediately get results
    const url = `https://api.apify.com/v2/acts/harvestapi~linkedin-company-search/run-sync-get-dataset-items?token=${apifyToken}&timeout=180&memory=256`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actorInput),
      signal: AbortSignal.timeout(200_000), // 200s client-side timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify HTTP ${response.status}: ${errorText.slice(0, 300)}`);
    }

    const data = (await response.json()) as ApifyLinkedInCompany[];
    console.log(`[Apify] Received ${data.length} companies from LinkedIn`);

    if (!Array.isArray(data) || data.length === 0) {
      console.warn("[Apify] Empty result set, falling back to mock data");
      return generateMockLeads(industry, location, count, seniorityLevel);
    }

    return data.slice(0, count).map((item): RawLead => {
      const hqLocation = extractHQ(item.locations) || location;
      const industryName = item.industries?.[0]?.name ?? industry;
      const companySize = mapEmployeeRange(item.employeeCount, item.employeeCountRange);
      const linkedinUrl = buildLinkedInUrl(item);
      const website = item.website ?? "";
      const slug = item.universalName ?? item.name?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

      return {
        companyName: item.name ?? "Unknown Company",
        email: website ? `contact@${new URL(website.startsWith("http") ? website : `https://${website}`).hostname}` : "",
        website,
        industry: industryName,
        location: hqLocation,
        companySize,
        seniorityLevel,
        contactName: "",
        linkedinUrl,
        companyDescription: item.description ?? item.tagline ?? "",
        icebreaker: "",
        isEnriched: false,
        dataSource: "linkedin_apify",
      };
    });
  } catch (e) {
    console.warn("[Apify] Scraping failed, falling back to mock data:", e);
    return generateMockLeads(industry, location, count, seniorityLevel);
  }
}

// ─── 3. Mock Lead Scraper ────────────────────────────────────────

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
      dataSource: "mock",
    });
  }
  return leads;
}

// ─── 4. Email Finder (Apify: caprolok/website-email-phone-finder) ──────────────

interface EmailFinderResult {
  domain: string;
  emails: string[];
  link?: string;
}

/**
 * Given a list of leads, batch-enrich their email fields using the
 * caprolok/website-email-phone-finder Apify actor.
 * Only enriches leads that have a website but no email yet.
 */
export async function enrichEmailsWithApify(
  leads: RawLead[],
  apifyToken: string
): Promise<RawLead[]> {
  // Only process leads that have a website but are missing an email
  const toEnrich = leads.filter((l) => l.website && !l.email);
  if (toEnrich.length === 0) return leads;

  // Extract clean domain names from website URLs
  const domainMap = new Map<string, number[]>(); // domain → indices in `leads`
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i]!;
    if (!lead.website || lead.email) continue;
    try {
      const url = lead.website.startsWith("http") ? lead.website : `https://${lead.website}`;
      const domain = new URL(url).hostname.replace(/^www\./, "");
      if (!domainMap.has(domain)) domainMap.set(domain, []);
      domainMap.get(domain)!.push(i);
    } catch {
      // skip malformed URLs
    }
  }

  const domains = Array.from(domainMap.keys());
  if (domains.length === 0) return leads;

  console.log(`[EmailFinder] Enriching ${domains.length} domains via Apify`);

  try {
    const url = `https://api.apify.com/v2/acts/caprolok~website-email-phone-finder/run-sync-get-dataset-items?token=${apifyToken}&timeout=120&memory=256`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domains }),
      signal: AbortSignal.timeout(150_000),
    });

    if (!response.ok) {
      console.warn(`[EmailFinder] Apify HTTP ${response.status}, skipping email enrichment`);
      return leads;
    }

    const results = (await response.json()) as EmailFinderResult[];
    console.log(`[EmailFinder] Got results for ${results.length} domains`);

    // Build domain → best email map
    const emailMap = new Map<string, string>();
    for (const result of results) {
      const domain = result.domain.replace(/^www\./, "");
      const emails = (result.emails ?? []).filter(
        (e) => e && !e.startsWith("noreply") && !e.startsWith("no-reply") && !e.includes("example.com")
      );
      if (emails.length > 0) {
        // Prefer contact/sales/info emails, otherwise take the first
        const preferred = emails.find((e) =>
          /^(contact|sales|info|hello|hi|team|support)@/.test(e)
        ) ?? emails[0]!;
        emailMap.set(domain, preferred);
      }
    }

    // Apply found emails back to leads
    return leads.map((lead, i) => {
      if (lead.email) return lead; // already has email
      try {
        const url = lead.website?.startsWith("http") ? lead.website : `https://${lead.website}`;
        const domain = new URL(url!).hostname.replace(/^www\./, "");
        const foundEmail = emailMap.get(domain);
        if (foundEmail) {
          console.log(`[EmailFinder] Found email for ${lead.companyName}: ${foundEmail}`);
          return { ...lead, email: foundEmail };
        }
      } catch {
        // skip
      }
      return lead;
    });
  } catch (e) {
    console.warn("[EmailFinder] Failed, skipping email enrichment:", e);
    return leads;
  }
}

// ─── 5. Website Scraper ──────────────────────────────────────────

export async function scrapeWebsite(url: string): Promise<string> {
  if (!url || !url.startsWith("http")) return "";
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadGenBot/1.0)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return "";
    const html = await response.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
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
Contact: ${lead.contactName || "the team"} (${lead.seniorityLevel})
About: ${description.slice(0, 400)}

Return ONLY the icebreaker text, no quotes or extra formatting.`,
        },
      ],
    });
    const msg = response.choices[0]?.message?.content;
    return (typeof msg === "string" ? msg.trim() : "") || "";
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
  useApify?: boolean;
  enrichEmails?: boolean;
  segment?: string;
  onProgress?: (step: string, current: number, total: number) => void;
}

export async function runLeadPipeline(opts: PipelineOptions): Promise<{ leads: RawLead[] }> {
  const { industry, location, count, seniorityLevel, apifyToken, useApify, onProgress } = opts;

  // Determine effective Apify token: prefer explicit param, fall back to env var
  const effectiveToken = apifyToken || process.env.APIFY_TOKEN;
  const shouldUseApify = (useApify !== false) && !!effectiveToken;

  // Step 1: Validate industry
  onProgress?.("Validating industry with AI...", 0, count);
  const validated = await validateIndustry(industry);
  const resolvedIndustry = validated.industry;

  // Step 2: Scrape leads
  let rawLeads: RawLead[];
  if (shouldUseApify && effectiveToken) {
    onProgress?.("Connecting to LinkedIn via Apify...", 0, count);
    rawLeads = await scrapeLeadsApify(resolvedIndustry, location, count, seniorityLevel, effectiveToken);
  } else {
    onProgress?.("Generating demo leads...", 0, count);
    rawLeads = generateMockLeads(resolvedIndustry, location, count, seniorityLevel);
  }

  // Step 2b: Email enrichment (optional)
  const shouldEnrichEmails = opts.enrichEmails !== false && shouldUseApify && effectiveToken;
  if (shouldEnrichEmails && effectiveToken) {
    onProgress?.("Finding contact emails via website scraping...", 0, rawLeads.length);
    rawLeads = await enrichEmailsWithApify(rawLeads, effectiveToken);
  }

  // Step 3: Enrich with icebreakers
  const enriched: RawLead[] = [];
  for (let i = 0; i < rawLeads.length; i++) {
    const lead = rawLeads[i]!;
    onProgress?.(`Generating icebreaker for ${lead.companyName}...`, i + 1, rawLeads.length);
    const websiteContent = await scrapeWebsite(lead.website);
    const icebreaker = await generateIcebreaker(lead, websiteContent);
    enriched.push({ ...lead, icebreaker, isEnriched: true });
  }

  return { leads: enriched };
}

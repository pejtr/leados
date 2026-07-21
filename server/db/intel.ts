import { eq } from "drizzle-orm";
import {
  marketIntelReports, MarketIntelReport,
  knowledgeArticles, KnowledgeArticle,
  competitiveMaps, CompetitiveMap,
} from "../../drizzle/schema";
import { getDb } from "./core";

// ─── Market Intelligence Reports ─────────────────────────────────
export async function getMarketIntelReports(userId: number): Promise<MarketIntelReport[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketIntelReports).where(eq(marketIntelReports.userId, userId));
}

export async function saveMarketIntelReport(userId: number, industry: string, reportData: string): Promise<MarketIntelReport> {
  const db = await getDb();
  const [row] = await db!.insert(marketIntelReports).values({ userId, industry, reportData });
  const [report] = await db!.select().from(marketIntelReports).where(eq(marketIntelReports.id, (row as any).insertId));
  return report;
}

// ─── Knowledge Articles ───────────────────────────────────────────
export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeArticles);
}

export async function seedKnowledgeArticles(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(knowledgeArticles);
  if (existing.length > 0) return;
  await db.insert(knowledgeArticles).values([
    { category: "Pipeline Development", title: "Building a 12-Month B2B Pipeline", content: "A strong pipeline requires identifying opportunities before your competitors. Start by mapping your ideal customer profile (ICP), then use multi-source prospecting: LinkedIn, industry databases, and intent data signals. Aim for 3x your revenue target in pipeline value at all times.", readTime: 5 },
    { category: "Pipeline Development", title: "Bid/No-Bid Decision Framework", content: "Before pursuing any opportunity, score it on: Strategic fit (0-10), Win probability (0-10), Revenue potential (0-10), Resource availability (0-10). Only pursue opportunities scoring 28+. This prevents wasted effort on low-probability deals.", readTime: 4 },
    { category: "Outreach & Capture", title: "Cold Email Best Practices for B2B", content: "Effective cold emails are short (under 100 words), hyper-personalized, and focused on the prospect's pain — not your product. Use a 3-step structure: 1) Personalized opener referencing their specific situation, 2) One-line value proposition, 3) Low-friction CTA (15-min call, not a demo).", readTime: 6 },
    { category: "Outreach & Capture", title: "Capture Management: From Opportunity to Win", content: "Capture management is the process of positioning yourself to win before an RFP drops. Key steps: 1) Identify the opportunity 6-12 months early, 2) Build relationships with decision-makers, 3) Shape requirements through whitepapers and thought leadership, 4) Assemble your team and identify gaps, 5) Develop win themes.", readTime: 7 },
    { category: "Market Intelligence", title: "Competitive Analysis Framework", content: "Map your competitors across 4 dimensions: 1) Strengths (what they do better than you), 2) Weaknesses (where they fall short), 3) Pricing (how they position on price), 4) Customer base (who they serve). Use this to identify positioning gaps and differentiation opportunities.", readTime: 5 },
    { category: "Market Intelligence", title: "Using Intent Data to Prioritize Leads", content: "Intent data reveals which companies are actively researching solutions like yours. Prioritize leads showing: website visits to competitor pages, job postings for roles your solution replaces, content downloads related to your category, and social media engagement with industry topics.", readTime: 4 },
    { category: "Closing & Negotiation", title: "Proposal Writing That Wins", content: "Winning proposals are customer-centric, not product-centric. Structure: 1) Executive Summary (restate their problem), 2) Understanding of Requirements, 3) Your Approach (methodology), 4) Team & Credentials, 5) Pricing, 6) Risk Mitigation. Always lead with their pain, not your features.", readTime: 8 },
    { category: "Closing & Negotiation", title: "Speed-to-Lead: Why Response Time Wins Deals", content: "Studies show that responding to a lead within 5 minutes increases conversion by 9x vs. responding after 30 minutes. Set up automated acknowledgment emails, use lead routing to the right rep, and track response time as a KPI. The first vendor to engage often wins.", readTime: 3 },
    { category: "Team & Process", title: "Building a High-Performance BD Team", content: "Structure your BD team with clear roles: 1) SDRs (prospecting and initial outreach), 2) AEs (discovery, demos, proposals), 3) Capture Managers (strategic opportunities), 4) Proposal Writers. Define clear handoff criteria between stages and track conversion rates at each stage.", readTime: 6 },
    { category: "Team & Process", title: "CRM Hygiene: Keeping Your Pipeline Clean", content: "A dirty CRM leads to bad forecasts and missed follow-ups. Establish rules: 1) Update lead status within 24h of contact, 2) Log every touchpoint, 3) Set next action date on every open opportunity, 4) Review and purge stale leads monthly. Pipeline reviews should happen weekly.", readTime: 4 },
  ]);
}

// ─── Competitive Maps ─────────────────────────────────────────────
export async function getCompetitiveMaps(userId: number): Promise<CompetitiveMap[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitiveMaps).where(eq(competitiveMaps.userId, userId));
}

export async function saveCompetitiveMap(userId: number, companyName: string, industry: string, mapData: string): Promise<CompetitiveMap> {
  const db = await getDb();
  const [row] = await db!.insert(competitiveMaps).values({ userId, companyName, industry, mapData });
  const [map] = await db!.select().from(competitiveMaps).where(eq(competitiveMaps.id, (row as any).insertId));
  return map;
}

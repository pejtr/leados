export type ProfitEngineId =
  | "audit-to-revenue"
  | "ai-reception"
  | "eshop-autopilot"
  | "reputation-monitor"
  | "content-revenue-loop"
  | "affiliate-content"
  | "digital-products";

export type ProfitEngineState = "guided" | "integration_required" | "planned";
export type ProfitAutomationMode = "automatic" | "approval" | "blocked";

export interface ProfitEngineStage {
  id: string;
  title: string;
  owner: string;
  mode: ProfitAutomationMode;
  route?: string;
  evidence: string;
}

export interface ProfitEngine {
  id: ProfitEngineId;
  templateId: string;
  priority: number;
  title: string;
  shortTitle: string;
  description: string;
  state: ProfitEngineState;
  targetAutomation: string;
  revenueType: string;
  pricing: {
    setup: string;
    recurring: string;
    usage?: string;
    performance?: string;
  };
  firstOffer: string;
  currentEvidence: string[];
  blockers: string[];
  risks: string[];
  stages: ProfitEngineStage[];
}

export const profitEngineStateLabels: Record<ProfitEngineState, string> = {
  guided: "Řízený provoz",
  integration_required: "Vyžaduje integrace",
  planned: "Připravený návrh",
};

export const profitEngines: ProfitEngine[] = [
  {
    id: "audit-to-revenue",
    templateId: "profit-audit-to-revenue",
    priority: 1,
    title: "ONYX Audit-to-Revenue Engine",
    shortTitle: "Audit-to-Revenue",
    description:
      "Z veřejného webu vytvoří doložený audit, obchodní příležitost, schválený outreach a měřitelný další krok.",
    state: "guided",
    targetAutomation: "70-85 %",
    revenueType: "Služba + MRR",
    pricing: {
      setup: "Plný audit 4 900-14 900 Kč",
      recurring: "Monitoring 2 900-9 900 Kč/měsíc",
      performance: "Implementace 25 000-90 000 Kč",
    },
    firstOffer: "20 ručně ověřených auditů pro jeden segment a jednu nabídku.",
    currentEvidence: [
      "Web Audit ukládá nálezy a skóre",
      "Audit lze převést do CRM s icebreakerem",
      "CRM podporuje scoring, follow-up a uzavřený obchod",
      "HERMES ukládá workflow nejprve ke schválení",
    ],
    blockers: [
      "Outreach nemá být odeslán bez lidského schválení",
      "Sale event zatím nemá pevnou vazbu na zdrojový audit a lead",
    ],
    risks: ["spam a reputace domény", "nedoložené závěry auditu", "slabá atribuce tržby"],
    stages: [
      {
        id: "audit",
        title: "Doložený audit",
        owner: "ONYX Audit",
        mode: "automatic",
        route: "/web-audit",
        evidence: "Uložený záznam web_audits",
      },
      {
        id: "crm",
        title: "CRM příležitost",
        owner: "LEADOS",
        mode: "automatic",
        route: "/history",
        evidence: "Lead se zdrojem web_audit",
      },
      {
        id: "score",
        title: "Lead score",
        owner: "LEADOS",
        mode: "automatic",
        route: "/history",
        evidence: "Predictive score navázaný na lead",
      },
      {
        id: "approval",
        title: "Schválení oslovení",
        owner: "KARR + člověk",
        mode: "approval",
        route: "/command-center?view=approvals",
        evidence: "Workflow awaiting_approval / approved",
      },
      {
        id: "follow-up",
        title: "Řízený follow-up",
        owner: "ONYX OS",
        mode: "approval",
        route: "/sequences",
        evidence: "Aktivní follow-up session",
      },
      {
        id: "revenue",
        title: "Ověřená tržba",
        owner: "Revenue ledger",
        mode: "blocked",
        route: "/sales-dashboard",
        evidence: "Sale event s atribucí na lead",
      },
    ],
  },
  {
    id: "ai-reception",
    templateId: "profit-ai-reception",
    priority: 2,
    title: "OPTIMATEO AI recepční a rezervace",
    shortTitle: "AI recepční",
    description:
      "Textový nebo hlasový vstup kvalifikuje požadavek, rezervuje termín, zapisuje CRM a řídí připomínky.",
    state: "integration_required",
    targetAutomation: "80-95 %",
    revenueType: "Setup + paušál + spotřeba",
    pricing: {
      setup: "25 000-75 000 Kč",
      recurring: "5 000-20 000 Kč/měsíc",
      usage: "Cena za minuty, hovory nebo konverzace",
      performance: "Volitelně za kvalifikovanou rezervaci",
    },
    firstOffer: "Nejdřív textový chat a callback pro jednu provozovnu; voice až po ověření scénářů.",
    currentEvidence: ["CRM leady", "follow-up sessions", "meeting links", "analýza nahraných hovorů"],
    blockers: ["Chybí produkční telephony provider", "Chybí oborový booking konektor a consent flow"],
    risks: ["chybná rezervace", "zpracování citlivých údajů", "nejasná eskalace na člověka"],
    stages: [
      { id: "intent", title: "Rozpoznání požadavku", owner: "HERA", mode: "automatic", evidence: "Klasifikovaný intent" },
      { id: "qualification", title: "Kvalifikace", owner: "HERMES", mode: "automatic", evidence: "Strukturovaný lead" },
      { id: "booking", title: "Rezervace", owner: "Booking provider", mode: "approval", evidence: "Potvrzený termín" },
      { id: "crm", title: "CRM + připomínky", owner: "ONYX OS", mode: "automatic", route: "/kanban", evidence: "Lead a follow-up session" },
    ],
  },
  {
    id: "eshop-autopilot",
    templateId: "profit-eshop-autopilot",
    priority: 3,
    title: "ONYX E-SHOP Autopilot",
    shortTitle: "E-SHOP Autopilot",
    description:
      "Standardizuje produktový feed, SEO obsah, překlady, vizuály, publikaci, podporu a měření marže.",
    state: "integration_required",
    targetAutomation: "80-90 %",
    revenueType: "Subscription + usage",
    pricing: {
      setup: "20 000-60 000 Kč",
      recurring: "3 000-12 000 Kč/měsíc",
      usage: "Za SKU, překlad, obrázek nebo kampaň",
    },
    firstOffer: "Pilot na 50 SKU s jedním cílovým jazykem a ručním quality gate.",
    currentEvidence: ["Produktové a obsahové AI workflow lze připravit přes HERMES/HERA", "Revenue eventy existují na úrovni projektů"],
    blockers: ["Chybí e-shopový feed konektor", "Chybí write-back publikace a produktová QA fronta"],
    risks: ["chybné produktové parametry", "licence obrázků", "publikace bez kontroly marže"],
    stages: [
      { id: "feed", title: "Import feedu", owner: "ONYX E-SHOP", mode: "blocked", evidence: "Validovaný feed" },
      { id: "enrichment", title: "Obsah a lokalizace", owner: "HERA", mode: "automatic", evidence: "Verzované návrhy" },
      { id: "qa", title: "Kontrola kvality", owner: "KARR + člověk", mode: "approval", evidence: "Schválená dávka" },
      { id: "publish", title: "Publikace a marže", owner: "E-shop + ledger", mode: "blocked", evidence: "SKU a sale event" },
    ],
  },
  {
    id: "reputation-monitor",
    templateId: "profit-reputation-monitor",
    priority: 4,
    title: "OPTIMATEO Review & Reputation Monitor",
    shortTitle: "Reputation Monitor",
    description:
      "Sjednotí recenze, sociální zmínky a feedback do alertů, návrhů odpovědí a provozních doporučení.",
    state: "integration_required",
    targetAutomation: "až 90 %",
    revenueType: "Měsíční předplatné",
    pricing: {
      setup: "Nastavení zdrojů a témat",
      recurring: "Paušál podle počtu provozoven a zdrojů",
    },
    firstOffer: "Google recenze pro jednu provozovnu, týdenní digest a schvalované odpovědi.",
    currentEvidence: ["Social listening UI", "sentiment u call recordings", "reporting a alerty"],
    blockers: ["Chybí Google Business Profile a social review konektory", "Automatické odpovědi musí zůstat za schválením"],
    risks: ["nevhodná veřejná odpověď", "záměna ironie a sentimentu", "chybějící kontext stížnosti"],
    stages: [
      { id: "collect", title: "Sběr zdrojů", owner: "OPTIMATEO", mode: "blocked", evidence: "Podepsaný provider event" },
      { id: "analyze", title: "Témata a sentiment", owner: "HERA", mode: "automatic", evidence: "Klasifikace s confidence" },
      { id: "respond", title: "Návrh odpovědi", owner: "KARR + člověk", mode: "approval", evidence: "Schválená odpověď" },
      { id: "report", title: "Trend a doporučení", owner: "ONYX OS", mode: "automatic", evidence: "Měsíční report" },
    ],
  },
  {
    id: "content-revenue-loop",
    templateId: "profit-content-revenue-loop",
    priority: 5,
    title: "OMNIVIDEO+ → FORGE Content Revenue Loop",
    shortTitle: "Content Revenue Loop",
    description:
      "Z jednoho tématu nebo zdrojového videa vyrábí lokalizované formáty; FORGE zajišťuje distribuci a monetizační měření.",
    state: "integration_required",
    targetAutomation: "75-90 %",
    revenueType: "Retainer + vlastní media assets",
    pricing: {
      setup: "Nastavení formátů, značky a kanálů",
      recurring: "Klientský retainer nebo membership",
      usage: "Rendering, dabing a překlady",
      performance: "Affiliate, sponzoring a leady",
    },
    firstOffer: "Jeden zdrojový formát, dva distribuční kanály a jeden měřitelný conversion event.",
    currentEvidence: ["OMNIVIDEO+ vlastní tvorbu a rendering", "ONYX umí připravit obsahové briefy a revenue eventy"],
    blockers: ["FORGE publishing/OAuth není součástí tohoto repa", "Chybí jednotný asset a attribution kontrakt"],
    risks: ["pokles kvality při repurposingu", "platformní pravidla", "slabá distribuce"],
    stages: [
      { id: "produce", title: "Výroba finálního videa", owner: "OMNIVIDEO+", mode: "automatic", evidence: "Final-ready asset" },
      { id: "approve", title: "Brand a claims QA", owner: "KARR + člověk", mode: "approval", evidence: "Schválená verze" },
      { id: "distribute", title: "Distribuce", owner: "FORGE", mode: "blocked", evidence: "Provider post ID" },
      { id: "optimize", title: "Revenue feedback", owner: "ONYX OS", mode: "automatic", evidence: "Attributed conversion" },
    ],
  },
  {
    id: "affiliate-content",
    templateId: "profit-affiliate-content",
    priority: 6,
    title: "Vertikální affiliate content engine",
    shortTitle: "Affiliate Content",
    description:
      "Řídí demand research, fact-checkovaný obsah, interní prolinkování, distribuci, click tracking a obnovu zastarávajících stránek.",
    state: "guided",
    targetAutomation: "85-95 %",
    revenueType: "Affiliate + reklama + premium",
    pricing: {
      setup: "Vertikální obsahový systém",
      recurring: "Správa a aktualizace portfolia",
      performance: "Provize a placené promo pozice",
    },
    firstOffer: "Jedno téma, deset komerčních dotazů a jeden transparentně označený affiliate partner.",
    currentEvidence: ["Affiliate dashboard", "SEO a content šablony", "project events a tracking"],
    blockers: ["Chybí jednotný affiliate click-to-sale kontrakt", "Publikace závisí na cílovém webu"],
    risks: ["SEO volatilita", "zastaralá fakta", "neoznačené affiliate vztahy"],
    stages: [
      { id: "demand", title: "Search demand", owner: "LEADOS", mode: "automatic", evidence: "Prioritizovaný brief" },
      { id: "content", title: "Obsah + fact check", owner: "HERA + KARR", mode: "approval", evidence: "Citace a schválení" },
      { id: "publish", title: "Publikace", owner: "Cílový web", mode: "blocked", evidence: "Canonical URL" },
      { id: "revenue", title: "Affiliate atribuce", owner: "ONYX OS", mode: "automatic", evidence: "Click a sale event" },
    ],
  },
  {
    id: "digital-products",
    templateId: "profit-digital-products",
    priority: 7,
    title: "Digitální produkty a šablony",
    shortTitle: "Digitální produkty",
    description:
      "Produktizuje ověřené klientské workflow do šablon, checklistů, mini kurzů a automatizovaného doručení.",
    state: "guided",
    targetAutomation: "90-98 %",
    revenueType: "Jednorázový prodej + membership",
    pricing: {
      setup: "Výroba a validace produktu",
      recurring: "Membership nebo aktualizace",
      performance: "Affiliate program a upsell",
    },
    firstOffer: "Jeden asset odvozený z workflow, které už prokazatelně fungovalo u klienta.",
    currentEvidence: ["Landing/funnel briefy", "Stripe základ", "e-mailové šablony", "workflow drafty"],
    blockers: ["Chybí jednotné digitální doručení a licence", "Bez distribuce není příjem pasivní"],
    risks: ["generický produkt bez poptávky", "licenční nejasnosti", "zastaralé šablony"],
    stages: [
      { id: "validate", title: "Důkaz poptávky", owner: "LEADOS", mode: "approval", evidence: "Objednávky nebo rozhovory" },
      { id: "package", title: "Produktizace", owner: "HERA + HERMES", mode: "automatic", evidence: "Verzovaný balíček" },
      { id: "sell", title: "Platba a doručení", owner: "ONYX OS", mode: "blocked", evidence: "Payment a delivery event" },
      { id: "improve", title: "Usage feedback", owner: "Optimizer", mode: "automatic", evidence: "Support a refund data" },
    ],
  },
];

export const profitVerticals = [
  { id: "clinics", title: "Kliniky", package: "Rezervace, FAQ, missed-call recovery a připomínky", engineIds: ["ai-reception", "reputation-monitor"] },
  { id: "restaurants", title: "Restaurace", package: "Web, menu, rezervace, recenze a Google Maps", engineIds: ["audit-to-revenue", "ai-reception", "reputation-monitor"] },
  { id: "hotels", title: "Hotely", package: "Vícejazyčný booking assistant, podpora a upsell", engineIds: ["ai-reception", "reputation-monitor", "content-revenue-loop"] },
  { id: "eshops", title: "E-shopy", package: "Katalog, lokalizace, vizuály, košík a podpora", engineIds: ["eshop-autopilot", "reputation-monitor"] },
  { id: "local-services", title: "Lokální služby", package: "Audit, lead capture, CRM a follow-up", engineIds: ["audit-to-revenue", "ai-reception"] },
  { id: "real-estate", title: "Reality", package: "Weby nabídek, video a kvalifikace leadů", engineIds: ["audit-to-revenue", "content-revenue-loop", "ai-reception"] },
] as const;

export const profitAutomationPolicy = {
  automatic: [
    "sběr veřejných dat a monitoring",
    "generování návrhů, scoring a reporty",
    "publikace již schváleného obsahu",
    "follow-up podle předem povolených pravidel",
    "fakturace a doručení digitálního produktu po ověřené platbě",
  ],
  approval: [
    "první outreach na nový segment",
    "změna cen nebo nabídky",
    "větší reklamní rozpočet a hromadná publikace",
    "právní, zdravotní nebo finanční tvrzení",
    "voice cloning, deploy a high-value nabídky",
  ],
  blocked: [
    "nedoložené výsledky a neověřené finanční údaje",
    "spam nebo chybějící souhlas se zpracováním dat",
    "porušení licencí nebo odeslání secrets",
    "automatický deploy bez testů",
  ],
} as const;

export const profitRoadmap = [
  {
    range: "0-30 dní",
    title: "Jedna peněžní smyčka",
    objective: "Web Audit → Lead Score → 20 ručně ověřených oslovení → CRM → nabídka → skutečná tržba.",
  },
  {
    range: "31-60 dní",
    title: "Produktizace a MRR",
    objective: "Vertikální balíčky, onboarding, fakturace, monitoring, reporting a review management.",
  },
  {
    range: "61-90 dní",
    title: "Druhý motor",
    objective: "AI recepční nebo E-SHOP Autopilot; současně vlastní OMNIVIDEO+ → FORGE obsahový loop.",
  },
] as const;

export function getProfitEngine(engineId: string): ProfitEngine | undefined {
  return profitEngines.find(engine => engine.id === engineId);
}

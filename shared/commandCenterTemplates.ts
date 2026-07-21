import {
  profitEngines,
  type ProfitEngine,
  type ProfitEngineId,
} from "./profitAutopilot";

export type CommandCenterTemplateCategory =
  | "acquisition"
  | "sales"
  | "content"
  | "operations"
  | "profit";

export type CommandCenterTemplateStatus = "live" | "guided" | "roadmap";

export type CommandCenterTemplateIcon =
  | "affiliate"
  | "building"
  | "calendar"
  | "funnel"
  | "globe"
  | "mail"
  | "megaphone"
  | "package"
  | "phone"
  | "search"
  | "telegram"
  | "video"
  | "wand";

export interface CommandCenterTemplateField {
  key: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  required?: boolean;
  multiline?: boolean;
  options?: CommandCenterTemplateFieldOption[];
  allowCustom?: boolean;
}

export interface CommandCenterTemplateFieldOption {
  value: string;
  label: string;
}
export interface CommandCenterTemplateGovernance {
  approvalRequired: boolean;
  executionMode: "draft_only" | "approved_actions";
  evidenceRequired: string[];
  hardBlocks: string[];
}

export interface CommandCenterTemplateModule {
  route: string;
  label: string;
  description: string;
}

export interface CommandCenterTemplate {
  id: string;
  profitEngineId?: ProfitEngineId;
  title: string;
  description: string;
  category: CommandCenterTemplateCategory;
  status: CommandCenterTemplateStatus;
  icon: CommandCenterTemplateIcon;
  agentIds: string[];
  fields: CommandCenterTemplateField[];
  outputs: string[];
  steps: string[];
  prompt: string;
  governance?: CommandCenterTemplateGovernance;
  module?: CommandCenterTemplateModule;
}

export const commandCenterCategoryLabels: Record<
  CommandCenterTemplateCategory,
  string
> = {
  acquisition: "Akvizice",
  sales: "Prodej",
  content: "Obsah",
  operations: "Provoz",
  profit: "Profit",
};

export const commandCenterStatusLabels: Record<
  CommandCenterTemplateStatus,
  string
> = {
  live: "Funkce dostupné",
  guided: "AI návrh",
  roadmap: "Vyžaduje integraci",
};

export const localAcquisitionIndustryOptions = [
  { value: "autoservisy", label: "Autoservisy a pneuservisy" },
  { value: "elektrikáři", label: "Elektrikáři a elektroinstalace" },
  {
    value: "hodinový manžel",
    label: "Hodinový manžel a domácí údržba",
  },
  {
    value: "realitní makléři",
    label: "Realitní makléři a realitní kanceláře",
  },
  { value: "instalatéři", label: "Instalatéři a havarijní servis" },
  { value: "topenáři", label: "Topenáři a servis vytápění" },
  { value: "plynaři", label: "Plynaři a plynové instalace" },
  { value: "truhláři", label: "Truhláři a zakázkový nábytek" },
  { value: "tesaři", label: "Tesaři a dřevostavby" },
  { value: "pokrývači", label: "Pokrývači a opravy střech" },
  { value: "zedníci", label: "Zedníci a stavební práce" },
  { value: "malíři", label: "Malíři, natěrači a tapetáři" },
  { value: "podlaháři", label: "Podlaháři a renovace podlah" },
  { value: "obkladači", label: "Obkladači a rekonstrukce koupelen" },
  { value: "sádrokartonáři", label: "Sádrokartonáři a interiérové příčky" },
  { value: "stavební firmy", label: "Stavební firmy a rekonstrukce" },
  { value: "okna a dveře", label: "Montáž a servis oken a dveří" },
  { value: "stínící technika", label: "Žaluzie, rolety a stínící technika" },
  { value: "fotovoltaika", label: "Fotovoltaika a solární systémy" },
  { value: "klimatizace", label: "Klimatizace a vzduchotechnika" },
  { value: "zahradníci", label: "Zahradníci a údržba zeleně" },
  { value: "úklidové firmy", label: "Úklidové firmy a úklid domácností" },
  { value: "stěhovací služby", label: "Stěhovací a vyklízecí služby" },
  { value: "bezpečnostní služby", label: "Ostraha a bezpečnostní systémy" },
  { value: "architekti", label: "Architekti a projektanti" },
  { value: "interiéroví designéři", label: "Interiéroví designéři" },
  { value: "advokáti", label: "Advokáti a právní kanceláře" },
  { value: "notáři", label: "Notáři a notářské kanceláře" },
  { value: "finanční poradci", label: "Finanční a hypoteční poradci" },
  { value: "pojišťovací makléři", label: "Pojišťovací makléři" },
  { value: "energetičtí poradci", label: "Energetičtí poradci a auditoři" },
  { value: "IT servis", label: "IT servis a správa sítí" },
  { value: "marketingové agentury", label: "Marketingové a reklamní agentury" },
  { value: "fotografové", label: "Fotografové a videografové" },
  { value: "svatební služby", label: "Svatební agentury a koordinátoři" },
  { value: "kadeřnictví", label: "Kadeřnictví a barber shopy" },
  { value: "kosmetické salony", label: "Kosmetické a nehtové salony" },
  { value: "masáže", label: "Masáže a wellness studia" },
  { value: "fitness centra", label: "Fitness centra a osobní trenéři" },
  { value: "psychologové", label: "Psychologové a terapeuti" },
  { value: "logopedie", label: "Logopedie a speciální pedagogika" },
  { value: "domácí péče", label: "Domácí a pečovatelské služby" },
  { value: "hlídání dětí", label: "Hlídání dětí a dětské skupiny" },
  { value: "péče o zvířata", label: "Psí salony, výcvik a hlídání zvířat" },
  { value: "restaurace", label: "Restaurace, bistra a kavárny" },
  { value: "ubytování", label: "Hotely, penziony a apartmány" },
  { value: "cestovní kanceláře", label: "Cestovní kanceláře a průvodci" },
  { value: "autoškoly", label: "Autoškoly a kondiční jízdy" },
  { value: "autodoprava", label: "Autodoprava, kurýrní a přepravní služby" },
  { value: "účetní kanceláře", label: "Účetní a daňové kanceláře" },
  { value: "fyzioterapie", label: "Fyzioterapie a rehabilitace" },
  { value: "dentální hygiena", label: "Dentální hygiena" },
  { value: "veterinární ordinace", label: "Veterinární ordinace" },
  { value: "správa SVJ", label: "Správa SVJ a nemovitostí" },
  {
    value: "revize elektro a plynu",
    label: "Revize elektro, plynu a zařízení",
  },
  { value: "BOZP a požární ochrana", label: "BOZP a požární ochrana" },
  { value: "geodeti", label: "Geodeti a zeměměřiči" },
  { value: "kominictví", label: "Kominictví" },
  { value: "deratizace a dezinfekce", label: "Deratizace a dezinfekce" },
  { value: "zámečnictví", label: "Zámečnictví a nouzové otevírání" },
  { value: "tepelná čerpadla", label: "Tepelná čerpadla a servis vytápění" },
  { value: "čištění koberců", label: "Čištění koberců a čalounění" },
  { value: "průmyslové lakovny", label: "Průmyslové lakovny" },
  { value: "kalibrace měřidel", label: "Kalibrace měřidel" },
  { value: "půjčovny stavební techniky", label: "Půjčovny stavební techniky" },
  { value: "firemní catering", label: "Firemní catering" },
  { value: "jazykové školy", label: "Jazykové školy" },
  { value: "pohřební služby", label: "Pohřební služby" },
  { value: "oční optiky", label: "Oční optiky" },
  { value: "specializované kliniky", label: "Specializované kliniky" },
] as const;

export const targetMarketOptions = [
  { value: "CZ", label: "Česko" },
  { value: "SK", label: "Slovensko" },
  { value: "DE", label: "Německo" },
  { value: "AT", label: "Rakousko" },
  { value: "PL", label: "Polsko" },
  { value: "CH", label: "Švýcarsko" },
  { value: "NL", label: "Nizozemsko" },
  { value: "BE", label: "Belgie" },
  { value: "FR", label: "Francie" },
  { value: "IT", label: "Itálie" },
  { value: "ES", label: "Španělsko" },
  { value: "UK", label: "Velká Británie" },
  { value: "US", label: "USA" },
  { value: "CA", label: "Kanada" },
  { value: "AU", label: "Austrálie" },
] as const;

const fieldSuggestions: Record<string, CommandCenterTemplateFieldOption[]> = {
  audience: [
    { value: "majitelé malých firem", label: "Majitelé malých firem" },
    { value: "B2B decision makeři", label: "B2B decision makeři" },
    {
      value: "lokální zákazníci 25-55 let",
      label: "Lokální zákazníci 25-55 let",
    },
  ],
  brand: [
    { value: "prémiová lokální značka", label: "Prémiová lokální značka" },
    { value: "B2B technologická značka", label: "B2B technologická značka" },
    { value: "osobní značka experta", label: "Osobní značka experta" },
  ],
  budget: [
    { value: "10 000 Kč měsíčně", label: "10 000 Kč měsíčně" },
    { value: "25 000 Kč měsíčně", label: "25 000 Kč měsíčně" },
    { value: "50 000 Kč měsíčně", label: "50 000 Kč měsíčně" },
  ],
  business: [
    {
      value: "lokální služba s rezervacemi",
      label: "Lokální služba s rezervacemi",
    },
    { value: "B2B poradenská firma", label: "B2B poradenská firma" },
    {
      value: "e-shop s odborným sortimentem",
      label: "E-shop s odborným sortimentem",
    },
  ],
  cadence: [
    { value: "3 příspěvky týdně", label: "3 příspěvky týdně" },
    { value: "5 příspěvků týdně", label: "5 příspěvků týdně" },
    { value: "denně", label: "Denně" },
  ],
  callReason: [
    { value: "rezervace termínu", label: "Rezervace termínu" },
    { value: "kvalifikace poptávky", label: "Kvalifikace poptávky" },
    { value: "zákaznická podpora", label: "Zákaznická podpora" },
  ],
  competitors: [
    {
      value: "3 přímí lokální konkurenti",
      label: "3 přímí lokální konkurenti",
    },
    {
      value: "5 nejviditelnějších značek v Google",
      label: "5 značek z Google",
    },
    { value: "lídři trhu v cílové zemi", label: "Lídři cílového trhu" },
  ],
  conversion: [
    { value: "rezervace konzultace", label: "Rezervace konzultace" },
    { value: "odeslání poptávky", label: "Odeslání poptávky" },
    { value: "online nákup", label: "Online nákup" },
  ],
  focus: [
    { value: "lead generation", label: "Lead generation" },
    { value: "růst tržeb", label: "Růst tržeb" },
    { value: "automatizace provozu", label: "Automatizace provozu" },
  ],
  formats: [
    { value: "Meta Ads 1:1 a 4:5", label: "Meta Ads 1:1 a 4:5" },
    {
      value: "Reels, Shorts a TikTok 9:16",
      label: "Reels, Shorts a TikTok 9:16",
    },
    {
      value: "web hero 16:9 a produktové karty",
      label: "Web hero a produktové karty",
    },
  ],
  goal: [
    { value: "kvalifikované leady", label: "Kvalifikované leady" },
    { value: "rezervace schůzky", label: "Rezervace schůzky" },
    { value: "měřitelný online prodej", label: "Měřitelný online prodej" },
  ],
  handoff: [
    {
      value: "předat člověku při nákupním záměru nebo stížnosti",
      label: "Nákupní záměr nebo stížnost",
    },
    {
      value: "předat obchodníkovi po kvalifikaci rozpočtu a termínu",
      label: "Po kvalifikaci rozpočtu a termínu",
    },
    {
      value: "eskalovat při nejistotě, citlivých údajích nebo právním dotazu",
      label: "Citlivý nebo právní dotaz",
    },
  ],
  channels: [
    { value: "e-mail a LinkedIn", label: "E-mail a LinkedIn" },
    { value: "web, e-mail a telefon", label: "Web, e-mail a telefon" },
    {
      value: "LinkedIn, Instagram a YouTube",
      label: "LinkedIn, Instagram a YouTube",
    },
  ],
  leadCount: [
    { value: "20", label: "20 firem" },
    { value: "50", label: "50 firem" },
    { value: "100", label: "100 firem" },
  ],
  location: [
    { value: "Praha", label: "Praha" },
    { value: "Brno", label: "Brno" },
    { value: "Ostrava", label: "Ostrava" },
    { value: "Bratislava", label: "Bratislava" },
    { value: "Berlin", label: "Berlín / Berlin" },
    { value: "Vienna", label: "Vídeň / Vienna" },
    { value: "Warsaw", label: "Varšava / Warsaw" },
    { value: "London", label: "Londýn / London" },
    { value: "New York", label: "New York" },
  ],
  market: [
    { value: "Česko", label: "Česko" },
    { value: "DACH", label: "DACH: Německo, Rakousko, Švýcarsko" },
    { value: "střední Evropa", label: "Střední Evropa" },
    { value: "anglicky mluvící trhy", label: "Anglicky mluvící trhy" },
  ],
  niche: [
    { value: "B2B software", label: "B2B software" },
    { value: "zdraví a wellness", label: "Zdraví a wellness" },
    { value: "domov a řemesla", label: "Domov a řemesla" },
  ],
  offer: [
    {
      value: "bezplatný audit a placená implementace",
      label: "Audit + implementace",
    },
    { value: "30denní pilot s měřitelným výsledkem", label: "30denní pilot" },
    { value: "setup a měsíční správa", label: "Setup + měsíční správa" },
  ],
  platforms: [
    {
      value: "LinkedIn, Instagram a YouTube",
      label: "LinkedIn, Instagram a YouTube",
    },
    {
      value: "Instagram, TikTok a YouTube Shorts",
      label: "Instagram, TikTok a Shorts",
    },
    { value: "LinkedIn a YouTube", label: "LinkedIn a YouTube" },
  ],
  price: [
    { value: "990 Kč", label: "990 Kč" },
    { value: "2 490 Kč", label: "2 490 Kč" },
    { value: "9 900 Kč", label: "9 900 Kč" },
  ],
  product: [
    { value: "digitální produkt", label: "Digitální produkt" },
    { value: "lokální služba", label: "Lokální služba" },
    { value: "B2B SaaS", label: "B2B SaaS" },
  ],
  sequenceLength: [
    { value: "3", label: "3 kroky" },
    { value: "5", label: "5 kroků" },
    { value: "7", label: "7 kroků" },
  ],
  segment: [
    { value: "lokální služby", label: "Lokální služby" },
    {
      value: "B2B firmy do 50 zaměstnanců",
      label: "B2B firmy do 50 zaměstnanců",
    },
    { value: "specializované e-shopy", label: "Specializované e-shopy" },
  ],
  source: [
    { value: "URL veřejného videa", label: "URL veřejného videa" },
    { value: "OMNIVIDEO projectId", label: "OMNIVIDEO projectId" },
    { value: "nahraný MP4 soubor", label: "Nahraný MP4 soubor" },
  ],
  style: [
    { value: "čistý produktový", label: "Čistý produktový" },
    { value: "technický a důvěryhodný", label: "Technický a důvěryhodný" },
    { value: "prémiový editorial", label: "Prémiový editorial" },
  ],
  successMetric: [
    {
      value: "počet kvalifikovaných leadů a cena za lead",
      label: "Leady a cena za lead",
    },
    {
      value: "potvrzené rezervace a conversion rate",
      label: "Rezervace a konverze",
    },
    { value: "atributované tržby a hrubá marže", label: "Tržby a marže" },
  ],
  targetMarket: [
    { value: "lokální služby v Česku", label: "Lokální služby v Česku" },
    { value: "DACH B2B segment", label: "DACH B2B segment" },
    { value: "anglicky mluvící trhy", label: "Anglicky mluvící trhy" },
  ],
  tone: [
    { value: "věcný a profesionální", label: "Věcný a profesionální" },
    { value: "přátelský a srozumitelný", label: "Přátelský a srozumitelný" },
    { value: "prémiový a sebevědomý", label: "Prémiový a sebevědomý" },
  ],
  topic: [
    {
      value: "automatizace pro lokální firmy",
      label: "Automatizace pro lokální firmy",
    },
    { value: "AI pro růst B2B tržeb", label: "AI pro růst B2B tržeb" },
    { value: "praktické oborové návody", label: "Praktické oborové návody" },
  ],
  variants: [
    { value: "3", label: "3 varianty" },
    { value: "5", label: "5 variant" },
    { value: "10", label: "10 variant" },
  ],
};

export function getCommandCenterFieldSuggestions(
  field: CommandCenterTemplateField
): CommandCenterTemplateFieldOption[] {
  const suggestions = field.options ?? fieldSuggestions[field.key] ?? [];
  const defaultOption = field.defaultValue
    ? [{ value: field.defaultValue, label: field.defaultValue }]
    : [];
  const unique = new Map<string, CommandCenterTemplateFieldOption>();

  for (const option of [...defaultOption, ...suggestions]) {
    unique.set(option.value, option);
  }

  return Array.from(unique.values());
}

const executionGuard = `Pravidla výstupu:
- Nevydávej návrh nebo simulaci za skutečně provedenou akci.
- Odděl: hotové podklady, kroky čekající na schválení a kroky vyžadující externí integraci.
- Před odesláním, publikací, nákupem nebo kontaktováním třetí strany vždy vyžádej schválení.
- Uveď konkrétní další krok a zodpovědnou roli.`;

const withExecutionGuard = (prompt: string) => `${prompt}\n\n${executionGuard}`;

const profitTemplatePresentation: Record<
  ProfitEngineId,
  {
    icon: CommandCenterTemplateIcon;
    agentIds: string[];
    targetMarket: string;
    successMetric: string;
  }
> = {
  "audit-to-revenue": {
    icon: "building",
    agentIds: ["prospector", "analyst", "copywriter", "advisor"],
    targetMarket: "lokální B2B služby v jednom městě",
    successMetric:
      "schválené nabídky, odpovědi a tržba přiřazená ke zdrojovému auditu",
  },
  "ai-reception": {
    icon: "phone",
    agentIds: ["voice_closer", "strategist", "advisor"],
    targetMarket: "jedna provozovna s opakovanými dotazy a rezervacemi",
    successMetric: "kvalifikované rezervace, eskalace a missed-call recovery",
  },
  "eshop-autopilot": {
    icon: "package",
    agentIds: ["strategist", "copywriter", "analyst"],
    targetMarket: "e-shop s 50 pilotními SKU a jedním cílovým jazykem",
    successMetric: "schválené SKU, marže a publikace bez produktových chyb",
  },
  "reputation-monitor": {
    icon: "megaphone",
    agentIds: ["social_manager", "analyst", "copywriter"],
    targetMarket: "jedna lokální provozovna s Google recenzemi",
    successMetric: "doba reakce, trend sentimentu a počet schválených odpovědí",
  },
  "content-revenue-loop": {
    icon: "video",
    agentIds: ["strategist", "copywriter", "social_manager", "analyst"],
    targetMarket: "jeden obsahový formát, dva kanály a jeden conversion event",
    successMetric:
      "provider post ID a atribuovaná konverze na final-ready asset",
  },
  "affiliate-content": {
    icon: "affiliate",
    agentIds: ["market_spy", "copywriter", "analyst"],
    targetMarket: "jedna vertikála s deseti komerčními dotazy",
    successMetric:
      "publikované fact-checkované stránky, kliky a přiřazené affiliate prodeje",
  },
  "digital-products": {
    icon: "package",
    agentIds: ["funnel_builder", "copywriter", "strategist"],
    targetMarket: "publikum s již ověřeným klientským workflow",
    successMetric:
      "ověřené objednávky, aktivace produktu, refundy a opakované použití",
  },
};

function createProfitTemplate(engine: ProfitEngine): CommandCenterTemplate {
  const presentation = profitTemplatePresentation[engine.id];
  const evidenceRequired = engine.stages.map(stage => stage.evidence);
  const operatingModel = engine.stages
    .map(stage => `- ${stage.title}: ${stage.mode}; důkaz: ${stage.evidence}`)
    .join("\n");

  return {
    id: engine.templateId,
    profitEngineId: engine.id,
    title: engine.title,
    description: `${engine.description} Cílová automatizace ${engine.targetAutomation}; model ${engine.revenueType}.`,
    category: "profit",
    status: engine.state === "guided" ? "guided" : "roadmap",
    icon: presentation.icon,
    agentIds: presentation.agentIds,
    fields: [
      {
        key: "targetMarket",
        label: "Cílový segment",
        placeholder: "konkrétní segment a lokalita",
        defaultValue: presentation.targetMarket,
        required: true,
      },
      {
        key: "offer",
        label: "První nabídka",
        placeholder: "malý ověřitelný pilot",
        defaultValue: engine.firstOffer,
        required: true,
        multiline: true,
      },
      {
        key: "successMetric",
        label: "Důkaz úspěchu",
        placeholder: "měřitelný obchodní výsledek",
        defaultValue: presentation.successMetric,
        required: true,
        multiline: true,
      },
    ],
    outputs: [
      "nabídka a cenový model",
      "mapa automatických, schvalovaných a blokovaných kroků",
      "30denní pilot s metrikami a stop/go pravidly",
      "seznam chybějících integrací a požadovaných důkazů",
    ],
    steps: [
      "Ověřit současné důkazy a chybějící data",
      "Vymezit nabídku, segment a ekonomiku pilotu",
      "Rozdělit automatické, schvalované a blokované kroky",
      "Připravit 30denní validační plán",
      "Stanovit revenue atribuci a stop/go kritéria",
    ],
    prompt:
      withExecutionGuard(`Připrav konkrétní validační a realizační plán pro ${engine.title}.

Cílový segment: {{targetMarket}}
První nabídka: {{offer}}
Důkaz úspěchu: {{successMetric}}
Cenový rámec: setup ${engine.pricing.setup}; recurring ${engine.pricing.recurring}

Současné důkazy:
${engine.currentEvidence.map(item => `- ${item}`).join("\n")}

Provozní model:
${operatingModel}

Blokátory:
${engine.blockers.map(item => `- ${item}`).join("\n")}

Rizika:
${engine.risks.map(item => `- ${item}`).join("\n")}

Výstup musí obsahovat ekonomiku pilotu, vlastníka každého kroku, požadovaný důkaz, schvalovací brány, 30denní harmonogram a stop/go kritéria. Blokované kroky pouze naplánuj; nevydávej je za implementované nebo provedené.`),
    governance: {
      approvalRequired: true,
      executionMode: "draft_only",
      evidenceRequired,
      hardBlocks: engine.blockers,
    },
    module:
      engine.id === "ai-reception"
        ? {
            route: "/calls",
            label: "Otevřít hlasový modul",
            description:
              "Nahrání, přepis, AI analýza a sentiment existujících hovorů.",
          }
        : undefined,
  };
}

const profitTemplates = [...profitEngines]
  .sort((left, right) => left.priority - right.priority)
  .map(createProfitTemplate);

export const commandCenterTemplates: CommandCenterTemplate[] = [
  {
    id: "local-growth-system",
    title: "Lokální akviziční systém",
    description:
      "Najde firmy ve vybraném oboru a lokalitě, vyhodnotí jejich weby a připraví personalizované oslovení.",
    category: "acquisition",
    status: "live",
    icon: "building",
    agentIds: ["prospector", "analyst", "copywriter", "advisor"],
    fields: [
      {
        key: "segment",
        label: "Obor",
        placeholder: "např. autoservisy",
        defaultValue: "autoservisy",
        required: true,
        options: [...localAcquisitionIndustryOptions],
        allowCustom: true,
      },
      {
        key: "market",
        label: "Cílový trh",
        placeholder: "Vyberte zemi",
        defaultValue: "CZ",
        required: true,
        options: [...targetMarketOptions],
      },
      {
        key: "location",
        label: "Lokalita",
        placeholder: "např. Praha",
        defaultValue: "Praha",
        required: true,
      },
      {
        key: "leadCount",
        label: "Počet firem",
        placeholder: "30",
        defaultValue: "30",
        required: true,
      },
      {
        key: "offer",
        label: "Nabídka",
        placeholder: "audit webu a nový web",
        defaultValue: "audit webu a návrh modernizace",
        required: true,
      },
    ],
    outputs: [
      "prioritizovaný seznam leadů",
      "auditní osnova",
      "outreach návrhy",
    ],
    steps: [
      "Definovat vyhledávací kritéria",
      "Prověřit web a obchodní signály",
      "Seřadit firmy podle příležitosti",
      "Připravit personalizované oslovení",
      "Předat návrhy ke schválení",
    ],
    prompt:
      withExecutionGuard(`Navrhni akviziční workflow pro {{leadCount}} firem v oboru {{segment}} v lokalitě {{location}} na trhu {{market}}.
Nabídka: {{offer}}.

Připrav kritéria vyhledávání, bodovací model pro kvalitu příležitosti, strukturu rychlého auditu webu, pole pro CRM a tři varianty personalizovaného prvního oslovení. Pokud má systém přístup k existujícím modulům Google Maps, webového auditu nebo CRM, popiš přesně jejich použití, ale netvrď, že byly spuštěny bez doloženého výsledku.`),
  },
  {
    id: "ai-website-brief",
    title: "Web pro službu: návrh a zadání",
    description:
      "Připraví strukturu, texty, SEO, formuláře a zadání pro webový builder; hotový web zatím sám nepublikuje.",
    category: "acquisition",
    status: "guided",
    icon: "globe",
    agentIds: ["strategist", "funnel_builder", "copywriter", "advisor"],
    fields: [
      {
        key: "business",
        label: "Co má web nabízet",
        placeholder: "např. Autoservis Novák",
        required: true,
      },
      {
        key: "audience",
        label: "Komu má web prodávat",
        placeholder: "řidiči v Praze 4",
        required: true,
      },
      {
        key: "goal",
        label: "Co má návštěvník udělat",
        placeholder: "rezervace termínu",
        defaultValue: "získání poptávky nebo rezervace",
        required: true,
      },
    ],
    outputs: [
      "zadání pro webový builder",
      "struktura a texty stránek",
      "formuláře, SEO a automatizace",
    ],
    steps: [
      "Vyjasnit nabídku a lokální publikum",
      "Navrhnout informační architekturu",
      "Připravit konverzní texty",
      "Popsat formuláře a automatizace",
    ],
    prompt:
      withExecutionGuard(`Připrav kompletní zadání webu pro {{business}} pro publikum {{audience}}.
Primární konverzní cíl: {{goal}}.

Výstup rozděl na positioning, strukturu stránek, obsah jednotlivých sekcí, lokální SEO, formuláře, následnou automatizaci a měření. Přidej seznam vstupů, které musí dodat klient, a označ předpoklady.`),
  },
  {
    id: "competitor-watch",
    title: "Monitoring konkurence",
    description:
      "Porovná nabídky, ceny, argumenty a obsah konkurentů a ukáže konkrétní příležitosti k odlišení.",
    category: "acquisition",
    status: "guided",
    icon: "search",
    agentIds: ["market_spy", "analyst", "strategist"],
    fields: [
      {
        key: "market",
        label: "Trh",
        placeholder: "např. účetní software pro OSVČ",
        required: true,
      },
      {
        key: "competitors",
        label: "Konkurenti",
        placeholder: "názvy nebo URL, oddělené čárkou",
        required: true,
      },
      {
        key: "focus",
        label: "Zaměření analýzy",
        placeholder: "cena, nabídka, reklamy, obsah",
        defaultValue: "nabídka, cena, důkazy, obsah a distribuční kanály",
      },
    ],
    outputs: ["srovnávací matice", "mezery na trhu", "doporučené experimenty"],
    steps: [
      "Vymezit sledovaný trh",
      "Porovnat veřejně dostupné signály",
      "Najít neobsazené pozice",
      "Navrhnout ověřitelné experimenty",
    ],
    prompt: withExecutionGuard(`Připrav konkurenční analýzu trhu {{market}}.
Sledovaní konkurenti: {{competitors}}.
Zaměření: {{focus}}.

Odděl ověřená fakta, odhady a chybějící data. Vytvoř srovnávací matici a navrhni tři realistické příležitosti k odlišení včetně způsobu jejich ověření.`),
  },
  {
    id: "affiliate-opportunity",
    title: "Affiliate příležitost",
    description:
      "Navrhne, jak vybrat affiliate program, jaký obsah vytvořit, kde jej šířit a jak měřit skutečné provize.",
    category: "acquisition",
    status: "guided",
    icon: "affiliate",
    agentIds: ["market_spy", "strategist", "analyst", "copywriter"],
    fields: [
      {
        key: "niche",
        label: "Nika",
        placeholder: "např. nástroje pro tvůrce videa",
        required: true,
      },
      {
        key: "audience",
        label: "Publikum",
        placeholder: "freelance marketéři",
        required: true,
      },
      {
        key: "channels",
        label: "Kanály",
        placeholder: "YouTube, blog, newsletter",
        required: true,
      },
    ],
    outputs: ["výběrová kritéria", "obsahový plán", "tracking model"],
    steps: [
      "Definovat vhodnost nabídky",
      "Navrhnout způsob ověření programů",
      "Připravit distribuční obsah",
      "Nastavit atribuci a limity rizika",
    ],
    prompt:
      withExecutionGuard(`Navrhni affiliate strategii pro niku {{niche}}, publikum {{audience}} a kanály {{channels}}.

Stanov kritéria pro výběr programů, rizika závislosti na jedné platformě, obsahovou cestu od objevení po konverzi a metriky. Nevymýšlej konkrétní podmínky programů bez ověření; místo toho připrav kontrolní seznam pro jejich dohledání.`),
  },
  {
    id: "full-campaign",
    title: "Kampaň z jednoho zadání",
    description:
      "Rozloží jeden obchodní cíl na leady, e-maily, obsah, video, landing page, schválení a měření výsledků.",
    category: "sales",
    status: "guided",
    icon: "megaphone",
    agentIds: [
      "strategist",
      "prospector",
      "copywriter",
      "social_manager",
      "analyst",
    ],
    fields: [
      {
        key: "offer",
        label: "Produkt nebo nabídka",
        placeholder: "co prodáváme",
        required: true,
      },
      {
        key: "audience",
        label: "Cílová skupina",
        placeholder: "komu prodáváme",
        required: true,
      },
      {
        key: "goal",
        label: "Cíl kampaně",
        placeholder: "např. 20 kvalifikovaných schůzek",
        required: true,
      },
      {
        key: "budget",
        label: "Rozpočet a období",
        placeholder: "např. 50 000 Kč / 30 dní",
        required: true,
      },
    ],
    outputs: ["kampaňový brief", "asset checklist", "měřicí plán"],
    steps: [
      "Definovat nabídku a cíl",
      "Rozdělit práci mezi agenty",
      "Připravit podklady po kanálech",
      "Nastavit schvalovací body",
      "Definovat reporting",
    ],
    prompt:
      withExecutionGuard(`Připrav integrovanou kampaň pro nabídku {{offer}}, publikum {{audience}} a cíl {{goal}}.
Rozpočet a období: {{budget}}.

Rozděl práci na strategii, akvizici, e-mail, sociální obsah, video, landing page a analytiku. Pro každý proud uveď výstup, vlastníka, závislosti, metriky a schvalovací bod. Nakonec sestav realistické pořadí realizace.`),
  },
  {
    id: "email-sequence",
    title: "Prodejní e-mailová sekvence",
    description:
      "Napíše navazující prodejní e-maily včetně předmětů, personalizace, časování a pravidel ukončení.",
    category: "sales",
    status: "guided",
    icon: "mail",
    agentIds: ["prospector", "copywriter", "advisor"],
    fields: [
      {
        key: "offer",
        label: "Nabídka",
        placeholder: "co příjemci nabízíme",
        required: true,
      },
      {
        key: "segment",
        label: "Segment",
        placeholder: "komu píšeme",
        required: true,
      },
      {
        key: "sequenceLength",
        label: "Počet kroků",
        placeholder: "5",
        defaultValue: "5",
        required: true,
      },
      {
        key: "tone",
        label: "Tón",
        placeholder: "věcný a osobní",
        defaultValue: "věcný, stručný a osobní",
      },
    ],
    outputs: ["sekvence e-mailů", "předměty", "personalizační proměnné"],
    steps: [
      "Vyjasnit segment a spouštěč",
      "Navrhnout posloupnost argumentů",
      "Napsat jednotlivé zprávy",
      "Přidat personalizaci a stop pravidla",
      "Předat sekvenci ke schválení",
    ],
    prompt:
      withExecutionGuard(`Připrav {{sequenceLength}}krokovou prodejní e-mailovou sekvenci pro segment {{segment}}.
Nabídka: {{offer}}. Tón: {{tone}}.

U každého kroku uveď časování, předmět, tělo, personalizační proměnné, CTA a podmínku ukončení sekvence. Přidej variantu prvního e-mailu a kontrolní seznam před odesláním.`),
  },
  {
    id: "sales-funnel",
    title: "Prodejní funnel",
    description:
      "Navrhne cestu od první návštěvy přes landing page a follow-up až k nákupu, rezervaci nebo poptávce.",
    category: "sales",
    status: "guided",
    icon: "funnel",
    agentIds: ["funnel_builder", "copywriter", "strategist", "analyst"],
    fields: [
      {
        key: "offer",
        label: "Nabídka",
        placeholder: "produkt nebo služba",
        required: true,
      },
      {
        key: "audience",
        label: "Publikum",
        placeholder: "ideální zákazník",
        required: true,
      },
      {
        key: "conversion",
        label: "Cílová konverze",
        placeholder: "nákup, demo, rezervace",
        required: true,
      },
    ],
    outputs: ["mapa funnelu", "landing page copy", "follow-up scénář"],
    steps: [
      "Zmapovat stav před nákupem",
      "Navrhnout jednotlivé kroky funnelu",
      "Připravit obsah a námitky",
      "Definovat události a metriky",
    ],
    prompt:
      withExecutionGuard(`Navrhni prodejní funnel pro nabídku {{offer}}, publikum {{audience}} a cílovou konverzi {{conversion}}.

Připrav mapu kroků, strukturu a text landing page, formulář, děkovací stránku, follow-up a měřicí události. U každého kroku vysvětli hlavní námitku zákazníka a jak ji obsah řeší.`),
  },
  {
    id: "inbound-voice-receptionist",
    title: "AI hlasová recepce",
    description:
      "Připraví scénář recepční, kvalifikaci a předání člověku; nahrané hovory umí přepsat a vyhodnotit už nyní.",
    category: "sales",
    status: "guided",
    icon: "phone",
    agentIds: ["voice_closer", "advisor", "analyst"],
    fields: [
      {
        key: "business",
        label: "Firma",
        placeholder: "název a obor firmy",
        required: true,
      },
      {
        key: "callReason",
        label: "Typ hovoru",
        placeholder: "rezervace, kvalifikace, podpora",
        required: true,
      },
      {
        key: "handoff",
        label: "Předání člověku",
        placeholder: "kdy a komu má agent předat hovor",
        required: true,
      },
    ],
    outputs: [
      "konverzační strom",
      "bezpečnostní pravidla",
      "přepis a AI analýza nahrávek",
      "zadání živé telefonní integrace",
    ],
    steps: [
      "Vymezit povolené scénáře",
      "Navrhnout dialog a kvalifikaci",
      "Definovat eskalaci na člověka",
      "Vyhodnotit nahrávky v hlasovém modulu",
      "Popsat živou telefonní a kalendářovou integraci",
      "Připravit testovací scénáře",
    ],
    prompt:
      withExecutionGuard(`Navrhni inbound AI hlasovou recepci pro {{business}}.
Typické hovory: {{callReason}}. Pravidla předání člověku: {{handoff}}.

Připrav konverzační strom, povolené a zakázané odpovědi, práci se souhlasem a osobními údaji, eskalaci, integrační požadavky na telefonii/CRM/kalendář a sadu akceptačních testů. ONYX hlasový modul na /calls je dostupný pro nahrání, přepis, AI analýzu, sentiment a CRM follow-up. Živou příchozí telefonii, volání a rezervace označ jako blokované do napojení telephony a booking provideru.`),
    module: {
      route: "/calls",
      label: "Otevřít hlasový modul",
      description:
        "Nahrání, přepis, AI analýza, sentiment a CRM návaznost pro hovory.",
    },
  },
  {
    id: "seo-content-engine",
    title: "SEO obsahový engine",
    description:
      "Vytvoří tematickou mapu, pořadí článků, konkrétní briefy, interní odkazy a plán měření organických leadů.",
    category: "content",
    status: "guided",
    icon: "search",
    agentIds: ["market_spy", "strategist", "copywriter", "analyst"],
    fields: [
      {
        key: "topic",
        label: "Téma nebo nabídka",
        placeholder: "např. automatizace pro autoservisy",
        required: true,
      },
      {
        key: "audience",
        label: "Publikum",
        placeholder: "majitelé autoservisů v ČR",
        required: true,
      },
      {
        key: "market",
        label: "Jazyk a trh",
        placeholder: "čeština / Česká republika",
        defaultValue: "čeština / Česká republika",
        required: true,
      },
    ],
    outputs: ["tematická mapa", "prioritizovaný backlog", "briefy článků"],
    steps: [
      "Vymezit problém a hledající publikum",
      "Seskupit témata podle záměru",
      "Prioritizovat obchodní potenciál",
      "Připravit obsahové briefy",
      "Definovat interní prolinkování a měření",
    ],
    prompt:
      withExecutionGuard(`Připrav SEO obsahový systém pro téma {{topic}}, publikum {{audience}} a trh {{market}}.

Vytvoř tematické clustery podle vyhledávacího záměru, prioritizační model, prvních 12 témat, brief každého článku, návrh interního prolinkování a konverzní cestu. Objem hledání a obtížnost nevymýšlej; označ je jako data k ověření v SEO nástroji.`),
  },
  {
    id: "image-asset-pack",
    title: "Obrazový asset balíček",
    description:
      "Připraví kreativní směry a produkční prompty pro produktové obrázky, reklamy, web a sociální sítě.",
    category: "content",
    status: "roadmap",
    icon: "wand",
    agentIds: ["strategist", "copywriter", "social_manager"],
    fields: [
      {
        key: "brand",
        label: "Značka nebo produkt",
        placeholder: "název a stručný popis",
        required: true,
      },
      {
        key: "formats",
        label: "Požadované formáty",
        placeholder: "Meta ads, LinkedIn, web hero",
        required: true,
      },
      {
        key: "style",
        label: "Vizuální směr",
        placeholder: "čistý produktový, technický, prémiový",
        required: true,
      },
    ],
    outputs: ["creative direction", "prompt balíček", "formátová matice"],
    steps: [
      "Vymezit vizuální pravidla značky",
      "Navrhnout kreativní koncepty",
      "Připravit prompty a negativní omezení",
      "Rozdělit varianty podle formátů",
      "Předat generování a výběr ke schválení",
    ],
    prompt:
      withExecutionGuard(`Připrav obrazový asset balíček pro {{brand}} ve formátech {{formats}}.
Vizuální směr: {{style}}.

Navrhni tři odlišné kreativní koncepty, pro každý produkční prompt, negativní omezení, kompozici, bezpečné zóny pro text a adaptace podle formátu. Samotné generování označ jako integrační krok, pokud není dostupný obrazový model.`),
  },
  {
    id: "website-chatbot",
    title: "Webový prodejní chatbot",
    description:
      "Navrhne chatbota, který odpovídá na FAQ, kvalifikuje návštěvníka, získá kontakt a předá složitý případ člověku.",
    category: "sales",
    status: "roadmap",
    icon: "globe",
    agentIds: ["advisor", "prospector", "copywriter", "analyst"],
    fields: [
      {
        key: "business",
        label: "Firma nebo web",
        placeholder: "název, URL a nabídka",
        required: true,
      },
      {
        key: "goal",
        label: "Cíl konverzace",
        placeholder: "kvalifikace, schůzka, poptávka",
        required: true,
      },
      {
        key: "handoff",
        label: "Předání člověku",
        placeholder: "kdy a kam eskalovat",
        required: true,
      },
    ],
    outputs: ["dialogový strom", "znalostní osnova", "integrační zadání"],
    steps: [
      "Vymezit účel a zakázané oblasti",
      "Navrhnout kvalifikační dialog",
      "Připravit FAQ a zdroje odpovědí",
      "Definovat sběr souhlasu a leadu",
      "Popsat eskalaci a měření",
    ],
    prompt:
      withExecutionGuard(`Navrhni webový prodejní chatbot pro {{business}} s cílem {{goal}}.
Pravidla předání člověku: {{handoff}}.

Připrav úvodní větvení, kvalifikační otázky, FAQ osnovu, práci s neznámou odpovědí, sběr kontaktu a souhlasu, eskalaci, integrační kontrakt a akceptační testy. Nasazení widgetu nevydávej za hotové bez ověřené integrace.`),
  },
  {
    id: "social-calendar",
    title: "30denní sociální kalendář",
    description:
      "Rozepíše 30 dní konkrétních příspěvků včetně hooků, textů, CTA, vizuálních podkladů a termínů publikace.",
    category: "content",
    status: "roadmap",
    icon: "calendar",
    agentIds: ["social_manager", "copywriter", "strategist"],
    fields: [
      {
        key: "brand",
        label: "Značka",
        placeholder: "název a stručný popis",
        required: true,
      },
      {
        key: "platforms",
        label: "Platformy",
        placeholder: "LinkedIn, Instagram, TikTok",
        required: true,
      },
      {
        key: "goal",
        label: "Obsahový cíl",
        placeholder: "lead generation, důvěra, dosah",
        required: true,
      },
    ],
    outputs: ["30denní kalendář", "texty příspěvků", "asset briefy"],
    steps: [
      "Definovat pilíře a poměr formátů",
      "Rozvrhnout témata v čase",
      "Připravit texty a vizuální briefy",
      "Přidat schvalování a měření",
    ],
    prompt:
      withExecutionGuard(`Připrav 30denní obsahový kalendář pro značku {{brand}} na platformách {{platforms}}.
Cíl: {{goal}}.

Definuj obsahové pilíře a pro každý den navrhni formát, téma, hook, hlavní sdělení, CTA, požadovaný asset a metriku. Zohledni rozdíly platforem. Publikaci pouze naplánuj; bez ověřeného OAuth konektoru ji nevydávej za provedenou.`),
  },
  {
    id: "ugc-ad-pack",
    title: "UGC reklamní balíček",
    description:
      "Vytvoří několik UGC reklamních scénářů s hookem, záběry, titulky, CTA a jasnou testovací hypotézou.",
    category: "content",
    status: "guided",
    icon: "wand",
    agentIds: ["copywriter", "social_manager", "analyst"],
    fields: [
      {
        key: "product",
        label: "Produkt",
        placeholder: "produkt a hlavní výhoda",
        required: true,
      },
      {
        key: "audience",
        label: "Publikum",
        placeholder: "pro koho je reklama",
        required: true,
      },
      {
        key: "variants",
        label: "Počet variant",
        placeholder: "5",
        defaultValue: "5",
        required: true,
      },
    ],
    outputs: ["UGC scénáře", "shot list", "testovací matice"],
    steps: [
      "Najít uvěřitelné zákaznické situace",
      "Napsat odlišné hooky",
      "Připravit scénáře a záběry",
      "Definovat testované proměnné",
    ],
    prompt:
      withExecutionGuard(`Připrav {{variants}} variant UGC reklamy pro produkt {{product}} a publikum {{audience}}.

Každá varianta musí obsahovat hook, situaci, 20-40sekundový scénář, shot list, titulky, CTA a testovanou hypotézu. Vyhni se neověřeným tvrzením a falešným zákaznickým zkušenostem.`),
  },
  {
    id: "video-repurpose",
    title: "Video repurposing",
    description:
      "Rozdělí jedno dlouhé video na Shorts, Reels, TikTok a posty a předá hotové formáty do publikačního plánu.",
    category: "content",
    status: "roadmap",
    icon: "video",
    agentIds: ["social_manager", "copywriter", "strategist", "analyst"],
    fields: [
      {
        key: "source",
        label: "Zdrojové video",
        placeholder: "URL nebo popis videa",
        required: true,
      },
      {
        key: "platforms",
        label: "Cílové platformy",
        placeholder: "YouTube Shorts, TikTok, Reels, LinkedIn",
        required: true,
      },
      {
        key: "goal",
        label: "Cíl",
        placeholder: "dosah, leady, autorita",
        required: true,
      },
    ],
    outputs: ["clip mapa", "copy balíček", "distribuční harmonogram"],
    steps: [
      "Najít nejsilnější momenty",
      "Navrhnout formáty podle kanálu",
      "Připravit hooky, titulky a CTA",
      "Oddělit tvorbu assetů od publikace",
      "Nastavit měření výkonu",
    ],
    prompt:
      withExecutionGuard(`Navrhni repurposing zdrojového videa {{source}} pro platformy {{platforms}} s cílem {{goal}}.

Připrav mapu klipů s časovým nebo tematickým vymezením, hookem, délkou, titulkem, CTA a platformní úpravou. Odděl produkční zadání pro OMNIVIDEO+ od publikačního plánu pro FORGE. Pokud zdroj nelze načíst, požádej o přepis nebo metadata.`),
  },
  {
    id: "digital-product-launch",
    title: "Digitální produkt",
    description:
      "Ověří poptávku a připraví osnovu produktu, cenu, prodejní nabídku, jednoduchý funnel a stop/go metriky.",
    category: "content",
    status: "guided",
    icon: "package",
    agentIds: ["market_spy", "strategist", "funnel_builder", "copywriter"],
    fields: [
      {
        key: "topic",
        label: "Téma nebo expertiza",
        placeholder: "co umíte nebo chcete učit",
        required: true,
      },
      {
        key: "audience",
        label: "Publikum",
        placeholder: "pro koho je produkt",
        required: true,
      },
      {
        key: "price",
        label: "Cenové rozpětí",
        placeholder: "např. 490-1 990 Kč",
        required: true,
      },
    ],
    outputs: ["validační plán", "produktová osnova", "launch experiment"],
    steps: [
      "Ověřit problém a ochotu platit",
      "Vymezit minimální produkt",
      "Navrhnout nabídku a cenu",
      "Připravit funnel a distribuci",
      "Stanovit stop/go metriky",
    ],
    prompt:
      withExecutionGuard(`Navrhni digitální produkt na téma {{topic}} pro publikum {{audience}} v cenovém rozpětí {{price}}.

Začni levnou validací poptávky, potom připrav minimální rozsah produktu, osnovu, nabídku, cenový test, jednoduchý funnel a distribuční experiment. Uveď stop/go kritéria, aby se produkt nevyráběl bez důkazu zájmu.`),
  },
  {
    id: "telegram-briefing",
    title: "Telegram briefing",
    description:
      "Sestaví pravidelný stručný report leadů, kampaní, rizik a rozhodnutí a doručí jej vedení přes Telegram.",
    category: "operations",
    status: "live",
    icon: "telegram",
    agentIds: ["synthesizer", "analyst", "advisor"],
    fields: [
      {
        key: "focus",
        label: "Obsah reportu",
        placeholder: "leady, kampaně, rizika, rozhodnutí",
        defaultValue:
          "leady, obchodní pipeline, kampaně, rizika a čekající rozhodnutí",
        required: true,
      },
      {
        key: "cadence",
        label: "Frekvence",
        placeholder: "každé pracovní ráno",
        defaultValue: "každé pracovní ráno",
        required: true,
      },
      {
        key: "audience",
        label: "Příjemce",
        placeholder: "CEO, obchodní tým",
        defaultValue: "CEO",
        required: true,
      },
    ],
    outputs: ["briefing šablona", "prioritizační pravidla", "plán doručení"],
    steps: [
      "Vymezit zdroje a příjemce",
      "Definovat priority a výjimky",
      "Připravit stručný formát",
      "Nastavit schválené doručení",
    ],
    prompt:
      withExecutionGuard(`Navrhni pravidelný Telegram briefing pro {{audience}} s frekvencí {{cadence}}.
Obsah: {{focus}}.

Připrav přesný formát zprávy, pravidla prioritizace, datové zdroje, upozornění na chybějící data a eskalační podmínky. Odděl návrh reportu od skutečného nastavení bota nebo plánovače.`),
  },
  ...profitTemplates,
];

export function getCommandCenterTemplate(
  templateId: string
): CommandCenterTemplate | undefined {
  return commandCenterTemplates.find(template => template.id === templateId);
}

export function createCommandCenterTemplateValues(
  template: CommandCenterTemplate
): Record<string, string> {
  return Object.fromEntries(
    template.fields.map(field => [field.key, field.defaultValue ?? ""])
  );
}

export function buildCommandCenterPrompt(
  template: CommandCenterTemplate,
  values: Record<string, string>
): string {
  return template.fields.reduce((prompt, field) => {
    const value = values[field.key]?.trim() || `[${field.label}]`;
    return prompt.replaceAll(`{{${field.key}}}`, value);
  }, template.prompt);
}

export type PricingMode = "free" | "fixed" | "from";

export type CoreOffer = {
  id: "mini-audit" | "onyx-os-audit" | "onyx-os-setup" | "monitoring";
  name: string;
  priceInCzk: number;
  pricingMode: PricingMode;
  billingPeriod?: "month";
  description: string;
  features: readonly string[];
  cta: string;
  href: string;
};

export const SERVICE_TERMS = {
  introCallMinutes: 30,
  auditConsultationMinutes: 60,
  initialResponseHours: 24,
  miniAuditDeliveryHours: 24,
  setupDeliveryWeeks: "1–3",
  typicalWebDeliveryWeeks: "1–2",
} as const;

export const CORE_OFFERS = {
  MINI_AUDIT: {
    id: "mini-audit",
    name: "Mini audit",
    priceInCzk: 0,
    pricingMode: "free",
    description: "Rychlá kontrola jedné klíčové stránky a tří největších bariér konverze.",
    features: ["Kontrola nabídky a CTA", "Mobilní zobrazení", "Stručné doporučení e-mailem"],
    cta: "Prověřit web zdarma",
    href: "/audit-zdarma",
  },
  ONYX_OS_AUDIT: {
    id: "onyx-os-audit",
    name: "ONYX OS Audit",
    priceInCzk: 4_900,
    pricingMode: "fixed",
    description: "Kompletní rozbor webu, funnelu, měření a práce s poptávkami.",
    features: ["Mapa slabých míst", "Prioritizovaný plán oprav", "60min konzultace", "Cena realizace předem"],
    cta: "Domluvit audit",
    href: "/dotaznik?zdroj=pricing&segment=audit",
  },
  ONYX_OS_SETUP: {
    id: "onyx-os-setup",
    name: "ONYX OS Setup",
    priceInCzk: 29_900,
    pricingMode: "from",
    description: "Realizace webu a obchodní infrastruktury podle schváleného rozsahu.",
    features: ["Konverzní web nebo landing page", "Formuláře a CRM", "Automatické reakce", "Měření kampaní"],
    cta: "Poptat realizaci",
    href: "/dotaznik?zdroj=pricing&segment=setup",
  },
  MONITORING: {
    id: "monitoring",
    name: "ONYX OS Monitoring",
    priceInCzk: 1_999,
    pricingMode: "fixed",
    billingPeriod: "month",
    description: "Pravidelná kontrola provozu, výsledků a drobné optimalizace.",
    features: ["Měsíční kontrola funnelu", "Report poptávek", "Drobné úpravy", "Technický dohled"],
    cta: "Probrat monitoring",
    href: "/dotaznik?zdroj=pricing&segment=monitoring",
  },
} as const satisfies Record<string, CoreOffer>;

export const WEB_PACKAGES = {
  LITE_WEB: {
    name: "ONYX WEB Start",
    description: "Jedna přehledná stránka s nabídkou, kontaktem a základním měřením",
    priceInCzk: 3_490,
    depositPercentage: 30,
  },
  BASIC_WEB: {
    name: "ONYX WEB Business",
    description: "Firemní web s menu, ceníkem, službami nebo rezervací",
    priceInCzk: 4_999,
    depositPercentage: 30,
  },
  WEB_LEAD_GEN: {
    name: "ONYX WEB Poptávky",
    description: "Web navržený pro získávání a měření konkrétních poptávek",
    priceInCzk: 6_990,
    depositPercentage: 30,
  },
  WEB_AUTOMATION: {
    name: "ONYX WEB Automatizace",
    description: "Web s automatickou odpovědí a přehlednou správou zájemců",
    priceInCzk: 9_990,
    depositPercentage: 30,
  },
} as const;

export type WebPackageId = keyof typeof WEB_PACKAGES;

export type SolutionPackage = {
  id: "onyx-web" | "onyx-eshop";
  name: string;
  plainName: string;
  priceFromInCzk: number;
  priceToInCzk?: number;
  description: string;
  audience: string;
  features: readonly string[];
  cta: string;
  href: string;
};

export const SOLUTION_PACKAGES = {
  ONYX_WEB: {
    id: "onyx-web",
    name: "ONYX WEB",
    plainName: "Web pro získávání zákazníků",
    priceFromInCzk: WEB_PACKAGES.LITE_WEB.priceInCzk,
    priceToInCzk: WEB_PACKAGES.WEB_AUTOMATION.priceInCzk,
    description: "Přehledný web s nabídkou, menu, ceníkem, rezervací nebo formulářem podle vašeho podnikání.",
    audience: "Pro živnostníky, restaurace, kavárny, čajovny, salony, řemeslníky a menší firmy.",
    features: ["Mobilní web", "Jasná nabídka a kontakt", "Měření poptávek", "Možnost rezervace nebo menu"],
    cta: "Chci nový web",
    href: "/dotaznik?zdroj=pricing&segment=onyx-web",
  },
  ONYX_ESHOP: {
    id: "onyx-eshop",
    name: "ONYX E-SHOP",
    plainName: "Jednoduchý online prodej",
    priceFromInCzk: 14_900,
    description: "E-shop, ve kterém zákazník snadno najde produkt, objedná a zaplatí bez zbytečných kroků.",
    audience: "Pro menší obchody, lokální výrobce, gastro produkty, dárkové poukazy a rozvoz.",
    features: ["Produkty a varianty", "Košík a online platba", "Správa objednávek", "Měření prodeje"],
    cta: "Chci prodávat online",
    href: "/dotaznik?zdroj=pricing&segment=onyx-eshop",
  },
} as const satisfies Record<string, SolutionPackage>;

export type SolutionPackageId = keyof typeof SOLUTION_PACKAGES;

export const CHECKOUT_OFFER_IDS = [
  "ONYX_OS_AUDIT",
  "ONYX_OS_SETUP",
  "LITE_WEB",
  "BASIC_WEB",
  "WEB_LEAD_GEN",
  "WEB_AUTOMATION",
] as const;

export const CHECKOUT_OFFERS = {
  ONYX_OS_AUDIT: {
    name: CORE_OFFERS.ONYX_OS_AUDIT.name,
    description: CORE_OFFERS.ONYX_OS_AUDIT.description,
    priceInCzk: CORE_OFFERS.ONYX_OS_AUDIT.priceInCzk,
    depositPercentage: 100,
  },
  ONYX_OS_SETUP: {
    name: CORE_OFFERS.ONYX_OS_SETUP.name,
    description: CORE_OFFERS.ONYX_OS_SETUP.description,
    priceInCzk: CORE_OFFERS.ONYX_OS_SETUP.priceInCzk,
    depositPercentage: 30,
  },
  ...WEB_PACKAGES,
} as const;

export type CheckoutOfferId = keyof typeof CHECKOUT_OFFERS;

export function formatCzk(value: number) {
  return `${new Intl.NumberFormat("cs-CZ").format(value)} Kč`;
}

export function formatOfferPrice(offer: CoreOffer) {
  if (offer.pricingMode === "free") return "0 Kč";
  const prefix = offer.pricingMode === "from" ? "od " : "";
  const suffix = offer.billingPeriod === "month" ? " / měsíc" : "";
  return `${prefix}${formatCzk(offer.priceInCzk)}${suffix}`;
}

export function formatWebPackagePrice(packageId: WebPackageId, from = false) {
  return `${from ? "od " : ""}${formatCzk(WEB_PACKAGES[packageId].priceInCzk)}`;
}

export function formatSolutionPackagePrice(solution: SolutionPackage) {
  if (solution.priceToInCzk) {
    return `${new Intl.NumberFormat("cs-CZ").format(solution.priceFromInCzk)}–${formatCzk(solution.priceToInCzk)}`;
  }
  return `od ${formatCzk(solution.priceFromInCzk)}`;
}

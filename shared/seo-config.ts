export type RouteSeo = {
  title: string;
  description: string;
  noIndex?: boolean;
  schemaType?: "Service" | "OfferCatalog" | "WebPage";
};

export const ROUTE_SEO: Record<string, RouteSeo> = {
  "/": {
    title: "OPTIMATEO | Výkonnostní weby, CRM a automatizace",
    description: "Najdeme, kde váš web ztrácí zákazníky, a postavíme měřitelnou cestu od reklamy přes poptávku až po obchodní follow-up.",
  },
  "/pricing": {
    title: "Ceník služeb | OPTIMATEO",
    description: "Audit, implementace výkonnostního webu a CRM i průběžná optimalizace. Jasný rozsah a ceny bez skrytých položek.",
    schemaType: "OfferCatalog",
  },
  "/audit-zdarma": {
    title: "Mini audit webu zdarma | OPTIMATEO",
    description: "Zjistěte, kde váš web ztrácí poptávky. Krátký mini audit s konkrétním doporučením dalšího kroku zdarma.",
    schemaType: "Service",
  },
  "/web": {
    title: "Výkonnostní web pro firmy | OPTIMATEO",
    description: "Firemní web navržený pro získávání poptávek, napojený na měření, CRM a následnou péči o leady.",
    schemaType: "Service",
  },
  "/crm-lead-system": {
    title: "CRM a systém pro správu poptávek | OPTIMATEO",
    description: "Mějte každou poptávku, další krok a obchodní follow-up na jednom místě. CRM řešení pro malé firmy i B2B týmy.",
    schemaType: "Service",
  },
  "/ai-core": {
    title: "AI Core a AI Asistenti | OPTIMATEO",
    description: "AI Asistenti a automatizace propojené s webem, CRM a vašimi procesy. Praktické nasazení s jasným obchodním přínosem.",
    schemaType: "Service",
  },
  "/lp/zivnostnici": {
    title: "Web a více poptávek pro živnostníky | OPTIMATEO",
    description: "Rychlý web pro OSVČ a malé podnikání s jasnou nabídkou, přímým kontaktem a měřením reklam ze Skliku.",
    schemaType: "Service",
  },
  "/lp/remeslnici": {
    title: "Web a více poptávek pro řemeslníky | OPTIMATEO",
    description: "Web pro řemeslníky, který ukáže reference, přivede lokální poptávky a změří výkon reklamy ze Skliku.",
    schemaType: "Service",
  },
  "/lp/b2b": {
    title: "B2B lead generation, web a CRM | OPTIMATEO",
    description: "Měřitelný B2B akviziční systém od landing page přes kvalifikovaný lead až po obchodní follow-up.",
    schemaType: "Service",
  },
  "/lp/restaurace": {
    title: "Web, menu a rezervace pro restaurace | OPTIMATEO",
    description: "Web pro restaurace a bistra s přehledným menu, rezervacemi, otevírací dobou a měřením kampaní.",
    schemaType: "Service",
  },
  "/lp/kavarny": {
    title: "Web, menu a rezervace pro kavárny | OPTIMATEO",
    description: "Přehledný mobilní web pro kavárny, pražírny a cukrárny s nabídkou, akcemi, otevírací dobou a rezervací.",
    schemaType: "Service",
  },
  "/lp/cajovny": {
    title: "Web, nabídka a rezervace pro čajovny | OPTIMATEO",
    description: "Web pro čajovny a čajové obchody s nabídkou, programem, fotkami, kontaktem a jednoduchou rezervací.",
    schemaType: "Service",
  },
  "/lp/salony": {
    title: "Web a objednávky pro salony | OPTIMATEO",
    description: "Prezentace služeb, ceníku, recenzí a rychlého objednání pro salony, beauty služby a wellness.",
    schemaType: "Service",
  },
  "/lp/ecommerce": {
    title: "Prodejní landing pages pro e-commerce | OPTIMATEO",
    description: "Produktové landing pages s jasnou argumentací, konverzním CTA, retargetingem a měřením výkonu kampaně.",
    schemaType: "Service",
  },
  "/ochrana-osobnich-udaju": {
    title: "Ochrana osobních údajů | OPTIMATEO",
    description: "Informace o zpracování osobních údajů návštěvníků, zájemců a zákazníků OPTIMATEO.",
    schemaType: "WebPage",
  },
  "/cookies": {
    title: "Cookies a nastavení souhlasu | OPTIMATEO",
    description: "Přehled nezbytného úložiště, analytických a marketingových nástrojů používaných na webu OPTIMATEO.",
    schemaType: "WebPage",
  },
  "/obchodni-podminky": {
    title: "Obchodní podmínky | OPTIMATEO",
    description: "Podmínky poskytování auditů, webů, CRM, automatizací a souvisejících digitálních služeb OPTIMATEO.",
    schemaType: "WebPage",
  },
  "/demo": {
    title: "Ukázky řešení | OPTIMATEO",
    description: "Demonstrační koncepty webů pro vybrané obory. Nejde o klientské reference.",
    noIndex: true,
  },
  "/dotaznik": {
    title: "Poptávkový dotazník | OPTIMATEO",
    description: "Podklady pro nezávazný návrh webu, CRM nebo automatizace.",
    noIndex: true,
  },
  "/admin": { title: "Administrace | OPTIMATEO", description: "Interní administrace OPTIMATEO.", noIndex: true },
  "/admin/invoices": { title: "Faktury | OPTIMATEO", description: "Interní správa faktur.", noIndex: true },
  "/admin/projects": { title: "Projekty | OPTIMATEO", description: "Interní správa projektů.", noIndex: true },
  "/dashboard": { title: "Klientský portál | OPTIMATEO", description: "Zabezpečený klientský portál.", noIndex: true },
  "/agents": { title: "AI Asistenti | OPTIMATEO", description: "Interní nástroje AI Asistentů.", noIndex: true },
  "/ibots": { title: "AI Asistenti | OPTIMATEO", description: "Interní katalog AI Asistentů.", noIndex: true },
  "/ab-testing": { title: "A/B test | OPTIMATEO", description: "Interní přehled experimentu.", noIndex: true },
  "/payment-success": { title: "Potvrzení platby | OPTIMATEO", description: "Potvrzení stavu platby.", noIndex: true },
  "/payment-cancel": { title: "Platba zrušena | OPTIMATEO", description: "Informace o zrušené platbě.", noIndex: true },
  "/v/reality": { title: "Ukázka pro reality | OPTIMATEO", description: "Demonstrační oborová stránka.", noIndex: true },
  "/v/kliniky": { title: "Ukázka pro kliniky | OPTIMATEO", description: "Demonstrační oborová stránka.", noIndex: true },
  "/v/sluzby": { title: "Ukázka pro služby | OPTIMATEO", description: "Demonstrační oborová stránka.", noIndex: true },
  "/404": { title: "Stránka nenalezena | OPTIMATEO", description: "Požadovaná stránka nebyla nalezena.", noIndex: true },
};

export const DEFAULT_SEO = ROUTE_SEO["/"];

/**
 * Audit Lead Nurture Sequence Generator
 * Generates the 4-step follow-up email sequence for audit leads.
 * Inspired by the high-conversion email launch framework:
 * Step 1: Initial mini-audit result (3-5 concrete findings)
 * Step 2: Business & ROI impact (revenue leakage calculation)
 * Step 3: Fix Sprint & ONYX WEB package proposal (9,900 / 24,900 CZK)
 * Step 4: Final consultation call invitation
 */

export interface AuditLeadData {
  webUrl: string;
  email: string;
  name?: string;
  businessType?: string;
  mainGoal?: string;
}

export interface EmailStep {
  step: number;
  sendDelayHours: number;
  subject: string;
  body: string;
}

export function generateAuditNurtureSequence(data: AuditLeadData): EmailStep[] {
  const web = data.webUrl || "vašem webu";
  const name = data.name || "Dobrý den";
  const obor = data.businessType ? `pro ${data.businessType}` : "";

  return [
    {
      step: 1,
      sendDelayHours: 0,
      subject: `[Audit] 5 konkrétních zjištění pro ${web}`,
      body: `${name},\n\nděkujeme za žádost o bezplatný audit webu ${web}. Náš tým provedl ruční QA analýzu konverzí, SEO a mobilního zobrazení.\n\nZde jsou první 3 zásadní oblasti, kde váš web ztrácí poptávky:\n1. Výzva k akci (CTA) – Kontaktní tlačítko je schované pod ohybem na mobilu.\n2. Rychlost a responzivita – Načítání blokují neoptimalizované obrázky.\n3. Formulář – Vyžaduje příliš mnoho nepovinných polí před prvním kontaktem.\n\nBěhem 24 hodin vám zašleme kompletní přehled s konkrétními opravami.\n\nS pozdravem,\nTým OPTIMATEO / ONYX WEB`,
    },
    {
      step: 2,
      sendDelayHours: 24,
      subject: `Kolik poptávek ročně ztrácí ${web}?`,
      body: `${name},\n\npodle našich měření ztrácí běžný web ${obor} 30–50 % potenciálních poptávek jen kvůli nepřehlednému mobilnímu zobrazení a pomalému formuláři.\n\nPokud získáte i jen 1 nového klienta měsíčně navíc, investice do správně nastaveného webu se vám vrátí během prvních týdnů.\n\nChcete vědět, jak tyto bariéry odstranit bez nutnosti stavět nový web od nuly?\n\nS pozdravem,\nOPTIMATEO`,
    },
    {
      step: 3,
      sendDelayHours: 48,
      subject: `Návrh řešení: Fix Sprint nebo ONYX WEB pro ${web}`,
      body: `${name},\n\na základě auditu jsme připravili 2 konkrétní možnosti opravy:\n\n1. Fix Sprint (9 900 Kč) – Rychlá oprava konverzních bariér, mobilu a formulářů na stávajícím webu do 5 dnů.\n2. ONYX WEB (24 900 Kč) – Kompletní nový konverzní web + napojení na CRM a automatické odpovídání.\n\nKterá varianta dává pro ${web} větší smysl?\n\nS pozdravem,\nOPTIMATEO`,
    },
    {
      step: 4,
      sendDelayHours: 72,
      subject: `Poslední krok: 15minutová konzultace auditu ${web}`,
      body: `${name},\n\nrádi s vámi výsledky auditu ${web} projdem živě během 15minutového hovoru. Ukážeme vám přesně, co a jak upravit.\n\nKdy by se vám hodila krátká konzultace? Stačí odpovědět na tento e-mail nebo si vybrat termín v našem kalendáři.\n\nHezký den,\nOPTIMATEO`,
    },
  ];
}

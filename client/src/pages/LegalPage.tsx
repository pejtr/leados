import { useLocation } from "wouter";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { activeConfig } from "@shared/brand-config";

const updatedAt = "14. 7. 2026";

function Identity() {
  const billing = activeConfig.billingInfo;
  return (
    <address className="not-italic">
      <strong>{activeConfig.legalName}</strong><br />
      IČO: {billing.companyId}<br />
      {billing.street}, {billing.postalCode} {billing.city}, {billing.region}<br />
      {billing.country}<br />
      E-mail: <a href={"mailto:" + billing.email}>{billing.email}</a>
    </address>
  );
}

function PrivacyContent() {
  return (
    <>
      <h1>Zásady ochrany osobních údajů</h1>
      <p>Tyto zásady vysvětlují, jak OPTIMATEO zpracovává osobní údaje návštěvníků webu, zájemců a zákazníků.</p>

      <h2>1. Správce údajů</h2>
      <Identity />

      <h2>2. Jaké údaje a proč zpracováváme</h2>
      <ul>
        <li><strong>Poptávky, mini audit a rezervace hovoru:</strong> jméno, e-mail, volitelně telefon, firma nebo obor, URL webu, odpovědi z formuláře, zvolený termín a zdroj poptávky. Účelem je odpovědět, připravit návrh a provést kroky před uzavřením smlouvy.</li>
        <li><strong>Objednávky a realizace:</strong> kontaktní, smluvní, fakturační a projektové údaje. Zpracování je nutné pro plnění smlouvy a zákonných povinností.</li>
        <li><strong>Platby:</strong> číslo objednávky, stav a identifikátor platby. Údaje o kartě zpracovává Stripe; OPTIMATEO je neukládá.</li>
        <li><strong>Účet a zákaznický portál:</strong> identifikace účtu, přihlášení, objednávky, projekty a komunikace potřebná pro provoz služby.</li>
        <li><strong>Bezpečnost a provoz:</strong> technické logy, IP adresa, typ zařízení a chybové záznamy v nezbytném rozsahu. Právním základem je oprávněný zájem na bezpečném a spolehlivém provozu.</li>
        <li><strong>Analytika a reklama:</strong> návštěvy, kampaňové parametry a konverzní události pouze po udělení příslušného souhlasu v nastavení cookies.</li>
      </ul>
      <p>Povinná pole jsou označena ve formuláři. Bez nich nelze poptávku nebo objednávku vyřídit. Ostatní údaje jsou dobrovolné.</p>

      <h2>3. Příjemci a dodavatelé</h2>
      <p>Údaje mohou v nezbytném rozsahu zpracovávat poskytovatelé hostingu, databáze, e-mailové komunikace a automatizace, poskytovatel plateb Stripe a účetní či právní dodavatelé. Reklamní platformy Seznam.cz, Google, Meta a LinkedIn dostanou data pouze tehdy, pokud je příslušný nástroj skutečně nasazen a návštěvník udělil odpovídající souhlas.</p>
      <p>Někteří dodavatelé mohou údaje zpracovávat mimo Evropský hospodářský prostor. V takovém případě se předání řídí mechanismy uznanými GDPR a podmínkami daného poskytovatele.</p>

      <h2>4. Doba uchování</h2>
      <ul>
        <li>neuzavřené poptávky nejdéle 24 měsíců od poslední komunikace, pokud není nutné uchování kvůli právnímu nároku;</li>
        <li>smluvní a projektové údaje po dobu trvání vztahu a následně po dobu potřebnou k ochraně právních nároků;</li>
        <li>účetní a daňové doklady po zákonem stanovenou dobu;</li>
        <li>bezpečnostní logy standardně nejdéle 90 dnů, déle pouze při řešení incidentu;</li>
        <li>marketingová a analytická data podle nastavení souhlasu a pravidel uvedených na stránce Cookies.</li>
      </ul>

      <h2>5. Vaše práva</h2>
      <p>Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost, námitku proti zpracování založenému na oprávněném zájmu a odvolání souhlasu. Žádost pošlete na <a href={"mailto:" + activeConfig.billingInfo.email}>{activeConfig.billingInfo.email}</a>. Máte také právo podat stížnost u <a href="https://uoou.gov.cz/" rel="noreferrer">Úřadu pro ochranu osobních údajů</a>.</p>

      <h2>6. Automatizované rozhodování</h2>
      <p>OPTIMATEO nepoužívá osobní údaje k rozhodnutí, které by pro vás mělo právní nebo obdobně významný účinek bez lidského posouzení. AI Asistenti mohou pomoci s přípravou podkladů, konečný obchodní a projektový krok však potvrzuje člověk.</p>
    </>
  );
}

function CookiesContent() {
  return (
    <>
      <h1>Cookies a podobné technologie</h1>
      <p>Tato stránka popisuje cookies, místní úložiště prohlížeče a měřicí nástroje používané na webu OPTIMATEO.</p>

      <h2>1. Nezbytné a uživatelem vyžádané úložiště</h2>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>Název / oblast</th><th>Účel</th><th>Uchování</th></tr></thead>
          <tbody>
            <tr><td>Nastavení souhlasu</td><td>Uchová zvolená pravidla pro analytiku a marketing.</td><td>12 měsíců při souhlasu, 6 měsíců při odmítnutí.</td></tr>
            <tr><td>Rozepsaný dotazník</td><td>Automatické uložení odpovědí, které uživatel začal vyplňovat.</td><td>Do odeslání, ručního smazání dat webu nebo přepsání novým návrhem.</td></tr>
            <tr><td>Přihlášení a bezpečnost</td><td>Udržení zabezpečené relace zákaznického či administrátorského účtu.</td><td>Podle délky relace a nastavení přihlášení.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>2. Analytika a marketing</h2>
      <p>Následující nástroje jsou ve výchozím stavu vypnuté. Načtou se pouze po souhlasu s odpovídající kategorií a jen pokud je na webu nastaven jejich platný identifikátor.</p>
      <ul>
        <li><strong>Google Analytics / Google Ads:</strong> návštěvnost, cesta webem, A/B varianta a konverze.</li>
        <li><strong>Sklik:</strong> retargeting a měření skutečných poptávek nebo zaplacených objednávek.</li>
        <li><strong>LinkedIn Insight Tag:</strong> B2B atribuce, retargeting a měření konverzí.</li>
        <li><strong>Meta:</strong> reklamní atribuce a retargeting, pokud bude Meta Pixel aktivně nasazen.</li>
      </ul>
      <p>Kampaňové parametry a anonymní identifikátor A/B testu se do trvalého úložiště ukládají pouze při souhlasu s analytikou. Bez souhlasu se použije výchozí varianta stránky a analytické události se neodesílají.</p>

      <h2>3. Změna nebo odvolání souhlasu</h2>
      <p>Volbu můžete kdykoli změnit tlačítkem <strong>Nastavení cookies</strong> v levém dolním rohu. Odmítnutí je stejně dostupné jako přijetí. Po odvolání se nepovinné skripty vypnou; dřívější zákonné zpracování tím není dotčeno.</p>

      <h2>4. Další informace</h2>
      <p>Podrobnosti o zpracování a vašich právech najdete v <a href="/ochrana-osobnich-udaju">zásadách ochrany osobních údajů</a>. Obecné informace ke cookies zveřejňuje také <a href="https://uoou.gov.cz/verejnost/qa-otazky-a-odpovedi/cookies" rel="noreferrer">Úřad pro ochranu osobních údajů</a>.</p>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <h1>Obchodní podmínky</h1>
      <p>Tyto podmínky upravují poskytování auditů, webů, CRM, automatizací, podpory a souvisejících digitálních služeb OPTIMATEO.</p>

      <h2>1. Poskytovatel</h2>
      <Identity />

      <h2>2. Poptávka a uzavření smlouvy</h2>
      <p>Odeslání formuláře, rezervace hovoru ani mini audit samy o sobě nejsou objednávkou. Poskytovatel nejprve upřesní rozsah, cenu, harmonogram a potřebnou součinnost. Smlouva vzniká písemným přijetím konkrétní nabídky zákazníkem nebo úhradou platebního odkazu, který na schválenou nabídku výslovně navazuje.</p>

      <h2>3. Cena a platba</h2>
      <p>Cena je uvedena v potvrzené nabídce. Není-li dohodnuto jinak, jednorázová realizace se hradí zálohou uvedenou v platebním odkazu a doplatkem po předání sjednaného výstupu. Poskytovatel není plátcem DPH. Poplatky třetích stran, zejména doména, externí licence, reklamní rozpočet nebo placené integrace, jsou součástí ceny jen tehdy, pokud to nabídka výslovně uvádí.</p>

      <h2>4. Termín a součinnost</h2>
      <p>Realizace začne po přijetí sjednané platby, dodání podkladů a potvrzení rozsahu. Termín se přiměřeně posouvá o dobu, kdy zákazník neposkytuje potřebné podklady, přístupy nebo zpětnou vazbu. Změna rozsahu se nejprve nacení a potvrdí.</p>

      <h2>5. Předání, vady a podpora</h2>
      <p>Zákazník zkontroluje výstup bez zbytečného odkladu a popíše konkrétní nesoulad se schváleným rozsahem. Poskytovatel odstraní oprávněnou vadu v přiměřené době podle její povahy. Rozvojové požadavky a změny nad schválený rozsah nejsou vadou a řeší se samostatnou dohodou.</p>

      <h2>6. Licence a podklady zákazníka</h2>
      <p>Zákazník odpovídá za to, že smí použít dodané texty, fotografie, loga, databáze a přístupy. Práva k výstupu a podmínky předání zdrojových souborů se řídí konkrétní nabídkou. Licence třetích stran zůstávají v režimu jejich vlastních podmínek.</p>

      <h2>7. Dostupnost externích služeb</h2>
      <p>Funkce závislé na hostingu, platební bráně, reklamních platformách, komunikačních službách nebo API třetích stran mohou být ovlivněny jejich výpadkem či změnou podmínek. Poskytovatel takovou situaci řeší s odbornou péčí, nemůže však garantovat nepřetržitý provoz služby, kterou nekontroluje.</p>

      <h2>8. Zrušení a ukončení</h2>
      <p>Podmínky zrušení projektu se řídí potvrzenou nabídkou a rozsahem již provedených prací. Při ukončení se vyúčtuje prokazatelně provedená část a schválené náklady třetích stran. Tím nejsou omezena práva, která nelze podle zákona vyloučit.</p>

      <h2>9. Spotřebitelé</h2>
      <p>Služby jsou nabízeny především podnikatelům. Pokud zákazník jedná jako spotřebitel, zůstávají mu zachována všechna zákonná práva. U smlouvy uzavřené na dálku má spotřebitel zpravidla právo odstoupit do 14 dnů. Poskytování služby před uplynutím této lhůty začne jen na jeho výslovnou žádost a po příslušném poučení; může pak hradit poměrnou část již poskytnutého plnění. Oznámení o odstoupení lze poslat na kontaktní e-mail poskytovatele.</p>

      <h2>10. Závěrečná ustanovení</h2>
      <p>Právní vztah se řídí právem České republiky. Strany se nejprve pokusí spor vyřešit dohodou. Spotřebitel se může obrátit také na <a href="https://coi.gov.cz/informace-o-adr/" rel="noreferrer">Českou obchodní inspekci</a> jako subjekt mimosoudního řešení spotřebitelských sporů.</p>
    </>
  );
}

const PAGE_CONTENT = {
  "/ochrana-osobnich-udaju": <PrivacyContent />,
  "/cookies": <CookiesContent />,
  "/obchodni-podminky": <TermsContent />,
} as const;

export default function LegalPage() {
  const [location] = useLocation();
  const content = PAGE_CONTENT[location as keyof typeof PAGE_CONTENT] ?? PAGE_CONTENT["/ochrana-osobnich-udaju"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <a href="/" aria-label="OPTIMATEO - hlavní stránka"><OptimateoLogo className="h-8" /></a>
          <a href="/" className="text-sm font-semibold text-slate-600 hover:text-violet-700">Zpět na web</a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <article className="legal-content rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {content}
          <p className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-500">Poslední aktualizace: {updatedAt}</p>
        </article>
        <nav className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-600" aria-label="Právní dokumenty">
          <a href="/ochrana-osobnich-udaju" className="hover:text-violet-700">Ochrana osobních údajů</a>
          <a href="/cookies" className="hover:text-violet-700">Cookies</a>
          <a href="/obchodni-podminky" className="hover:text-violet-700">Obchodní podmínky</a>
        </nav>
      </main>
    </div>
  );
}

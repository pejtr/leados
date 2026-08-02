import { ArrowRight, Bot, Check, Database, LineChart, MessageSquare, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { activeConfig } from "@shared/brand-config";
import { CORE_OFFERS, SERVICE_TERMS, formatOfferPrice } from "@shared/service-catalog";

const capabilities = [
  {
    icon: MessageSquare,
    title: "Práce s poptávkami",
    description: "Formulář, CRM a navazující kroky drží každý lead v jednom měřitelném procesu.",
  },
  {
    icon: Workflow,
    title: "Automatické follow-upy",
    description: "Rutinní reakce a upozornění se spustí podle jasných pravidel a obchodního stavu.",
  },
  {
    icon: Bot,
    title: "AI Asistenti",
    description: "Asistenti pomáhají s obsahem, přípravou odpovědí a opakovanými úkoly v kontextu firmy.",
  },
  {
    icon: LineChart,
    title: "Reporting výsledků",
    description: "Vidíte zdroj poptávky, průchod funnelem a obchodní výsledek, ne pouze návštěvnost.",
  },
];

const process = [
  {
    step: "01",
    title: CORE_OFFERS.MINI_AUDIT.name,
    price: formatOfferPrice(CORE_OFFERS.MINI_AUDIT),
    description: "Prověříme nejslabší místo současného webu a doporučíme nejmenší smysluplný další krok.",
  },
  {
    step: "02",
    title: CORE_OFFERS.ONYX_OS_AUDIT.name,
    price: formatOfferPrice(CORE_OFFERS.ONYX_OS_AUDIT),
    description: `Zmapujeme proces, data a integrace. Součástí je ${SERVICE_TERMS.auditConsultationMinutes}min konzultace a prioritizovaný plán.`,
  },
  {
    step: "03",
    title: CORE_OFFERS.ONYX_OS_SETUP.name,
    price: formatOfferPrice(CORE_OFFERS.ONYX_OS_SETUP),
    description: "Nasadíme odsouhlasený web, CRM, automatizace a měření podle písemného rozsahu.",
  },
  {
    step: "04",
    title: CORE_OFFERS.MONITORING.name,
    price: formatOfferPrice(CORE_OFFERS.MONITORING),
    description: "Kontrolujeme provoz, kvalitu funnelu a postupně zlepšujeme slabá místa.",
  },
];

const checks = [
  "Kde vzniká a kam se ukládá poptávka",
  "Kdo a za jak dlouho provede další krok",
  "Které činnosti lze bezpečně automatizovat",
  "Jak se změří kvalifikovaný lead a obchodní výsledek",
  "Jaká data smí používat AI Asistenti",
  "Co zůstane pod ruční kontrolou týmu",
];

const faqs = [
  {
    question: "Je AI Core samostatný software?",
    answer: "AI Core je označení pro vrstvu AI Asistentů a automatizací uvnitř řešení ONYX OS. Dodavatelem a smluvním partnerem je vždy OPTIMATEO.",
  },
  {
    question: "Musíme měnit celý současný web?",
    answer: "Ne. Audit určí, zda dává smysl upravit současný web, doplnit landing page, nebo postavit nový proces. Rozsah znáte před realizací.",
  },
  {
    question: "Co se stane s našimi daty?",
    answer: "Před nasazením definujeme zdroje dat, přístupy a odpovědnosti. Citlivé kroky a obchodní rozhodnutí mohou zůstat pod ručním schválením.",
  },
  {
    question: "Jak rychle lze řešení nasadit?",
    answer: `Menší webový balíček obvykle trvá ${SERVICE_TERMS.typicalWebDeliveryWeeks} týdny. Komplexní Setup má harmonogram podle auditu a schváleného rozsahu.`,
  },
];

export default function AiCorePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" aria-label="OPTIMATEO"><OptimateoLogo className="h-8" light /></a>
          <a href={CORE_OFFERS.MINI_AUDIT.href}>
            <Button className="rounded-full bg-white text-slate-950 hover:bg-slate-100">{CORE_OFFERS.MINI_AUDIT.cta}</Button>
          </a>
        </div>
      </nav>

      <section className="border-b border-white/10 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <p className="text-sm font-bold uppercase tracking-wider text-cyan-300">OPTIMATEO · ONYX OS · AI Core</p>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">Web, CRM a AI Asistenti v jednom měřitelném obchodním procesu.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">OPTIMATEO navrhne zákaznickou cestu. ONYX OS propojí data a nástroje. AI Core pomáhá s opakovanými úkoly, aniž by tým ztratil kontrolu.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={CORE_OFFERS.MINI_AUDIT.href}>
              <Button size="lg" className="w-full rounded-full bg-violet-600 px-8 font-bold text-white hover:bg-violet-500 sm:w-auto">{CORE_OFFERS.MINI_AUDIT.cta}<ArrowRight className="ml-2 h-4 w-4" /></Button>
            </a>
            <a href="/demo">
              <Button size="lg" variant="outline" className="w-full rounded-full border-white/20 bg-white/5 px-8 text-white hover:bg-white/10 sm:w-auto">Prohlédnout ukázky</Button>
            </a>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-cyan-300">Konkrétní použití</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Nejdřív proces, potom technologie</h2>
            <p className="mt-4 leading-7 text-slate-400">Nasazujeme jen části, které mají vlastníka, vstupní data a měřitelný výsledek.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {capabilities.map(item => (
              <article key={item.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
                <item.icon className="h-7 w-7 text-cyan-300" />
                <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-400">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-wider text-violet-300">Jednotná nabídka</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Od ověření problému k provozu</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {process.map(item => (
              <article key={item.step} className="rounded-lg border border-white/10 bg-slate-950 p-6">
                <span className="text-sm font-black text-violet-300">{item.step}</span>
                <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                <p className="mt-2 font-bold text-cyan-300">{item.price}</p>
                <p className="mt-4 text-sm leading-6 text-slate-400">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center sm:px-6">
          <div>
            <Database className="h-9 w-9 text-cyan-300" />
            <h2 className="mt-5 text-3xl font-black">Co ověříme před nasazením</h2>
            <p className="mt-4 leading-7 text-slate-400">Toto je kontrolní seznam skutečného návrhu, ne ukázkové procento nebo neověřený příběh zákazníka.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {checks.map(item => (
              <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold leading-6 text-slate-200">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />{item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-3xl font-black">Časté otázky</h2>
          <div className="mt-8 space-y-3">
            {faqs.map(item => (
              <details key={item.question} className="group rounded-lg border border-white/10 bg-slate-950 p-5">
                <summary className="cursor-pointer list-none font-bold">{item.question}</summary>
                <p className="mt-4 leading-7 text-slate-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-black sm:text-4xl">Začněte ověřením současného webu</h2>
          <p className="mt-4 text-lg leading-8 text-slate-400">Do {SERVICE_TERMS.miniAuditDeliveryHours} hodin dostanete první konkrétní zjištění a doporučený další krok.</p>
          <a href={CORE_OFFERS.MINI_AUDIT.href} className="mt-8 inline-flex items-center rounded-full bg-white px-8 py-3 font-bold text-slate-950 hover:bg-slate-100">{CORE_OFFERS.MINI_AUDIT.cta}<ArrowRight className="ml-2 h-4 w-4" /></a>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-slate-500">© 2026 OPTIMATEO · {activeConfig.legalName} · IČO {activeConfig.billingInfo.companyId}</footer>
    </main>
  );
}

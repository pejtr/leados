import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useLocation } from "wouter";
import {
  FileText, ShoppingCart, Map, Target, Users, Code, Brain,
  ChevronRight, Calculator, TrendingUp, Clock, CheckCircle2,
  ArrowRight, Zap, Star
} from "lucide-react";

const SERVICES = [
  {
    id: "faktury",
    icon: FileText,
    emoji: "🧾",
    title: "Faktury & Účetnictví",
    subtitle: "Automatizace zpracování faktur",
    color: "oklch(0.68_0.18_162)",
    colorBg: "oklch(0.68_0.18_162_/_10%)",
    colorBorder: "oklch(0.68_0.18_162_/_25%)",
    problem: "Trávíte hodiny ručním zpracováním faktur z e-mailů?",
    features: [
      "Automatické stahování faktur z e-mailů (Gmail, Outlook)",
      "Roztřídění do složek v Google Drive / OneDrive",
      "Zápis do přehledné tabulky s DPH a kategoriemi",
      "Upozornění na splatnost a duplicity",
    ],
    savings: "3-5 hodin/týden",
    roi: "Ušetříte 12-20 hod/měsíc × hodinová sazba",
    available: false,
    cta: "Mám zájem",
    link: "/chat-agent",
  },
  {
    id: "eshop",
    icon: ShoppingCart,
    emoji: "🛒",
    title: "E-shop Automatizace",
    subtitle: "Naskladňování, popisy, SEO",
    color: "oklch(0.72_0.18_60)",
    colorBg: "oklch(0.72_0.18_60_/_10%)",
    colorBorder: "oklch(0.72_0.18_60_/_25%)",
    problem: "Přidávání produktů zabere celý den a popisy jsou generické?",
    features: [
      "Automatické naskladňování produktů z ceníků dodavatelů",
      "AI tvorba unikátních popisků přizpůsobených vaší značce",
      "SEO analýza a optimalizace produktových stránek",
      "Sledování konkurenčních cen v reálném čase",
    ],
    savings: "5-8 hodin/týden",
    roi: "Více organické návštěvnosti = více prodejů",
    available: false,
    cta: "Mám zájem",
    link: "/chat-agent",
  },
  {
    id: "zmapovani",
    icon: Map,
    emoji: "🗺️",
    title: "Zmapování Byznysu",
    subtitle: "Firemní kontext + AI automatizace",
    color: "oklch(0.55_0.20_192)",
    colorBg: "oklch(0.55_0.20_192_/_10%)",
    colorBorder: "oklch(0.55_0.20_192_/_25%)",
    problem: "Nevíte kde začít s AI automatizací ve vaší firmě?",
    features: [
      "Tvorba firemního AI kontextu (strategie, procesy, ICP)",
      "AI navrhne konkrétní automatizace pro váš byznys",
      "Výpočet návratnosti investice pro každou automatizaci",
      "Prioritizovaný plán implementace",
    ],
    savings: "Základ pro vše ostatní",
    roi: "Průměrná firma ušetří 15-30 hod/měsíc po zmapování",
    available: true,
    cta: "Zmapovat byznys",
    link: "/icp",
  },
  {
    id: "obchod",
    icon: Target,
    emoji: "🎯",
    title: "Obchod & Lead Generation",
    subtitle: "Vyhledávání a oslovování klientů",
    color: "oklch(0.65_0.22_30)",
    colorBg: "oklch(0.65_0.22_30_/_10%)",
    colorBorder: "oklch(0.65_0.22_30_/_25%)",
    problem: "Obchodníci tráví 80% času výzkumem, ne prodejem?",
    features: [
      "Vyhledávání kontaktů z Google Maps, LinkedIn, ARES",
      "Prohledání obchodního rejstříku ČR (ARES API)",
      "Personalizované e-maily a LinkedIn zprávy s AI",
      "Automatické follow-up sekvence",
    ],
    savings: "80% méně času na výzkum",
    roi: "1 uzavřený deal navíc/měsíc pokryje 12 měsíců LeadOS",
    available: true,
    cta: "Generovat leady",
    link: "/generate",
  },
  {
    id: "tym",
    icon: Users,
    emoji: "👥",
    title: "Efektivnější Tým",
    subtitle: "Přepis hovorů, úkoly, termíny",
    color: "oklch(0.55_0.24_278)",
    colorBg: "oklch(0.55_0.24_278_/_10%)",
    colorBorder: "oklch(0.55_0.24_278_/_25%)",
    problem: "Důležité informace z hovorů se ztrácejí a úkoly se nestíhají?",
    features: [
      "Automatický přepis interních i klientských hovorů",
      "AI analýza hovoru a automatické zadání úkolů",
      "Hlídání termínů a připomínky pro celý tým",
      "Přehled kdo na čem pracuje v reálném čase",
    ],
    savings: "2-3 hodiny/týden na administrativu",
    roi: "Žádné propadlé úkoly = spokojení klienti",
    available: true,
    cta: "Spravovat tým",
    link: "/tasks",
  },
  {
    id: "software",
    icon: Code,
    emoji: "💻",
    title: "Vlastní Software",
    subtitle: "Aplikace na míru vašemu byznysu",
    color: "oklch(0.60_0.20_300)",
    colorBg: "oklch(0.60_0.20_300_/_10%)",
    colorBorder: "oklch(0.60_0.20_300_/_25%)",
    problem: "Existující software vám nevyhovuje a Excel nestačí?",
    features: [
      "Tvorba webové aplikace přesně pro váš byznys",
      "Napojení na vaše stávající systémy a data",
      "Celý proces se zrychlí, pokud máte sepsaný kontext firmy",
      "Průběžné úpravy a rozšiřování podle potřeb",
    ],
    savings: "Závisí na projektu",
    roi: "Vlastní software = konkurenční výhoda",
    available: false,
    cta: "Konzultace zdarma",
    link: "/chat-agent",
  },
  {
    id: "mozek",
    icon: Brain,
    emoji: "🧠",
    title: "Druhý Mozek Firmy",
    subtitle: "AI strategický partner pro rozhodování",
    color: "oklch(0.68_0.18_162)",
    colorBg: "oklch(0.68_0.18_162_/_10%)",
    colorBorder: "oklch(0.68_0.18_162_/_25%)",
    problem: "Rozhodujete se podle pocitu, ne podle dat?",
    features: [
      "Nahrání strategie, čísel a procesů do AI kontextu",
      "Napojení reálných dat (tržby, leady, konverze)",
      "AI strategický partner pro klíčová rozhodnutí",
      "Denní briefing s doporučeními co dělat dnes",
    ],
    savings: "Lepší rozhodnutí = méně chyb",
    roi: "1 správné strategické rozhodnutí pokryje roky předplatného",
    available: true,
    cta: "Aktivovat AI poradce",
    link: "/ai-advisor",
  },
];

function RoiCalculator() {
  const [hourlyRate, setHourlyRate] = useState(500);
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [dealsPerMonth, setDealsPerMonth] = useState(1);
  const [dealValue, setDealValue] = useState(50000);

  const monthlySavings = hourlyRate * hoursPerWeek * 4;
  const monthlyRevenue = dealsPerMonth * dealValue;
  const totalMonthlyValue = monthlySavings + monthlyRevenue;
  const yearlyValue = totalMonthlyValue * 12;
  const leadosCost = 3588; // 299 Kč/měsíc × 12
  const roi = Math.round((yearlyValue / leadosCost) * 100);

  return (
    <div className="rounded-2xl border border-[oklch(0.68_0.18_162_/_30%)] bg-[oklch(0.68_0.18_162_/_5%)] p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-[oklch(0.68_0.18_162_/_15%)]">
          <Calculator className="h-5 w-5 text-[oklch(0.68_0.18_162)]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Kalkulačka ROI</h3>
          <p className="text-sm text-muted-foreground">Spočítejte si návratnost investice do LeadOS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Vaše parametry</h4>
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Hodinová sazba (Kč)</label>
            <div className="flex items-center gap-3">
              <input
                type="range" min="200" max="2000" step="50"
                value={hourlyRate}
                onChange={e => setHourlyRate(Number(e.target.value))}
                className="flex-1 accent-[oklch(0.68_0.18_162)]"
              />
              <span className="text-sm font-bold text-foreground w-20 text-right">{hourlyRate.toLocaleString("cs-CZ")} Kč</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ušetřené hodiny/týden díky automatizaci</label>
            <div className="flex items-center gap-3">
              <input
                type="range" min="1" max="20" step="1"
                value={hoursPerWeek}
                onChange={e => setHoursPerWeek(Number(e.target.value))}
                className="flex-1 accent-[oklch(0.68_0.18_162)]"
              />
              <span className="text-sm font-bold text-foreground w-20 text-right">{hoursPerWeek} hod/týden</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nové dealy/měsíc díky LeadOS</label>
            <div className="flex items-center gap-3">
              <input
                type="range" min="0" max="10" step="1"
                value={dealsPerMonth}
                onChange={e => setDealsPerMonth(Number(e.target.value))}
                className="flex-1 accent-[oklch(0.68_0.18_162)]"
              />
              <span className="text-sm font-bold text-foreground w-20 text-right">{dealsPerMonth} deal/měs</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Průměrná hodnota dealu (Kč)</label>
            <div className="flex items-center gap-3">
              <input
                type="range" min="5000" max="500000" step="5000"
                value={dealValue}
                onChange={e => setDealValue(Number(e.target.value))}
                className="flex-1 accent-[oklch(0.68_0.18_162)]"
              />
              <span className="text-sm font-bold text-foreground w-20 text-right">{(dealValue / 1000).toFixed(0)}k Kč</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Výsledek</h4>
          
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">Úspora na čase/měsíc</p>
            <p className="text-xl font-black text-foreground">{monthlySavings.toLocaleString("cs-CZ")} Kč</p>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">Nové tržby/měsíc</p>
            <p className="text-xl font-black text-foreground">{monthlyRevenue.toLocaleString("cs-CZ")} Kč</p>
          </div>
          
          <div className="p-4 rounded-xl bg-[oklch(0.68_0.18_162_/_10%)] border border-[oklch(0.68_0.18_162_/_30%)]">
            <p className="text-xs text-[oklch(0.68_0.18_162)] mb-1 font-semibold">Celková hodnota/rok</p>
            <p className="text-2xl font-black text-foreground">{yearlyValue.toLocaleString("cs-CZ")} Kč</p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.18_162_/_15%)] to-[oklch(0.55_0.20_192_/_15%)] border border-[oklch(0.68_0.18_162_/_30%)]">
            <p className="text-xs text-muted-foreground mb-1">ROI (vs. cena LeadOS {leadosCost.toLocaleString("cs-CZ")} Kč/rok)</p>
            <p className="text-3xl font-black text-[oklch(0.68_0.18_162)]">{roi.toLocaleString("cs-CZ")}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {roi > 1000 ? "🚀 Výjimečná návratnost" : roi > 500 ? "✅ Vynikající návratnost" : roi > 200 ? "👍 Dobrá návratnost" : "📊 Solidní návratnost"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: typeof SERVICES[0] }) {
  const [, setLocation] = useLocation();
  const Icon = service.icon;

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-4 transition-all hover:shadow-lg cursor-pointer group"
      style={{
        borderColor: service.colorBorder,
        backgroundColor: service.colorBg,
      }}
      onClick={() => setLocation(service.link)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: service.colorBg }}
          >
            <Icon className="h-5 w-5" style={{ color: service.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">{service.emoji} {service.title}</h3>
              {service.available ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[oklch(0.68_0.18_162_/_15%)] text-[oklch(0.68_0.18_162)] font-semibold">✓ Dostupné</span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">Brzy</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{service.subtitle}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
      </div>

      <p className="text-xs text-muted-foreground italic border-l-2 pl-3" style={{ borderColor: service.color }}>
        "{service.problem}"
      </p>

      <ul className="space-y-1.5">
        {service.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: service.color }} />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{service.savings}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{service.roi}</p>
        </div>
        <button
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
          style={{
            backgroundColor: service.colorBg,
            color: service.color,
            border: `1px solid ${service.colorBorder}`,
          }}
        >
          {service.cta} <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function Sluzby() {
  const [, setLocation] = useLocation();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.68_0.18_162_/_10%)] border border-[oklch(0.68_0.18_162_/_25%)] mb-4">
            <Zap className="h-3.5 w-3.5 text-[oklch(0.68_0.18_162)]" />
            <span className="text-xs font-semibold text-[oklch(0.68_0.18_162)]">7 oblastí automatizace</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">
            Druhý mozek vaší firmy
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            LeadOS není jen "lead gen nástroj". Je to komplexní AI operační systém, 
            který automatizuje klíčové procesy ve vaší firmě — od obchodu přes tým až po strategická rozhodnutí.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, label: "Průměrná úspora", value: "15-30 hod/měsíc" },
            { icon: Star, label: "ROI prvního roku", value: "300-1000%" },
            { icon: Zap, label: "Dostupné funkce", value: "5 ze 7 oblastí" },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 text-center">
              <stat.icon className="h-5 w-5 mx-auto mb-2 text-[oklch(0.68_0.18_162)]" />
              <p className="text-lg font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Services grid */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Oblasti automatizace</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {SERVICES.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>

        {/* ROI Calculator */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Spočítejte si návratnost</h2>
          <RoiCalculator />
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-[oklch(0.55_0.20_192_/_25%)] bg-gradient-to-br from-[oklch(0.55_0.20_192_/_8%)] to-[oklch(0.55_0.24_278_/_8%)] p-8 text-center">
          <h3 className="text-xl font-black text-foreground mb-2">Nevíte kde začít?</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
            Náš AI poradce HERMES vám pomůže identifikovat, které automatizace přinesou 
            vaší firmě největší hodnotu — a v jakém pořadí je implementovat.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setLocation("/roi-audit")}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-[oklch(0.68_0.18_162)] text-white hover:opacity-90 transition-opacity flex items-center gap-2 justify-center"
            >
              <Calculator className="h-4 w-4" />
              ROI Audit zdarma
            </button>
            <button
              onClick={() => setLocation("/chat-agent")}
              className="px-6 py-3 rounded-xl font-bold text-sm border border-[oklch(0.55_0.20_192_/_30%)] text-foreground hover:bg-[oklch(0.55_0.20_192_/_10%)] transition-colors flex items-center gap-2 justify-center"
            >
              <Brain className="h-4 w-4" />
              Konzultace s HERMES
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

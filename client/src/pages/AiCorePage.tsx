import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Check, X, ArrowRight, ChevronDown, Star, Shield, Clock, Sparkles,
  Calendar, Users, Database, Zap, Globe, ShoppingBag, Rocket, TrendingUp,
  Megaphone, MessageSquare,
} from "lucide-react";
import { OptivioLogo } from "@/components/OptivioLogo";
import { SalesChatWidget } from "@/components/SalesChatWidget";

// ─── Data ─────────────────────────────────────────────────────────────────────

const PAINS = [
  { t: "Platíte za každý nástroj zvlášť", d: "Booking, e-maily, chat, analytika, e-shop — pět faktur, a účet každý měsíc roste." },
  { t: "Data se nikde nepotkají", d: "Každá appka má vlastní login. Klient v jednom, objednávka ve druhém, e-mail ve třetím." },
  { t: "Nastavení zabere týdny", d: "Než to všechno propojíte a rozjedete, uteče měsíc — a to ještě musíte vědět jak." },
  { t: "Na marketing není čas ani člověk", d: "Reklamy, texty, e-maily děláte ad-hoc mezi prací. Nebo vůbec." },
  { t: "Děláte to bez systému", d: "Kampaně od oka, follow-upy z hlavy. Něco vyjde, něco zapadne." },
  { t: "Nevíte, co skutečně funguje", d: "Bez jednoho přehledu netušíte, odkud chodí zákazníci a co se vyplácí." },
];

const PILLARS = [
  { icon: <Calendar className="w-5 h-5" />, t: "Booking", d: "Rezervace a kapacity v reálném čase." },
  { icon: <Users className="w-5 h-5" />, t: "CRM", d: "360° pohled na klienta a jeho historii." },
  { icon: <Database className="w-5 h-5" />, t: "Data", d: "Reporting a predikce na jednom místě." },
  { icon: <Zap className="w-5 h-5" />, t: "Automatizace", d: "Asistenti na obsah, kampaně a rutinu." },
  { icon: <Globe className="w-5 h-5" />, t: "MCP / API", d: "Napojení na vaše stávající nástroje." },
];

const AGENTS = [
  { icon: "🧠", name: "Virtuální CMO", desc: "Orchestruje celý tým" },
  { icon: "✍️", name: "Copywriter", desc: "Ogilvy + Halbert styl" },
  { icon: "📧", name: "Email sekvence", desc: "Frank Kern přístup" },
  { icon: "🎯", name: "Landing Page", desc: "Hook–Story–Offer" },
  { icon: "🔍", name: "SEO obsah", desc: "E-E-A-T + konverze" },
  { icon: "📢", name: "Ads Expert", desc: "Meta + Google" },
  { icon: "🧲", name: "Lead Magnet", desc: "Budování databáze" },
  { icon: "🎙️", name: "Webinar Script", desc: "Perfect Webinar" },
];

const MODULES = [
  { icon: <Calendar className="w-5 h-5" />, t: "Rezervace", d: "Online booking a správa kapacit." },
  { icon: <MessageSquare className="w-5 h-5" />, t: "Komunikace", d: "E-maily, Telegram, WhatsApp." },
  { icon: <Megaphone className="w-5 h-5" />, t: "Marketing", d: "Meta/Google Ads, retargeting." },
  { icon: <ShoppingBag className="w-5 h-5" />, t: "Prodej", d: "E-shop, předplatné, upsell." },
  { icon: <Rocket className="w-5 h-5" />, t: "Prodejní web", d: "Funnel pro infoprodukty a kurzy." },
  { icon: <TrendingUp className="w-5 h-5" />, t: "Reporting", d: "Dashboardy, LTV, insights." },
];

const STEPS = [
  { n: "1", t: "Konzultace zdarma", d: "Projdeme váš proces a navrhneme, co dává smysl zapojit jako první." },
  { n: "2", t: "Zavedení na míru", d: "Systém nastavíme za vás — booking, CRM, kampaně i napojení nástrojů. Od 14 990 Kč jednorázově." },
  { n: "3", t: "Běží samo", d: "Asistenti pracují, systém sbírá data a stará se o rutinu i ve 3 ráno." },
  { n: "4", t: "Vy řídíte směr", d: "Řeknete CO chcete — systém ví JAK. Vy se díváte na výsledky." },
];

const COMPARISON = [
  { label: "Cena za provoz", core: "999 Kč/měs — vše v ceně", box: "Základ + příplatky 800–1 500 Kč", agency: "Desítky tisíc / měs" },
  { label: "Booking + CRM + marketing pohromadě", core: true, box: false, agency: "Záleží na dodavateli" },
  { label: "Tým asistentů (obsah, kampaně)", core: true, box: false, agency: "Za příplatek" },
  { label: "Nastavení za vás", core: true, box: "Většinou svépomocí", agency: true },
  { label: "Data zůstávají vaše", core: true, box: "Zamčená v platformě", agency: "Záleží na smlouvě" },
  { label: "Škálování o další moduly", core: "+290 Kč/měs za modul", box: "Další příplatky", agency: "Nová objednávka" },
];

const INCLUDED = [
  "Booking systém + správa kapacit",
  "CRM s 360° pohledem na klienta",
  "Data, reporting a predikce",
  "Asistenti — obsah, kampaně, rutina",
  "Prodejní web pro infoprodukty a kurzy",
  "MCP/API napojení na vaše nástroje",
  "2 moduly v ceně, další +290 Kč/měs",
  "Provoz, zálohy a podpora v ceně",
];

const CASES = [
  { tag: "Kavárna", color: "bg-amber-100 text-amber-800", metric: "+47 %", label: "více rezervací", quote: "Web nám přinesl zákazníky, které bychom jinak nikdy nezískali. Vrátil se nám za 3 týdny.", author: "Petra Svobodová", role: "Kavárna Espresso, Praha" },
  { tag: "Řemeslník", color: "bg-blue-100 text-blue-800", metric: "3×", label: "více zakázek", quote: "Investice se mi vrátila z první zakázky. Teď mám práci na 3 měsíce dopředu.", author: "Jiří Novák", role: "OSVČ elektrikář, Praha" },
  { tag: "Salon", color: "bg-pink-100 text-pink-800", metric: "0 h", label: "ztracených telefonáty", quote: "Zákaznice si rezervují samy, já se mohu věnovat práci. Přesně to jsem potřebovala.", author: "Monika Králová", role: "Beauty Salon Monika" },
];

const FAQS = [
  { q: "Je to opravdu vše v ceně?", a: "Ano. V provozu 999 Kč/měs je booking, CRM, data, asistenti i podpora. 2 moduly máte v ceně, každý další je +290 Kč/měs. Žádné skryté příplatky za základní funkce." },
  { q: "Co když už mám web?", a: "Není problém. AI Core umíme napojit na váš stávající web a nástroje přes MCP/API, nebo vám postavíme nový — podle toho, co dává smysl." },
  { q: "Musím něco programovat nebo nastavovat?", a: "Ne. Zavedení děláme my za vás na míru. Vy popíšete, co potřebujete, a systém dostanete připravený k používání." },
  { q: "Jak dlouho trvá zavedení?", a: "Základní nasazení obvykle 1–2 týdny podle rozsahu. Konzultace a návrh plánu jsou zdarma a nezávazné." },
  { q: "Můžu kdykoliv zrušit?", a: "Ano. Nezavazujeme vás na dlouhé smlouvy. Provoz je měsíční a vaše data zůstávají vaše." },
  { q: "Je to vhodné pro můj obor?", a: "AI Core funguje napříč obory — od kaváren a salonů po řemeslníky, kliniky, e-shopy a kurzy. Na konzultaci řekneme rovnou, co se pro vás vyplatí." },
];

// ─── Component ──────────────────────────────────────────────────────────────────

export default function AiCorePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const cta = "/dotaznik?obor=ai-core";

  return (
    <div className="min-h-screen bg-[#080d1f] text-white font-[Plus_Jakarta_Sans,Inter,sans-serif] selection:bg-amber-400/30">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-[#080d1f]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2"><OptivioLogo className="h-8" light /></a>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-amber-200/70 tracking-widest uppercase">AI Core</span>
            <a href={cta}>
              <Button className="bg-amber-400 hover:bg-amber-300 text-[#1a1206] font-bold rounded-full px-5 text-sm">
                Chci AI Core
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#13224a_0%,#080d1f_60%)]" />
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 border border-amber-400/30 bg-amber-400/5 px-4 py-1.5 rounded-full text-xs font-medium text-amber-200 tracking-widest uppercase mb-7">
            <Sparkles className="w-3.5 h-3.5" /> Jeden systém místo deseti nástrojů
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Váš marketing a provoz<br />
            <span className="text-amber-300">běží sám.</span> Vy jen řídíte směr.
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-9 leading-relaxed">
            ONYX WEB <span className="text-white font-semibold">AI Core</span> spojí rezervace, CRM, e-shop, kampaně a tým asistentů
            do jednoho systému — místo abyste platili a propojovali deset různých nástrojů.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <a href={cta}>
              <Button size="lg" className="bg-amber-400 hover:bg-amber-300 text-[#1a1206] font-bold rounded-full px-9 shadow-lg shadow-amber-900/30 w-full sm:w-auto">
                Spustit AI Core <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
            <a href="#jak-to-funguje">
              <Button size="lg" variant="ghost" className="text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full w-full sm:w-auto">
                Jak to funguje
              </Button>
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> 999 Kč/měs — vše v ceně</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> 14 dní zdarma, bez karty</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Bez dlouhých závazků</span>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-14 pt-8 border-t border-white/10">
            {[["8", "asistentů v týmu"], ["6", "modulů na míru"], ["1", "systém pro vše"]].map(([v, l]) => (
              <div key={l}>
                <div className="text-3xl font-extrabold text-amber-300">{v}</div>
                <div className="text-xs text-white/50 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── PROBLEM STACK ── */}
      <section className="py-20 bg-[#0b1124]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Znáte to?</h2>
            <p className="text-white/50 max-w-xl mx-auto">Většina firem neřeší jeden problém — řeší pět najednou, každý v jiné appce.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAINS.map((p) => (
              <div key={p.t} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="w-9 h-9 rounded-lg bg-red-500/15 text-red-300 flex items-center justify-center mb-3">
                  <X className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1.5">{p.t}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION / PILLARS ── */}
      <section className="py-20 bg-[#080d1f] relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 border border-amber-400/30 bg-amber-400/5 px-4 py-1.5 rounded-full text-xs font-medium text-amber-200 tracking-widest uppercase mb-5">
              Řešení
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
              ONYX WEB <span className="text-amber-300">AI Core</span> — vše v jednom
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">Pět pilířů, jedna platforma, jeden zdroj pravdy o vašem byznysu.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {PILLARS.map((p) => (
              <div key={p.t} className="bg-[#0c1430]/80 border border-amber-400/15 rounded-2xl p-5 text-center">
                <div className="text-amber-300 mb-3 flex justify-center">{p.icon}</div>
                <h3 className="font-semibold text-sm text-amber-50 mb-1">{p.t}</h3>
                <p className="text-[11px] text-white/45 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENTS ── */}
      <section className="py-20 bg-gradient-to-br from-violet-950 via-[#1a0a3c] to-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-sm mb-5">
              <Sparkles className="w-4 h-4 text-violet-300" /> <span className="text-violet-200">Váš tým asistentů</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Vy říkáte CO. Oni vědí JAK.</h2>
            <p className="text-violet-200 max-w-xl mx-auto">Každý asistent nese znalosti nejlepších světových marketérů — připravený 24/7.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AGENTS.map((a) => (
              <div key={a.name} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-all">
                <div className="text-2xl mb-2">{a.icon}</div>
                <div className="font-semibold text-sm text-white">{a.name}</div>
                <div className="text-violet-300 text-xs mt-0.5">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section className="py-20 bg-[#0b1124]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Moduly, které zapojíte podle potřeby</h2>
            <p className="text-white/50 max-w-xl mx-auto">2 máte v ceně. Další přidáte za 290 Kč/měs, když je budete potřebovat.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((m) => (
              <div key={m.t} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-400/10 text-amber-300 flex items-center justify-center flex-shrink-0">{m.icon}</div>
                <div>
                  <h3 className="font-semibold mb-1">{m.t}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{m.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="jak-to-funguje" className="py-20 bg-[#080d1f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Jak to funguje</h2>
            <p className="text-white/50 max-w-xl mx-auto">Od první konzultace po systém, který běží sám — ve čtyřech krocích.</p>
          </div>
          <div className="space-y-4">
            {STEPS.map((s) => (
              <div key={s.n} className="flex items-start gap-5 bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-11 h-11 rounded-full bg-amber-400 text-[#1a1206] font-extrabold flex items-center justify-center flex-shrink-0">{s.n}</div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{s.t}</h3>
                  <p className="text-white/55 leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="py-20 bg-[#0b1124]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Proč AI Core, a ne krabice nebo agentura</h2>
            <p className="text-white/50 max-w-xl mx-auto">Více za méně — bez příplatků za každou drobnost a bez zamčených dat.</p>
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="text-left p-4 text-white/40 font-medium"></th>
                  <th className="p-4 text-center rounded-t-2xl bg-amber-400/10 border-x border-t border-amber-400/30">
                    <span className="text-amber-300 font-extrabold text-base">ONYX WEB AI Core</span>
                  </th>
                  <th className="p-4 text-center text-white/60 font-semibold">Krabicová platforma</th>
                  <th className="p-4 text-center text-white/60 font-semibold">Agentura / freelancer</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.label}>
                    <td className="p-4 text-white/70 border-t border-white/10">{row.label}</td>
                    <td className={`p-4 text-center bg-amber-400/[0.06] border-x border-amber-400/30 ${i === COMPARISON.length - 1 ? "rounded-b-2xl border-b" : ""}`}>
                      <Cell v={row.core} accent />
                    </td>
                    <td className="p-4 text-center border-t border-white/10"><Cell v={row.box} /></td>
                    <td className="p-4 text-center border-t border-white/10"><Cell v={row.agency} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-20 bg-[#080d1f]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Jedna cena, žádná překvapení</h2>
            <p className="text-white/50">Zavedení na míru jednorázově, pak měsíční provoz se vším v ceně.</p>
          </div>
          <div className="bg-gradient-to-b from-[#13224a] to-[#0c1430] border border-amber-400/30 rounded-3xl p-8 shadow-2xl shadow-amber-900/20">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 mb-7 text-center sm:text-left">
              <div className="flex-1">
                <p className="text-white/50 text-sm mb-1">Zavedení na míru</p>
                <p className="text-3xl font-extrabold">od 14 990 <span className="text-base font-medium text-white/50">Kč</span></p>
                <p className="text-xs text-white/40 mt-1">jednorázově</p>
              </div>
              <div className="hidden sm:block w-px bg-white/10" />
              <div className="flex-1">
                <p className="text-white/50 text-sm mb-1">Provoz — vše v ceně</p>
                <p className="text-3xl font-extrabold text-amber-300">999 <span className="text-base font-medium text-white/50">Kč/měs</span></p>
                <p className="text-xs text-white/40 mt-1">2 moduly v ceně, další +290 Kč/měs</p>
              </div>
            </div>
            <ul className="space-y-2.5 mb-8">
              {INCLUDED.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <a href={cta} className="block">
              <Button size="lg" className="w-full bg-amber-400 hover:bg-amber-300 text-[#1a1206] font-bold rounded-full shadow-lg">
                Spustit AI Core <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
            <p className="text-center text-xs text-white/40 mt-4">Pricing argument: krabicové platformy účtují za srovnatelné doplňky 800–1 500 Kč/měs jen na příplatcích.</p>
          </div>
        </div>
      </section>

      {/* ── GUARANTEE ── */}
      <section className="py-16 bg-[#0b1124]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-emerald-500/[0.07] border border-emerald-500/25 rounded-2xl p-7 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">14 dní zdarma, bez karty a bez závazků</h3>
              <p className="text-white/55 text-sm leading-relaxed">
                Vyzkoušejte AI Core vlastním tempem. Konzultace a návrh plánu jsou zdarma a nezávazné — a vaše data zůstávají vždy vaše.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-[#080d1f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Výsledky, ne sliby</h2>
            <p className="text-white/50 max-w-xl mx-auto">Konkrétní čísla od firem, které jsme rozjeli.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {CASES.map((c) => (
              <div key={c.author} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
                <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${c.color} mb-4`}>{c.tag}</span>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-extrabold text-amber-300">{c.metric}</span>
                  <span className="text-sm text-white/50">{c.label}</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed italic mb-4 flex-1">„{c.quote}"</p>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{c.author}</div>
                  <div className="text-xs text-white/40">{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-[#0b1124]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Časté otázky</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={f.q} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-semibold">{f.q}</span>
                  <ChevronDown className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <p className="px-5 pb-5 text-white/55 text-sm leading-relaxed -mt-1">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 bg-gradient-to-br from-[#13224a] via-[#0f0628] to-[#080d1f] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5">
            Přestaňte lepit nástroje.<br />
            <span className="text-amber-300">Začněte řídit směr.</span>
          </h2>
          <p className="text-lg text-white/65 mb-9 leading-relaxed">
            Domluvte si nezávaznou konzultaci zdarma. Projdeme váš proces a řekneme rovnou, co se vám vyplatí zapojit jako první.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={cta}>
              <Button size="lg" className="bg-amber-400 hover:bg-amber-300 text-[#1a1206] font-bold rounded-full px-9 shadow-lg w-full sm:w-auto">
                Spustit AI Core <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
            <a href="/demo">
              <Button size="lg" variant="ghost" className="text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full w-full sm:w-auto">
                Prohlédnout ukázky
              </Button>
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/45 mt-8">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Odpověď do 24 hodin</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Konzultace zdarma</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 bg-[#060912] border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© 2026 ONYX WEB. Všechna práva vyhrazena.</p>
          <div className="flex gap-5">
            <a href="/" className="hover:text-white transition-colors">Domů</a>
            <a href="/demo" className="hover:text-white transition-colors">Ukázky</a>
            <a href="/agents" className="hover:text-white transition-colors">Asistenti</a>
          </div>
        </div>
      </footer>

      <SalesChatWidget />
    </div>
  );
}

function Cell({ v, accent }: { v: boolean | string; accent?: boolean }) {
  if (v === true) return <Check className={`w-5 h-5 mx-auto ${accent ? "text-amber-300" : "text-emerald-400"}`} />;
  if (v === false) return <X className="w-5 h-5 mx-auto text-white/25" />;
  return <span className={`text-xs ${accent ? "text-amber-200 font-medium" : "text-white/50"}`}>{v}</span>;
}

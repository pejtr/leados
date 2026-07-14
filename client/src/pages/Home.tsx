import { useState, useEffect, useRef, ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronDown, CheckCircle2, TrendingUp, BarChart3, Database, MessageSquare, ArrowRight, Globe, Search, PenTool, Rocket, LineChart, Quote } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { useAuth } from "@/_core/hooks/useAuth";
import { trackSklikConversion } from "@/lib/sklik";
import { isChannelConsented } from "@/components/CookieConsentBanner";
import { trackLinkedInConversion } from "@/lib/linkedin";
import { activeConfig } from "@shared/brand-config";
import { trackEvent, trackFormStart, type Variant } from "@/lib/ab-test";
import { getAttribution } from "@/lib/attribution";
import { CORE_OFFERS, SERVICE_TERMS, formatOfferPrice } from "@shared/service-catalog";

// ─── Animation Helpers ────────────────────────────────────────────────────────
const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

function StaggerGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────
const faqs = [
  { q: "Proč neděláte rovnou celek, ale začínáte od Auditu?", a: "Nechceme vařít z vody. Bez úvodní diagnostiky je vytvoření nového webu riskantní. Audit nám napoví přesná slabá místa a rovnou definuje investiční plán s nejvyšší návratností." },
  { q: "Mám už nový web od jiné agentury. Můžete zapojit ONYX OS?", a: "Ano. Pomocí ONYX OS můžeme integrovat poptávkový formulář, follow-up sekvence a CRM vrstvu na váš existující web, aby neutíkal provoz." },
  { q: "Kolik mě tedy bude audit stát?", a: `Mini audit je zdarma a dá vám indikaci slabých míst. Kompletní ONYX OS Audit stojí fixních ${formatOfferPrice(CORE_OFFERS.ONYX_OS_AUDIT)}.` },
  { q: "Co vše ONYX OS pokrývá?", a: "Akvizici leadů do vlastního CRM (nepřijdete tak o poptávky z kontaktních formulářů), automatický follow-up, zasílání reportů o reálném růstu vašeho businessu a bezúdržbové fungování." },
  { q: "Děláte e-shopy?", a: "Náš systém je určený striktně pro generování a správu B2B nebo lokálních poptávek. Klasické e-shopy neděláme." },
  { q: "Jak dlouho nasazení trvá?", a: `Mini audit dodáme do ${SERVICE_TERMS.miniAuditDeliveryHours} hodin. Samotný Setup obvykle trvá ${SERVICE_TERMS.setupDeliveryWeeks} týdny podle rozsahu a testování.` },
  { q: `Co je zahrnuto v monitoringu za ${formatOfferPrice(CORE_OFFERS.MONITORING)}?`, a: "Zabezpečený provoz systému, aktivní vyhodnocování slabých míst, opravy rychlosti a drobný support." },
  { q: "Lze Monitoring kdykoliv zrušit?", a: "Smlouvy nevážeme. Lze jej zrušit, ale bez naší správy systém časem degraduje na základní statický webový průchod." },
];

const packages = [
  {
    name: `01. ${CORE_OFFERS.MINI_AUDIT.name}`, price: formatOfferPrice(CORE_OFFERS.MINI_AUDIT), proKomu: "Prohlédneme 1 stránku",
    features: ["Rychlý náhled na konverzní potenciál", "Check rychlosti načítání", "Zdarma a nezávazně"],
    cta: CORE_OFFERS.MINI_AUDIT.cta, href: CORE_OFFERS.MINI_AUDIT.href, badge: null
  },
  {
    name: `02. ${CORE_OFFERS.ONYX_OS_AUDIT.name}`, price: formatOfferPrice(CORE_OFFERS.ONYX_OS_AUDIT), proKomu: "Komplexní analýza slabých míst",
    features: ["Mapování celého funnelu", "Design a copy report", `${SERVICE_TERMS.auditConsultationMinutes} minut konzultace`, "Prioritizovaný plán oprav"],
    cta: CORE_OFFERS.ONYX_OS_AUDIT.cta, href: CORE_OFFERS.ONYX_OS_AUDIT.href, badge: "Klíčový krok"
  },
  {
    name: `03. ${CORE_OFFERS.ONYX_OS_SETUP.name}`, price: formatOfferPrice(CORE_OFFERS.ONYX_OS_SETUP), proKomu: "Implementace řešení",
    features: ["Kompletní přepracování na ONYX OS", "CRM pro správu poptávek", "Virtual SDR pro follow-upy", "Integrovaná analytika"],
    cta: CORE_OFFERS.ONYX_OS_SETUP.cta, href: CORE_OFFERS.ONYX_OS_SETUP.href, badge: "Nasazení"
  },
  {
    name: `04. ${CORE_OFFERS.MONITORING.name}`, price: formatOfferPrice(CORE_OFFERS.MONITORING), proKomu: "Měsíční udržitelnost",
    features: ["Reálná optimalizace konverzí", "Zabezpečený hosting a údržba", "Týdenní reporty prodeje", "Drobné textařské úpravy"],
    cta: CORE_OFFERS.MONITORING.cta, href: CORE_OFFERS.MONITORING.href, badge: null
  }
];

type HomeProps = {
  variant?: Variant;
};

export default function Home({ variant = "A" }: HomeProps) {
  const { isAuthenticated, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  const contactRef = useRef<HTMLElement>(null);

  // Minimal Contact Form State
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", packageType: "Konzultace k ONYX OS" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createInquiry = trpc.inquiries.create.useMutation();
  const { data: portfolio = [] } = trpc.portfolio.list.useQuery();
  const { data: testimonials = [] } = trpc.testimonials.list.useQuery();
  const heroCopy = variant === "B"
    ? {
      eyebrow: "Web, CRM a automatizace pro růst",
      title: "Výkonnostní web a CRM pro firmy, které chtějí více poptávek.",
      description: "Navrhneme jasnou nabídku, zachytíme každý lead a nastavíme měření i následnou péči. Začneme krátkým auditem vašeho současného webu.",
    }
    : {
      eyebrow: "Diagnostika a optimalizace poptávek",
      title: "Najdeme, kde váš web ztrácí zákazníky. A opravíme celou cestu k poptávce.",
      description: "Nejprve zdarma prověříme nejslabší místo. Potom navrhneme web, CRM a automatizaci, které dávají obchodnímu týmu měřitelný systém místo odhadů.",
    };
  const portfolioItems = portfolio.filter(project => Boolean(project.imageUrl)).slice(0, 6);
  const testimonialItems = testimonials.filter(item => Boolean(item.text && item.author)).slice(0, 3);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToContact = () => {
    void trackEvent("hero_cta_click", { cta: "consultation", location: "hero" });
    contactRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.includes("@")) return toast.error("Vyplňte platné jméno a email");
    setIsSubmitting(true);
    try {
      const result = await createInquiry.mutateAsync({
        ...formData,
        businessDescription: "Přímo z Homepage formuláře",
        source: "home-lead",
        details: getAttribution(),
        linkedinConsent: isChannelConsented("linkedin"),
      } as any);
      trackSklikConversion({ orderId: `home-${result.id}` });
      trackLinkedInConversion();
      void trackEvent("form_submit", { formName: "homepage-contact", inquiryId: result.id });
      toast.success("Odesláno! Ozveme se.");
      setFormData({ name: "", email: "", phone: "", packageType: "Konzultace k ONYX OS" });
    } catch { toast.error("Chyba při odesílání."); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen font-[Plus_Jakarta_Sans,Inter,sans-serif] bg-slate-50 text-slate-900 selection:bg-violet-200">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/" aria-label="Optimateo"><OptimateoLogo className="h-8" light={false} withTagline={false} /></a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">Přístup</a>
            <a href="#funnel" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">Systém</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">Ceník</a>
            <a href="/demo" className="text-violet-600 hover:text-violet-700 text-sm font-medium transition-colors">Ukázky (Demo)</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <a href={user?.role === "admin" ? "/admin" : "/dashboard"} className="text-sm font-bold text-slate-700 hover:text-slate-900 px-4 py-2">
                ADMIN
              </a>
            ) : null}
            <a href="/audit-zdarma" className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors hidden sm:block">
              {CORE_OFFERS.MINI_AUDIT.cta}
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-bold uppercase tracking-wider mb-8">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span></span>
              {heroCopy.eyebrow}
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-950 mb-8 max-w-4xl mx-auto leading-[1.05]">
              {heroCopy.title}
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              {heroCopy.description}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/audit-zdarma" onClick={() => void trackEvent("hero_cta_click", { cta: "mini-audit", location: "hero" })} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white text-base lg:text-lg font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all shadow-violet-600/20 flex items-center justify-center gap-2">
                {CORE_OFFERS.MINI_AUDIT.cta} <ArrowRight className="w-5 h-5" />
              </a>
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-[60px] text-base font-semibold border-slate-300 text-slate-700 hover:bg-slate-50" onClick={scrollToContact}>
                Konzultace s námi
              </Button>
            </div>
            <p className="mt-6 text-sm text-slate-500 font-medium">První stránka auditu zdarma · Odpověď do 1 pracovního dne · Bez závazku</p>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-sm font-semibold text-slate-600">
          <span>Český dodavatel · IČO {activeConfig.billingInfo.companyId}</span>
          <span>Jasný rozsah a cena před zahájením</span>
          <span>Vlastní CRM a měření poptávek</span>
        </div>
      </section>

      {/* ── VILLAIN PROBLEM ── */}
      <section id="about" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Proč většina webů neplní svůj účel?</h2>
            <p className="text-lg text-slate-600">Agentury prodávají paušály. Slibují SEO a placenou reklamu beze smyslu, ale málokdy řeší to nejdůležitější: konverzi zachycenou systémem.</p>
          </Reveal>
          <StaggerGrid className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Statická Vizitka", desc: "Základní web s jedním kontaktním formulářem bez automatické cesty leadu ztrácí okamžitě pozornost a data.", icon: <Globe className="w-6 h-6 text-slate-400" /> },
              { title: "Odpadlé poptávky", desc: "Poptávka spadne do spamu. Zájemce není kontaktován do 5 minut a nakupuje u rychlejší lokální konkurence.", icon: <MessageSquare className="w-6 h-6 text-rose-500" /> },
              { title: "Slepá Reklama", desc: "Platíte drahé PPC kampaně u agentur, ty však vedou lidi na matoucí a nepřívětivé hlavní stránky místo na funnel.", icon: <BarChart3 className="w-6 h-6 text-orange-500" /> }
            ].map((p, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6">{p.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{p.title}</h3>
                <p className="text-slate-600">{p.desc}</p>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── VIRTUAL SDR & ROI MOCKUP ── */}
      <section id="funnel" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold uppercase tracking-wider mb-6">
                Řešení ONYX OS
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">Virtual SDR & CRM jako páteř vašeho provozu</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Po dokončení Diagnostického ONYX OS Auditu nasazujeme kompletní infrastrukturu. Web se napojí na centrální
                mozek: ONYX OS zachytí lead, odešle jménem firmy automatický "follow-up", uloží jej do CRM a notifikuje majitele.
                Výsledkem jsou měřitelná růstová data, žádné odhadování.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Návštěvník vidí jasnou hodnotu (Vyřešeno Auditem)",
                  "Odesílá unikátní lead form (Zachyceno ONYX OS)",
                  "Automaticky dostává email od Vás (Virtual SDR)",
                  "Předání kvalifikovaného leadu obchodníkovi a změření výsledku"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-slate-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <a href="/audit-zdarma" className="text-violet-600 font-bold hover:text-violet-700 flex items-center gap-1 transition-colors">
                Nechat si prověřit web <ArrowRight className="w-4 h-4" />
              </a>
            </Reveal>

            {/* ROI Dashboard Preview */}
            <Reveal className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-100 to-indigo-50 transform rotate-3 rounded-[2rem] -z-10"></div>
              <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-semibold text-slate-300 tracking-wider">ONYX OS • CRM DASHBOARD</span>
                  </div>
                  <div className="text-[10px] text-slate-500 bg-slate-800 px-2 py-1 rounded">Modelový příklad, ne garantovaný výsledek.</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">Poptávky za měsíc</p>
                      <h3 className="text-4xl font-black text-slate-900 flex items-baseline gap-2">
                        Měřeno <span className="text-sm text-emerald-600 font-bold flex items-center bg-emerald-50 px-2 py-0.5 rounded"><TrendingUp className="w-3 h-3 mr-1" /> podle zdroje</span>
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500 font-medium mb-1">Obchodní hodnota</p>
                      <h3 className="text-2xl font-bold text-slate-900">Doplní CRM</h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Poslední zpracované poptávky</p>
                    {[
                      { name: "Klient_01", mail: "klient_01@email.cz", status: "SDR Followed Up", time: "Před 5 min" },
                      { name: "Klient_02", mail: "klient_02@email.cz", status: "SDR Followed Up", time: "Před 20 min" },
                      { name: "Klient_03", mail: "klient_03@email.cz", status: "Meeting Booked", time: "Včera" },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{row.name}</span>
                          <span className="text-xs text-slate-500">{row.mail}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full mb-1">{row.status}</span>
                          <span className="text-xs text-slate-400">{row.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── DELIVERY PROCESS ── */}
      <section className="bg-slate-950 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-14 max-w-3xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-300">Jak spolupráce probíhá</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Od první kontroly po měřitelný provoz</h2>
            <p className="mt-4 text-lg text-slate-300">Každý krok má konkrétní výstup. Než začnete investovat do realizace, víte co se bude dělat, proč a za kolik.</p>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: Search, step: "01", title: "Mini audit", text: "Prověříme nabídku, hlavní CTA, mobilní zobrazení a měření." },
              { icon: PenTool, step: "02", title: "Návrh řešení", text: "Dostanete priority, rozsah, termín a pevně popsaný další krok." },
              { icon: Rocket, step: "03", title: "Realizace", text: "Postavíme web, formuláře, CRM napojení a automatické reakce." },
              { icon: LineChart, step: "04", title: "Měření", text: "Sledujeme kvalitu leadů a upravujeme cestu podle skutečných dat." },
            ].map(({ icon: Icon, step, title, text }) => (
              <div key={step} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
                <div className="mb-6 flex items-center justify-between">
                  <Icon className="h-6 w-6 text-violet-300" />
                  <span className="text-sm font-bold text-slate-500">{step}</span>
                </div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUDIT PREVIEW ── */}
      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-600">Co dostanete zdarma</p>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Ukázka výstupu mini auditu</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">Žádný automatický bodový výsledek bez vysvětlení. Pošleme stručné hodnocení nejdůležitější stránky a doporučení, které lze rovnou použít.</p>
            <a href="/audit-zdarma" className="mt-7 inline-flex items-center font-bold text-violet-700 hover:text-violet-800">
              {CORE_OFFERS.MINI_AUDIT.cta} <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Reveal>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-5">
              <div><p className="text-xs font-bold uppercase tracking-wider text-violet-600">OPTIMATEO mini audit</p><p className="mt-1 font-bold text-slate-900">Shrnutí hlavní stránky</p></div>
              <span className="rounded bg-white px-3 py-1 text-xs font-semibold text-slate-500">Ukázka struktury</span>
            </div>
            <div className="space-y-4">
              {[
                ["Nabídka a srozumitelnost", "Pozná návštěvník do 5 sekund, co nabízíte a pro koho?"],
                ["Konverzní cesta", "Je další krok jasný, snadný a důvěryhodný na mobilu?"],
                ["Důvěra", "Jsou vidět skutečné výsledky, kontakty a odpovědnost dodavatele?"],
                ["Měření", "Lze rozlišit zdroj, kvalitu a obchodní výsledek každé poptávky?"],
              ].map(([title, text], index) => (
                <div key={title} className="flex gap-4 rounded-lg bg-white p-4 ring-1 ring-slate-200">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-violet-100 text-xs font-bold text-violet-700">{index + 1}</span>
                  <div><h3 className="font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {portfolioItems.length > 0 && (
        <section className="bg-slate-50 py-24" id="reference">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mb-12 max-w-3xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-600">Vybrané realizace</p>
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Skutečné projekty, screenshot a stručný kontext</h2>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {portfolioItems.map(project => (
                <article key={project.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <img src={project.imageUrl!} alt={`Ukázka projektu ${project.title}`} loading="lazy" className="aspect-[4/3] w-full object-cover object-top" />
                  <div className="p-6">
                    {project.category && <p className="text-xs font-bold uppercase tracking-wider text-violet-600">{project.category}</p>}
                    <h3 className="mt-2 text-xl font-bold text-slate-900">{project.title}</h3>
                    {project.description && <p className="mt-3 text-sm leading-6 text-slate-600">{project.description}</p>}
                    {project.results && <p className="mt-4 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-800">{project.results}</p>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {testimonialItems.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-5 md:grid-cols-3">
              {testimonialItems.map(item => (
                <figure key={item.id} className="rounded-lg border border-slate-200 p-6">
                  <Quote className="h-6 w-6 text-violet-300" />
                  <blockquote className="mt-4 leading-7 text-slate-700">„{item.text}“</blockquote>
                  <figcaption className="mt-5 text-sm"><strong className="text-slate-900">{item.author}</strong>{(item.role || item.company) && <span className="block text-slate-500">{[item.role, item.company].filter(Boolean).join(" · ")}</span>}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── VALUE LADDER (PRICING) ── */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Diagnostika na prvním místě</h2>
            <p className="text-lg text-slate-600">Striktně odmítáme nasazovat nákladný web pro někoho, komu ho není potřeba, dokud nezanalyzujeme čísla.</p>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} className={`bg-white rounded-2xl p-6 sm:p-8 flex flex-col relative border ${pkg.badge ? 'border-violet-500 shadow-xl shadow-violet-100' : 'border-slate-200'}`}>
                {pkg.badge && (
                  <div className="absolute top-0 right-8 -translate-y-1/2 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    {pkg.badge}
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-1">{pkg.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{pkg.proKomu}</p>
                <div className="text-3xl font-black text-slate-900 mb-8">{pkg.price}</div>
                <ul className="space-y-4 mb-8 flex-1">
                  {pkg.features.map((f, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href={pkg.href} className={`block text-center py-3 px-4 rounded-xl font-bold transition-all ${pkg.badge ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}>
                  {pkg.cta}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMITMENTS ── */}
      <section className="py-20 bg-slate-900 text-white px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-5">Co budete vědět před zahájením</h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-300">Neprodáváme neurčitý příslib růstu. Dostanete popsaný problém, rozsah řešení a způsob, jakým budeme výsledek měřit.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {["Co přesně dodáme", "Kolik realizace stojí", "Podle čeho poznáme výsledek"].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <Check className="h-5 w-5 shrink-0 text-emerald-400" /><span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center"><a href={CORE_OFFERS.MINI_AUDIT.href} className="inline-block rounded-full bg-white px-8 py-3 font-bold text-slate-900 hover:bg-slate-100">{CORE_OFFERS.MINI_AUDIT.cta}</a></div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Co vás zajímá</h2>
          </Reveal>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 transition-colors">
                <button
                  onClick={() => setOpenFaqs(p => ({ ...p, [i]: !p[i] }))}
                  className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                >
                  <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${openFaqs[i] ? "rotate-180" : ""}`} />
                </button>
                {openFaqs[i] && (
                  <div className="px-6 pb-5 text-slate-600 bg-white pt-2 border-t border-slate-100">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CONTACT ── */}
      <section id="contact" ref={contactRef} className="py-24 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Pojďme najít bariéry vašeho růstu</h2>
            <p className="text-lg text-slate-400 mb-8 font-light">Vyplňte formulář a rezervujte si konkrétní čas na úvodní prověření. Případně doporučíme ONYX OS Audit pro hlubší detekci ztrát.</p>
            <div className="space-y-2 text-sm font-medium text-slate-300">
              <p>Email: <a href="mailto:info@optimateo.com" className="text-violet-400">info@optimateo.com</a></p>
              <p>{activeConfig.legalName} · IČO {activeConfig.billingInfo.companyId}</p>
              <p>{activeConfig.billingInfo.street}, {activeConfig.billingInfo.postalCode} {activeConfig.billingInfo.region}</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 sm:p-10 text-slate-900 shadow-2xl relative">
            <form onSubmit={handleSubmit} onFocusCapture={() => trackFormStart("homepage-contact")} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="homepage-contact-name" className="block text-sm font-bold text-slate-700 mb-2">Jméno *</label>
                  <input id="homepage-contact-name" name="name" autoComplete="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
                </div>
                <div>
                  <label htmlFor="homepage-contact-email" className="block text-sm font-bold text-slate-700 mb-2">E-mail *</label>
                  <input id="homepage-contact-email" name="email" autoComplete="email" required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label htmlFor="homepage-contact-phone" className="block text-sm font-bold text-slate-700 mb-2">Telefon</label>
                <input id="homepage-contact-phone" name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
              </div>
              <div>
                <label htmlFor="homepage-contact-situation" className="block text-sm font-bold text-slate-700 mb-2">Jak vnímáte situaci?</label>
                <Select value={formData.packageType} onValueChange={(val) => setFormData({ ...formData, packageType: val })}>
                  <SelectTrigger id="homepage-contact-situation" className="w-full h-12 rounded-xl border-slate-200 bg-slate-50">
                    <SelectValue placeholder="Vyberte situaci" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Konzultace k ONYX OS">Chtěl bych napřed obecnou konzultaci</SelectItem>
                    <SelectItem value="Mini Audit">Potřebuji zjistit základní trhliny (Mini Audit)</SelectItem>
                    <SelectItem value="ONYX OS Setup">Rovnou postavit nový ekosystém (Setup)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
                {isSubmitting ? "Odesílám..." : "Odeslat dotaz →"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 py-8 border-t border-white/10 text-center text-sm text-slate-500">
        <p>© 2026 OPTIMATEO · {activeConfig.legalName} · IČO {activeConfig.billingInfo.companyId} · Nejsme plátci DPH.</p>
        <nav className="mt-3 flex flex-wrap justify-center gap-4 text-xs" aria-label="Právní dokumenty">
          <a href="/ochrana-osobnich-udaju" className="hover:text-slate-300">Ochrana osobních údajů</a>
          <a href="/cookies" className="hover:text-slate-300">Cookies</a>
          <a href="/obchodni-podminky" className="hover:text-slate-300">Obchodní podmínky</a>
        </nav>
      </footer>
    </div>
  );
}

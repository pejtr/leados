import { useState, useEffect, useRef, ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronDown, CheckCircle2, TrendingUp, BarChart3, Database, MessageSquare, ArrowRight, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { useAuth } from "@/_core/hooks/useAuth";
import { trackSklikConversion } from "@/lib/sklik";
import { SalesChatWidget } from "@/components/SalesChatWidget";

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
  { q: "Kolik mě tedy bude audit stát?", a: "Mini Audit je zdarma a dá vám indikaci trhlin. Kompletní ONYX OS Audit stojí fixních 4 900 Kč." },
  { q: "Co vše ONYX OS pokrývá?", a: "Akvizici leadů do vlastního CRM (nepřijdete tak o poptávky z kontaktních formulářů), automatický follow-up, zasílání reportů o reálném růstu vašeho businessu a bezúdržbové fungování." },
  { q: "Děláte e-shopy?", a: "Náš systém je určený striktně pro generování a správu B2B nebo lokálních poptávek. Klasické e-shopy neděláme." },
  { q: "Jak dlouho nasazení trvá?", a: "Po auditu (který máme hotový do 48 hodin), samotný Setup trvá dle složitosti od 1 do 3 týdnů s testováním funkcí." },
  { q: "Co je zahrnuto v měsíčním monitoringu za 1 999 Kč?", a: "Zabezpečený provoz systému, aktivní vyhodnocování trhlin, opravy rychlosti a drobný support." },
  { q: "Lze Monitoring kdykoliv zrušit?", a: "Smlouvy nevážeme. Lze jej zrušit, ale bez naší správy systém časem degraduje na základní statický webový průchod." },
];

const packages = [
  {
    name: "01. Mini Audit", price: "0 Kč", proKomu: "Prohlédneme 1 stránku",
    features: ["Rychlý náhled na konverzní potenciál", "Check rychlosti načítání", "Zdarma a nezávazně"],
    cta: "Chci mini audit zdarma", href: "/audit-zdarma", badge: null
  },
  {
    name: "02. ONYX OS Audit", price: "4 900 Kč", proKomu: "Komplexní analýza trhlin",
    features: ["Mapování celého funnelu", "Design a copy report", "1 hodina konzultace", "Návrh záchranných prací"],
    cta: "Detailní audit", href: "/audit-zdarma", badge: "Klíčový krok"
  },
  {
    name: "03. ONYX OS Setup", price: "od 29 900 Kč", proKomu: "Implementace řešení",
    features: ["Kompletní přepracování na ONYX OS", "CRM pro správu poptávek", "Virtual SDR pro follow-upy", "Integrovaná analytika"],
    cta: "Kontaktujte nás", href: "#contact", badge: "Nasazení"
  },
  {
    name: "04. ONYX OS Monitoring", price: "1 999 Kč/měsíc", proKomu: "Měsíční udržitelnost",
    features: ["Reálná optimalizace konverzí", "Zabezpečený hosting a údržba", "Týdenní reporty prodeje", "Drobné textařské úpravy"],
    cta: "Kontaktujte nás", href: "#contact", badge: null
  }
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  const contactRef = useRef<HTMLElement>(null);

  // Minimal Contact Form State
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", packageType: "Konzultace k ONYX OS" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createInquiry = trpc.inquiries.create.useMutation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToContact = () => contactRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.includes("@")) return toast.error("Vyplňte platné jméno a email");
    setIsSubmitting(true);
    try {
      await createInquiry.mutateAsync({ ...formData, businessDescription: "Přímo z Homepage formuláře", source: "home-lead" });
      trackSklikConversion({ orderId: `home-${Date.now()}`, value: 1000 });
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
              Získat mini audit zdarma
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
              Diagnostika a optimalizace poptávek
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-950 mb-8 max-w-4xl mx-auto leading-[1.05]">
              Najdeme, kde vám web <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">ztrácí zákazníky.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Většina stránek nefunguje. Nejprve zdarma odhalíme trhliny, potom nasadíme <strong className="text-slate-900">ONYX OS</strong>,
              který váš web promění na aktivní lead-gen systém se zabudovaným CRM a návratností.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/audit-zdarma" className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white text-base lg:text-lg font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all shadow-violet-600/20 flex items-center justify-center gap-2">
                Získat mini audit zdarma <ArrowRight className="w-5 h-5" />
              </a>
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-[60px] text-base font-semibold border-slate-300 text-slate-700 hover:bg-slate-50" onClick={scrollToContact}>
                Konzultace s námi
              </Button>
            </div>
            <p className="mt-6 text-sm text-slate-500 font-medium">Diagnostika první stránky zdarma. Bez závazku.</p>
          </Reveal>
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
                  "Dohoda a záchrana až 40% ztracených zakázek (Zisk)"
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
                        +24 <span className="text-sm text-emerald-600 font-bold flex items-center bg-emerald-50 px-2 py-0.5 rounded"><TrendingUp className="w-3 h-3 mr-1" /> 40%</span>
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500 font-medium mb-1">Zachráněný zisk</p>
                      <h3 className="text-2xl font-bold text-slate-900">112 000 Kč</h3>
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

      {/* ── TRUST & FOUNDER BLOCK ── */}
      <section className="py-20 bg-slate-900 text-white text-center px-4">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-full mb-6 ring-1 ring-white/10">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Evidence-based přístup a 100% QA</h2>
            <p className="text-lg text-slate-300 mb-10 leading-relaxed font-light">
              Neděláme úžasně kreativní, ale nepraktické stránky. Pracujeme jen s tvrdými daty,
              A/B testovanými šablonami a prověřenou backend logikou. Každý krok stavby i správy hlídají robustní procesy pro zachycení výkonnosti.
            </p>
            <a href="/audit-zdarma" className="bg-white text-slate-900 font-bold px-8 py-3 rounded-full hover:bg-slate-100 transition-colors">Prověřit připravenost vašeho webu</a>
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
            <div className="space-y-4 text-sm font-medium">
              <p>Email: <a href="mailto:info@optimateo.com" className="text-violet-400">info@optimateo.com</a></p>
              <p>Optimateo.com</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 sm:p-10 text-slate-900 shadow-2xl relative">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Jméno *</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Telefon / Email *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jak vnímáte situaci?</label>
                <Select value={formData.packageType} onValueChange={(val) => setFormData({ ...formData, packageType: val })}>
                  <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 bg-slate-50">
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
        <p>© 2026 OPTIMATEO. Všechna práva vyhrazena. Poháněno systémem ONYX OS.</p>
      </footer>
      <SalesChatWidget />
    </div>
  );
}

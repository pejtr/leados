import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check, ArrowRight, Phone, Star, Clock, ShieldCheck, TrendingUp,
  Store, ShoppingCart, Layers, Sparkles, CheckCircle2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { trackSklikConversion } from "@/lib/sklik";
import { toast } from "sonner";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { isChannelConsented } from "@/components/CookieConsentBanner";
import { trackLinkedInConversion } from "@/lib/linkedin";
import { getAttribution } from "@/lib/attribution";
import { trackEvent, trackFormStart } from "@/lib/ab-test";

// ─── Data ─────────────────────────────────────────────────────────────────────

const SEGMENTS = [
  { id: "web-na-miru", icon: <Store className="w-5 h-5" />, label: "Web na míru", desc: "Prezentační web, který přináší poptávky" },
  { id: "eshop", icon: <ShoppingCart className="w-5 h-5" />, label: "E-shop", desc: "Prodávejte online s košíkem a platbami" },
  { id: "obor", icon: <Sparkles className="w-5 h-5" />, label: "Web pro můj obor", desc: "Kavárna, salon, řemeslo, klinika…" },
  { id: "system", icon: <Layers className="w-5 h-5" />, label: "Kompletní systém", desc: "Web + rezervace + CRM + marketing" },
];

const CONVERSION_FOUNDATIONS = [
  { title: "Jasná nabídka", description: "Návštěvník rychle pochopí, pro koho služba je a proč se ozvat." },
  { title: "Přímý kontakt", description: "Telefon a formulář jsou dostupné bez hledání, zejména na mobilu." },
  { title: "Měřitelný výkon", description: "Od spuštění sledujeme zdroj návštěvy, odeslané formuláře a další kroky." },
];

const STEPS = [
  { n: "1", t: "Řeknete, co potřebujete", d: "Vyplníte krátký formulář — zavoláme do 24 hodin." },
  { n: "2", t: "Návrh a cena zdarma", d: "Připravíme řešení na míru a jasnou cenu. Nezávazně." },
  { n: "3", t: "Web, který vydělává", d: "Spustíme web do 1–2 týdnů a doladíme, ať nosí poptávky." },
];

const TRUST = [
  { icon: <Star className="w-4 h-4" />, t: "Měření od prvního dne" },
  { icon: <Clock className="w-4 h-4" />, t: "Web hotový do 1–2 týdnů" },
  { icon: <ShieldCheck className="w-4 h-4" />, t: "Bez dlouhých závazků" },
];

// ─── Component ──────────────────────────────────────────────────────────────────

export default function WebLandingPage() {
  const [segment, setSegment] = useState<string>("web-na-miru");
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const createInquiry = trpc.inquiries.create.useMutation();

  const segLabel = SEGMENTS.find((s) => s.id === segment)?.label ?? "Web na míru";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Vyplňte prosím vaše jméno");
    if (!form.phone.trim()) return toast.error("Vyplňte prosím telefon");
    if (!form.email.includes("@")) return toast.error("Zadejte platný e-mail");
    setSubmitting(true);
    try {
      const result = await createInquiry.mutateAsync({
        name: form.name,
        email: form.email,
        phone: form.phone,
        businessDescription: `Poptávka z reklamy — ${segLabel}`,
        packageType: undefined,
        details: { segment, segmentLabel: segLabel, hook: "vysledky", ...getAttribution() },
        source: "sklik-web",
        linkedinConsent: isChannelConsented("linkedin"),
      } as any);
      trackSklikConversion({ orderId: `lead-web-${result.id}` });
      trackLinkedInConversion();
      void trackEvent("form_submit", { formName: "web-landing", segment, inquiryId: result.id });
      window.dispatchEvent(new CustomEvent("lead:web", { detail: { segment } }));
      setSent(true);
    } catch {
      toast.error("Něco se nepovedlo. Zkuste to prosím znovu nebo zavolejte.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-[Plus_Jakarta_Sans,Inter,sans-serif]">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" aria-label="OPTIMATEO"><OptimateoLogo className="h-8" /></a>
          <a href="#poptavka">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full text-sm font-semibold px-5">
              Chci web
            </Button>
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="relative overflow-hidden bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-5xl mx-auto px-4 pt-14 pb-10 sm:pt-20 grid lg:grid-cols-2 gap-10 items-center">
          {/* Left — message */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-violet-200 rounded-full px-3 py-1.5 text-xs font-medium text-violet-700 mb-5 shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" /> Web, který vydělává — ne jen vizitka
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] mb-5">
              Web, který vám<br />
              <span className="text-violet-600">přináší zákazníky.</span>
            </h1>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Postavíme vám web zaměřený na <span className="font-semibold text-slate-800">výsledky</span> —
              víc poptávek, rezervací a objednávek. Hotový do 1–2 týdnů, za férovou cenu.
            </p>
            <div className="flex flex-col gap-2.5 mb-7">
              {TRUST.map((t) => (
                <div key={t.t} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="text-emerald-600">{t.icon}</span> {t.t}
                </div>
              ))}
            </div>
            <a href="#poptavka">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-full px-8 shadow-lg shadow-violet-600/20 w-full sm:w-auto">
                Chci web, který vydělává <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
            <div className="flex items-center gap-1.5 mt-5 text-sm text-slate-500">
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
              50+ realizovaných projektů
            </div>
          </div>

          {/* Right — form */}
          <div id="poptavka" className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-7 scroll-mt-20">
            {sent ? (
              <div className="text-center py-8" data-conversion="lead">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-2xl font-extrabold mb-2">Děkujeme, máme to!</h2>
                <p className="text-slate-600 leading-relaxed mb-1">
                  Ozveme se vám <span className="font-semibold text-slate-800">do 24 hodin</span> na telefon {form.phone}.
                </p>
                <p className="text-sm text-slate-400">Připravíme návrh řešení a cenu na míru — nezávazně.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-extrabold mb-1">Získejte návrh a cenu zdarma</h2>
                <p className="text-sm text-slate-500 mb-5">Zavoláme do 24 hodin. Nezávazně.</p>

                {/* Segment chooser */}
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Co potřebujete?</label>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {SEGMENTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSegment(s.id)}
                      className={`text-left rounded-xl border p-3 transition-all ${
                        segment === s.id
                          ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500"
                          : "border-slate-200 hover:border-violet-300"
                      }`}
                    >
                      <span className={`inline-flex w-8 h-8 rounded-lg items-center justify-center mb-1.5 ${segment === s.id ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {s.icon}
                      </span>
                      <span className="block text-sm font-semibold text-slate-800 leading-tight">{s.label}</span>
                      <span className="block text-[11px] text-slate-400 leading-tight mt-0.5">{s.desc}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} onFocusCapture={() => trackFormStart("web-landing")} className="space-y-3">
                  <Input
                    placeholder="Vaše jméno"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                  <Input
                    type="tel"
                    inputMode="tel"
                    placeholder="Telefon"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                  <Input
                    type="email"
                    inputMode="email"
                    placeholder="E-mail"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl h-12 shadow-lg shadow-violet-600/20"
                  >
                    {submitting ? "Odesílám…" : <>Chci nezávaznou nabídku <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                  <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Žádný spam. Ozveme se jen kvůli vaší poptávce.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── CONVERSION FOUNDATIONS ── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-3">Co připravíme pro získávání poptávek</h2>
          <p className="text-slate-500 text-center max-w-xl mx-auto mb-10">Konkrétní základy, které lze po spuštění měřit a postupně zlepšovat.</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {CONVERSION_FOUNDATIONS.map((item) => (
              <div key={item.title} className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                <CheckCircle2 className="mb-4 h-7 w-7 text-violet-600" />
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW ── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">Jak to probíhá</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-white border border-slate-100 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-extrabold flex items-center justify-center mb-4">{s.n}</div>
                <h3 className="font-bold mb-1.5">{s.t}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 bg-violet-600 text-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Pojďme získat vaše zákazníky online.</h2>
          <p className="text-violet-100 mb-7 text-lg">Návrh a cena zdarma. Web hotový do 1–2 týdnů.</p>
          <a href="#poptavka">
            <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold rounded-full px-9">
              Chci nezávaznou nabídku <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
          <div className="flex items-center justify-center gap-2 mt-6 text-violet-200 text-sm">
            <Phone className="w-4 h-4" /> Ozveme se do 24 hodin
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-6 bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 OPTIMATEO. Všechna práva vyhrazena.</p>
          <div className="flex gap-5">
            <a href="/" className="hover:text-white transition-colors">Domů</a>
            <a href="/demo" className="hover:text-white transition-colors">Ukázky</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

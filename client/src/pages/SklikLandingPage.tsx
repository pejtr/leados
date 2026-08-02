import { ArrowRight, CheckCircle2, Clock, MessageCircle, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/ab-test";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { trackSklikConversion } from "@/lib/sklik";
import { trackLinkedInConversion } from "@/lib/linkedin";
import { isChannelConsented } from "@/components/CookieConsentBanner";
import { getAttribution } from "@/lib/attribution";
import { formatWebPackagePrice } from "@shared/service-catalog";

type Segment = {
  slug: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  cta: string;
  packageLabel: string;
  price: string;
  proof: string;
  pains: string[];
  deliverables: string[];
  keywords: string[];
};

const SEGMENTS: Record<string, Segment> = {
  zivnostnici: {
    slug: "zivnostnici",
    eyebrow: "Web pro OSVČ a malé podnikání",
    headline: "Získejte web, který z návštěvníků dělá poptávky.",
    subheadline:
      "OPTIMATEO postaví rychlý web s jasnou nabídkou, kontaktem a měřením reklam. Bez složitého projektu a měsíců čekání.",
    cta: "Chci web pro živnost",
    packageLabel: "Start pro živnostníky",
    price: formatWebPackagePrice("LITE_WEB", true),
    proof: "Ideální pro řemeslníky, poradce, specialisty, salony a lokální služby.",
    pains: ["Nemáte čas řešit technické detaily", "Web dnes nepřivádí poptávky", "Potřebujete působit důvěryhodně před spuštěním reklamy"],
    deliverables: ["Jednostránkový nebo vícestránkový web", "Texty zaměřené na poptávku", "Kontaktní formulář a měření konverzí"],
    keywords: ["rychlé spuštění", "férová cena", "lead formulář"],
  },
  b2b: {
    slug: "b2b",
    eyebrow: "B2B lead-gen web",
    headline: "Proměňte firemní web na zdroj kvalifikovaných poptávek.",
    subheadline:
      "Navrhneme landing page, obsah a tracking pro kampaně, které mají obchodníkům nosit konkrétní leady, ne jen anonymní návštěvy.",
    cta: "Chci B2B lead-gen",
    packageLabel: "B2B růstový balíček",
    price: `${formatWebPackagePrice("WEB_AUTOMATION", true)} podle rozsahu`,
    proof: "Pro firmy, které prodávají služby, technologie, výrobu nebo komplexní řešení.",
    pains: ["Dlouhý obchodní cyklus bez jasného follow-upu", "Málo kvalifikovaných poptávek", "Chybí měření kampaní a obchodní argumenty"],
    deliverables: ["Segmentová landing page", "Argumentace pro rozhodovatele", "Sklik tracking a konverzní funnel"],
    keywords: ["lead generation", "B2B argumentace", "měření ROI"],
  },
  remeslnici: {
    slug: "remeslnici",
    eyebrow: "Web pro řemeslníky",
    headline: "Více zakázek z okolí bez zbytečné administrativy.",
    subheadline:
      "Elektrikář, instalatér, truhlář nebo stavební parta. Uděláme web, který jasně ukáže služby, lokalitu, reference a rychlý kontakt.",
    cta: "Chci více zakázek",
    packageLabel: "Lokální poptávkový web",
    price: formatWebPackagePrice("LITE_WEB", true),
    proof: "Postavené pro lokální hledání a rychlé telefonické poptávky.",
    pains: ["Zákazníci vás nenajdou na mobilu", "Reference nejsou dobře vidět", "Telefon a formulář jsou schované"],
    deliverables: ["Služby a lokality na jedné stránce", "Mobilní CTA na telefon", "Reference, fotky prací a formulář"],
    keywords: ["lokální SEO", "telefonní CTA", "reference"],
  },
  restaurace: {
    slug: "restaurace",
    eyebrow: "Web pro restaurace a bistra",
    headline: "Menu, rezervace a akce přehledně na jednom místě.",
    subheadline:
      "Vytvoříme web, na kterém host rychle najde nabídku, otevírací dobu, cestu i jednoduchou rezervaci.",
    cta: "Chci web pro restauraci",
    packageLabel: "ONYX WEB pro gastro",
    price: formatWebPackagePrice("BASIC_WEB", true),
    proof: "Pro restaurace, bistra, bary, rozvoz a menší gastro provozy.",
    pains: ["Menu je jen na sociálních sítích", "Rezervace chodí chaoticky", "Hosté těžko hledají otevírací dobu a kontakt"],
    deliverables: ["Menu, fotky a otevírací doba", "Rezervace nebo objednávka", "Měření rezervací a kampaní"],
    keywords: ["menu", "rezervace", "lokální kampaně"],
  },
  kavarny: {
    slug: "kavarny",
    eyebrow: "Web pro kavárny",
    headline: "Nabídka, otevírací doba a akce, které host najde hned.",
    subheadline:
      "Postavíme příjemný mobilní web pro kavárnu, kde snadno ukážete menu, snídaně, vlastní produkty, akce i rezervaci stolku.",
    cta: "Chci web pro kavárnu",
    packageLabel: "ONYX WEB pro kavárnu",
    price: formatWebPackagePrice("BASIC_WEB", true),
    proof: "Pro malé kavárny, pražírny, cukrárny a snídaňová bistra.",
    pains: ["Nabídka je roztroušená na sociálních sítích", "Host neví, zda máte otevřeno", "Akce a vlastní produkty nemají jedno místo"],
    deliverables: ["Menu a aktuální otevírací doba", "Galerie, akce a rezervace", "Možnost prodeje kávy nebo poukazů"],
    keywords: ["menu", "otevírací doba", "akce a rezervace"],
  },
  cajovny: {
    slug: "cajovny",
    eyebrow: "Web pro čajovny",
    headline: "Čajová nabídka, atmosféra a rezervace na jednom místě.",
    subheadline:
      "Vytvoříme web, který hostům přiblíží váš prostor, čaje i akce a umožní jim snadno najít cestu nebo rezervovat místo.",
    cta: "Chci web pro čajovnu",
    packageLabel: "ONYX WEB pro čajovnu",
    price: formatWebPackagePrice("BASIC_WEB", true),
    proof: "Pro čajovny, čajové obchody, kluby a komorní kulturní prostory.",
    pains: ["Nabídka a program se špatně hledají", "Atmosféra podniku na webu nevynikne", "Rezervace a dotazy chodí různými cestami"],
    deliverables: ["Čajová nabídka, fotky a program", "Kontakt, mapa a rezervace", "Možnost prodeje čajů nebo poukazů"],
    keywords: ["čajová nabídka", "program", "rezervace"],
  },
  salony: {
    slug: "salony",
    eyebrow: "Web pro salony a beauty služby",
    headline: "Plnější diář díky webu, který umí prodávat termín.",
    subheadline:
      "Ukážeme služby, ceny, důvěru a rychlé objednání tak, aby klient nemusel hledat informace ve zprávách.",
    cta: "Chci plnější diář",
    packageLabel: "Beauty booking web",
    price: formatWebPackagePrice("BASIC_WEB", true),
    proof: "Pro kadeřnictví, kosmetiku, masáže, nehtová studia a wellness.",
    pains: ["Objednávky se ztrácí ve zprávách", "Ceník není přehledný", "Klienti nevidí výsledky a recenze"],
    deliverables: ["Služby, ceny a galerie", "Objednávací CTA", "Recenze a kampaňové měření"],
    keywords: ["online objednání", "ceník", "recenze"],
  },
  ecommerce: {
    slug: "ecommerce",
    eyebrow: "Landing pages pro e-commerce",
    headline: "Produktové kampaně, které vedou k objednávce.",
    subheadline:
      "Připravíme prodejní landing page pro konkrétní produkt, kategorii nebo akci včetně argumentace, CTA a měření.",
    cta: "Chci prodejní landing page",
    packageLabel: "E-commerce kampaň",
    price: formatWebPackagePrice("WEB_LEAD_GEN", true),
    proof: "Pro e-shopy, produktové kampaně, sezóny a limitované nabídky.",
    pains: ["Reklama vede na obecnou kategorii", "Zákazník nevidí důvody ke koupi", "Chybí měření mikrokonverzí"],
    deliverables: ["Prodejní struktura stránky", "Napojení na produkt nebo poptávku", "Retargeting publika pro nedokončené nákupy"],
    keywords: ["produktová kampaň", "retargeting", "konverzní struktura"],
  },
};

const DEFAULT_SEGMENT = SEGMENTS.zivnostnici;

function getSegmentFromPath(location: string) {
  return location.split("/").filter(Boolean).pop() || DEFAULT_SEGMENT.slug;
}

export default function SklikLandingPage() {
  const [location] = useLocation();
  const segment = useMemo(() => SEGMENTS[getSegmentFromPath(location)] ?? DEFAULT_SEGMENT, [location]);
  const dotaznikUrl = `/dotaznik?zdroj=sklik&segment=${segment.slug}`;
  const webUrl = `/web?zdroj=sklik&segment=${segment.slug}`;
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formStarted, setFormStarted] = useState(false);
  const createInquiry = trpc.inquiries.create.useMutation();

  const markFormStarted = () => {
    if (formStarted) return;
    setFormStarted(true);
    void trackEvent("form_start", { formName: "sklik-inline", segment: segment.slug });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.includes("@") || !form.phone.trim()) {
      toast.error("Vyplňte prosím jméno, telefon a platný e-mail.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createInquiry.mutateAsync({
        name: form.name,
        email: form.email,
        phone: form.phone,
        businessDescription: form.company || segment.proof,
        packageType: segment.packageLabel,
        source: `sklik:${segment.slug}`,
        details: { segment: segment.slug, company: form.company, ...getAttribution() },
        linkedinConsent: isChannelConsented("linkedin"),
      } as any);

      trackSklikConversion({ orderId: `lead-${result.id}` });
      trackLinkedInConversion();
      void trackEvent("form_submit", { formName: "sklik-inline", segment: segment.slug, inquiryId: result.id });
      window.dispatchEvent(new CustomEvent("lead:sklik", { detail: { segment: segment.slug, inquiryId: result.id } }));
      setSubmitted(true);
    } catch {
      toast.error("Poptávku se nepodařilo odeslat. Zkuste to prosím znovu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#061421] pb-16 text-white sm:pb-0">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#061421]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="/" aria-label="OPTIMATEO">
            <OptimateoLogo className="h-8" light />
          </a>
          <a href="#poptavka" className="hidden sm:block">
            <Button className="rounded-full bg-white text-slate-950 hover:bg-slate-100">Nezávazná poptávka</Button>
          </a>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white/8 px-4 py-2 text-sm font-semibold text-cyan-100">
              <Sparkles className="h-4 w-4" />
              {segment.eyebrow}
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              {segment.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{segment.subheadline}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#poptavka" onClick={() => trackEvent('cta_click', { label: segment.slug, cta: segment.cta })}>
                <Button size="lg" className="w-full rounded-full bg-sky-600 font-bold text-white shadow-lg shadow-sky-950/30 hover:bg-sky-500 sm:w-auto">
                  {segment.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href={webUrl} onClick={() => trackEvent('cta_click', { label: segment.slug, cta: 'Ukázat webový balíček' })}>
                <Button size="lg" variant="outline" className="w-full rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 sm:w-auto">
                  Ukázat webový balíček
                </Button>
              </a>
            </div>
            <p className="mt-5 text-sm text-slate-400">{segment.proof}</p>
          </div>

          <aside id="poptavka" className="scroll-mt-24 rounded-lg border border-white/10 bg-white p-6 text-slate-900 shadow-2xl shadow-black/30 sm:p-7">
            {submitted ? (
              <div className="flex min-h-96 flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                <h2 className="mt-5 text-2xl font-bold">Poptávka je odeslaná</h2>
                <p className="mt-3 leading-7 text-slate-600">Ozveme se do jednoho pracovního dne. Podrobnosti můžete mezitím doplnit v krátkém dotazníku.</p>
                <a href={dotaznikUrl} className="mt-6 font-bold text-sky-700 hover:text-sky-800">Doplnit zadání <ArrowRight className="ml-1 inline h-4 w-4" /></a>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold uppercase tracking-wider text-sky-700">Nezávazný návrh</p>
                <h2 className="mt-2 text-2xl font-bold">{segment.packageLabel}</h2>
                <p className="mt-2 text-lg font-bold text-slate-900">{segment.price}</p>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit} onFocus={markFormStarted}>
                  <div><label className="text-sm font-semibold" htmlFor="lp-name">Jméno *</label><input id="lp-name" autoComplete="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" /></div>
                  <div><label className="text-sm font-semibold" htmlFor="lp-company">Firma nebo obor</label><input id="lp-company" autoComplete="organization" value={form.company} onChange={event => setForm({ ...form, company: event.target.value })} className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="text-sm font-semibold" htmlFor="lp-email">E-mail *</label><input id="lp-email" type="email" autoComplete="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" /></div>
                    <div><label className="text-sm font-semibold" htmlFor="lp-phone">Telefon *</label><input id="lp-phone" type="tel" autoComplete="tel" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" /></div>
                  </div>
                  <Button type="submit" disabled={submitting} className="h-12 w-full rounded-lg bg-sky-600 font-bold text-white hover:bg-sky-700">{submitting ? "Odesílám…" : segment.cta}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                  <p className="text-xs leading-5 text-slate-500">Odesláním žádáte o kontakt k této poptávce. Marketingové měření se řídí vaším nastavením cookies.</p>
                </form>
              </>
            )}
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 lg:grid-cols-3">
        {segment.pains.map((pain) => (
          <div key={pain} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
            <ShieldCheck className="mb-4 h-6 w-6 text-cyan-300" />
            <p className="font-semibold leading-7 text-slate-100">{pain}</p>
          </div>
        ))}
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3">
          <div className="flex gap-4">
            <Clock className="h-7 w-7 shrink-0 text-cyan-300" />
            <div>
              <h3 className="font-bold">Start do 1–2 týdnů</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Rychle ověříme nabídku, texty a strukturu stránky.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <TrendingUp className="h-7 w-7 shrink-0 text-sky-300" />
            <div>
              <h3 className="font-bold">Měřitelný výkon</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Každá kampaň má vlastní URL, publikum a konverzní cíl.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <MessageCircle className="h-7 w-7 shrink-0 text-blue-300" />
            <div>
              <h3 className="font-bold">Návrh zdarma</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Po odeslání pošleme konkrétní doporučení a další krok.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Pro kampaně</p>
          <h2 className="mt-3 text-3xl font-extrabold">Připravené reklamní argumenty</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {segment.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-slate-100">
                {keyword}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#poptavka" onClick={() => trackEvent('cta_click', { label: segment.slug, cta: 'Přejít na poptávku' })}>
              <Button size="lg" className="w-full rounded-full bg-white text-slate-950 hover:bg-slate-100 sm:w-auto">
                Nezávazná poptávka
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="tel:+420731348984" onClick={() => trackEvent('click_tel', { label: segment.slug })} className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10">
              Zavolat na konzultaci
            </a>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-slate-200 bg-white p-2 shadow-2xl sm:hidden">
        <a href="tel:+420731348984" onClick={() => trackEvent("click_tel", { label: segment.slug, location: "mobile-sticky" })} className="flex h-11 items-center justify-center rounded-lg text-sm font-bold text-slate-800">Zavolat</a>
        <a href="#poptavka" onClick={() => trackEvent("cta_click", { label: segment.slug, location: "mobile-sticky" })} className="flex h-11 items-center justify-center rounded-lg bg-sky-600 text-sm font-bold text-white">Poptávka</a>
      </div>
    </main>
  );
}

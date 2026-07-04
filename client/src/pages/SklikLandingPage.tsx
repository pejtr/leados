import { ArrowRight, CheckCircle2, Clock, MessageCircle, ShieldCheck, Sparkles, Target, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";
import { OnyxWebLogo } from "@/components/OnyxWebLogo";
import { Button } from "@/components/ui/button";

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
    eyebrow: "Web pro OSVC a male podnikani",
    headline: "Ziskejte web, ktery z navstevniku dela poptavky.",
    subheadline:
      "OPTIMATEO postavi rychly web s jasnou nabidkou, kontaktem a merenim reklam. Bez sloziteho projektu a bez mesicu cekani.",
    cta: "Chci web pro zivnost",
    packageLabel: "Start pro zivnostniky",
    price: "od 3 490 Kc + sprava od 179 Kc/mes.",
    proof: "Idealni pro remeslniky, poradce, specialisty, salony a lokalni sluzby.",
    pains: ["Nemate cas resit technicke detaily", "Web dnes neprivadi poptavky", "Potrebujete vypadat duveryhodne pred reklamou"],
    deliverables: ["Jednostrankovy nebo vicestrankovy web", "Texty zamerene na poptavku", "Kontaktni formular a mereni konverzi"],
    keywords: ["rychle spusteni", "ferova cena", "lead formular"],
  },
  b2b: {
    slug: "b2b",
    eyebrow: "B2B lead-gen web",
    headline: "Promente firemni web na zdroj kvalifikovanych poptavek.",
    subheadline:
      "Navrhneme landing page, obsah a tracking pro kampane, ktere maji obchodnikum nosit konkretni leady, ne jen anonymni navstevy.",
    cta: "Chci B2B lead-gen",
    packageLabel: "B2B rustovy balicek",
    price: "od 9 990 Kc podle rozsahu",
    proof: "Pro firmy, ktere prodavaji sluzby, technologie, vyrobu nebo komplexni reseni.",
    pains: ["Dlouhy obchodni cyklus bez jasneho follow-upu", "Malo kvalifikovanych poptavek", "Chybi mereni kampani a obchodni argumenty"],
    deliverables: ["Segmentova landing page", "Argumentace pro rozhodovatele", "Sklik tracking a konverzni funnel"],
    keywords: ["lead generation", "B2B argumentace", "mereni ROI"],
  },
  remeslnici: {
    slug: "remeslnici",
    eyebrow: "Web pro remeslniky",
    headline: "Vice zakazek z okoli bez zbytecne administrativy.",
    subheadline:
      "Elektrikar, instalater, truhlar nebo stavebni parta. Udelame web, ktery jasne ukaze sluzby, lokalitu, reference a rychly kontakt.",
    cta: "Chci vice zakazek",
    packageLabel: "Lokalni poptavkovy web",
    price: "od 3 490 Kc",
    proof: "Postavene pro lokalni hledani a rychle telefonicke poptavky.",
    pains: ["Zakaznici vas nenajdou na mobilu", "Reference nejsou dobre videt", "Telefon a formular jsou schovane"],
    deliverables: ["Sluzby a lokality na jedne strance", "Mobilni CTA na telefon", "Reference, fotky praci a formular"],
    keywords: ["lokalni SEO", "telefonni CTA", "reference"],
  },
  restaurace: {
    slug: "restaurace",
    eyebrow: "Web pro restaurace a kavarny",
    headline: "Menu, rezervace a akce prehledne na jednom miste.",
    subheadline:
      "Vytvorime web, ktery hostum rychle ukaze, proc prijit, co si dat a jak si rezervovat misto.",
    cta: "Chci rezervace z webu",
    packageLabel: "Gastro web",
    price: "od 4 990 Kc",
    proof: "Pro restaurace, kavarny, bistra, bary a event prostory.",
    pains: ["Menu je jen na socialnich sitich", "Rezervace chodi chaoticky", "Akce a novinky nejsou meritelne"],
    deliverables: ["Menu a fotogalerie", "Rezervacni CTA", "Mereni rezervaci a kampani"],
    keywords: ["menu", "rezervace", "lokalni kampane"],
  },
  salony: {
    slug: "salony",
    eyebrow: "Web pro salony a beauty sluzby",
    headline: "Plnejsi diar diky webu, ktery umi prodavat termin.",
    subheadline:
      "Ukazeme sluzby, ceny, duveru a rychle objednani tak, aby klient nemusel hledat informace ve zpravach.",
    cta: "Chci plnejsi diar",
    packageLabel: "Beauty booking web",
    price: "od 4 990 Kc",
    proof: "Pro kadernictvi, kosmetiku, masaze, nehtova studia a wellness.",
    pains: ["Objednavky se ztraci ve zprávach", "Cenik neni prehledny", "Klienti nevidi vysledky a recenze"],
    deliverables: ["Sluzby, ceny a galerie", "Objednavaci CTA", "Recenze a kampanove mereni"],
    keywords: ["online objednani", "cenik", "recenze"],
  },
  ecommerce: {
    slug: "ecommerce",
    eyebrow: "Landing pages pro e-commerce",
    headline: "Produktove kampane, ktere vedou k objednavce.",
    subheadline:
      "Pripravime prodejni landing page pro konkretni produkt, kategorii nebo akci vcetne argumentace, CTA a mereni.",
    cta: "Chci prodejni landing page",
    packageLabel: "E-commerce kampan",
    price: "od 7 990 Kc",
    proof: "Pro e-shopy, produktove kampane, sezony a limitovane nabidky.",
    pains: ["Reklama vede na obecnou kategorii", "Zakaznik nevidi duvody ke koupi", "Chybi mereni mikrokonverzi"],
    deliverables: ["Prodejni struktura stranky", "Napojeni na produkt nebo poptavku", "Retargeting publika pro nedokoncene nakupy"],
    keywords: ["produktova kampan", "retargeting", "konverzni struktura"],
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

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="/" aria-label="OPTIMATEO">
            <OnyxWebLogo className="h-8" light />
          </a>
          <a href={dotaznikUrl} className="hidden sm:block">
            <Button className="rounded-full bg-white text-slate-950 hover:bg-slate-100">Nezavazna poptavka</Button>
          </a>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,139,255,0.26),transparent_30%),radial-gradient(circle_at_78%_16%,rgba(198,20,255,0.24),transparent_28%)]" />
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
              <a href={dotaznikUrl}>
                <Button size="lg" className="w-full rounded-full bg-gradient-to-r from-sky-500 to-fuchsia-500 font-bold text-white shadow-lg shadow-fuchsia-900/30 sm:w-auto">
                  {segment.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href={webUrl}>
                <Button size="lg" variant="outline" className="w-full rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 sm:w-auto">
                  Ukazat webovy balicek
                </Button>
              </a>
            </div>
            <p className="mt-5 text-sm text-slate-400">{segment.proof}</p>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Nabidka</p>
                <h2 className="mt-2 text-2xl font-bold">{segment.packageLabel}</h2>
              </div>
              <Target className="h-9 w-9 text-fuchsia-300" />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-white">{segment.price}</p>
            <div className="mt-6 space-y-3">
              {segment.deliverables.map((item) => (
                <div key={item} className="flex gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-7 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Reklamni priprava v cene</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Stranka je pripravena na Sklik retargeting, konverzni hit po odeslani poptavky a segmentaci kampani podle URL.
              </p>
            </div>
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
              <h3 className="font-bold">Start do 1-2 tydnu</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Rychle validujeme nabidku, texty a strukturu stranky.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <TrendingUp className="h-7 w-7 shrink-0 text-fuchsia-300" />
            <div>
              <h3 className="font-bold">Meritelny vykon</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Kazda kampan ma vlastni URL, publikum a konverzni cil.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <MessageCircle className="h-7 w-7 shrink-0 text-blue-300" />
            <div>
              <h3 className="font-bold">Navrh zdarma</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Po dotazniku posleme konkretni doporuceni a dalsi krok.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-sky-500/16 to-fuchsia-500/16 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Pro kampane</p>
          <h2 className="mt-3 text-3xl font-extrabold">Pripravene reklamni argumenty</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {segment.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-slate-100">
                {keyword}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={dotaznikUrl}>
              <Button size="lg" className="w-full rounded-full bg-white text-slate-950 hover:bg-slate-100 sm:w-auto">
                Vyplnit kratky dotaznik
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="tel:+420731348984" className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10">
              Zavolat konzultaci
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

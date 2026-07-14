import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { activeConfig } from "@shared/brand-config";
import {
  CORE_OFFERS,
  WEB_PACKAGES,
  formatOfferPrice,
  formatWebPackagePrice,
  type WebPackageId,
} from "@shared/service-catalog";

const coreOffers = Object.values(CORE_OFFERS);
const webPackageOrder: WebPackageId[] = ["LITE_WEB", "BASIC_WEB", "WEB_LEAD_GEN", "WEB_AUTOMATION"];

const webPackageFeatures: Record<WebPackageId, readonly string[]> = {
  LITE_WEB: ["Jedna prodejní stránka", "Kontaktní formulář", "Základní konverzní měření"],
  BASIC_WEB: ["Více klíčových stránek", "Responzivní zobrazení", "Kontaktní formulář a měření"],
  WEB_LEAD_GEN: ["Konverzní struktura", "UTM atribuce", "Napojení poptávek"],
  WEB_AUTOMATION: ["Pokročilý lead flow", "Automatická reakce", "Správa a předání leadů"],
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" aria-label="OPTIMATEO"><OptimateoLogo className="h-8" /></a>
          <a href={CORE_OFFERS.MINI_AUDIT.href} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800">Prověřit web zdarma</a>
        </div>
      </nav>

      <section className="border-b border-slate-200 bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-violet-700">Služby a ceny</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Jedna nabídka. Dvě úrovně podle rozsahu.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">Menší web lze dodat jako pevně vymezený balíček. Web, CRM a automatizace pro obchodní růst začínají auditem a písemným rozsahem.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-9 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-violet-700">Hlavní prodejní cesta</p>
            <h2 className="mt-2 text-3xl font-black">Od ověření problému k realizaci</h2>
            <p className="mt-3 leading-7 text-slate-600">Mini audit je výchozí krok. Placený audit, Setup a Monitoring na sebe navazují a mají jednotné parametry napříč webem.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {coreOffers.map(offer => (
              <article key={offer.id} className={`flex flex-col rounded-lg border bg-white p-6 ${offer.id === "onyx-os-audit" ? "border-violet-500 shadow-lg shadow-violet-100" : "border-slate-200"}`}>
                {offer.id === "onyx-os-audit" && <span className="mb-4 w-fit rounded bg-violet-100 px-2.5 py-1 text-xs font-bold uppercase text-violet-800">Doporučený další krok</span>}
                <h3 className="text-xl font-bold">{offer.name}</h3>
                <p className="mt-2 min-h-20 text-sm leading-6 text-slate-600">{offer.description}</p>
                <p className="mt-5 text-3xl font-black">{formatOfferPrice(offer)}</p>
                <ul className="my-7 flex-1 space-y-3">
                  {offer.features.map(feature => <li key={feature} className="flex gap-2 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}
                </ul>
                <a href={offer.href} className={`flex items-center justify-center rounded-lg px-4 py-3 text-sm font-bold ${offer.id === "onyx-os-audit" ? "bg-violet-600 text-white hover:bg-violet-700" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}>{offer.cta}<ArrowRight className="ml-2 h-4 w-4" /></a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-9 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-700">Pro malé podnikání</p>
            <h2 className="mt-2 text-3xl font-black">Pevně vymezené webové balíčky</h2>
            <p className="mt-3 leading-7 text-slate-600">Pro živnostníky a menší služby, které nepotřebují kompletní CRM řešení. Přesný rozsah potvrdíme před objednávkou.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {webPackageOrder.map(packageId => {
              const webPackage = WEB_PACKAGES[packageId];
              return (
                <article key={packageId} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
                  <h3 className="text-xl font-bold">{webPackage.name}</h3>
                  <p className="mt-2 min-h-20 text-sm leading-6 text-slate-600">{webPackage.description}</p>
                  <p className="mt-5 text-3xl font-black">{formatWebPackagePrice(packageId)}</p>
                  <ul className="my-7 flex-1 space-y-3">
                    {webPackageFeatures[packageId].map(feature => <li key={feature} className="flex gap-2 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}
                  </ul>
                  <a href={`/dotaznik?zdroj=pricing&segment=${packageId.toLowerCase()}`} className="flex items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">Ověřit vhodný balíček<ArrowRight className="ml-2 h-4 w-4" /></a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div>
            <ShieldCheck className="h-9 w-9 text-violet-600" />
            <h2 className="mt-4 text-3xl font-bold">Bez skrytého rozsahu</h2>
            <p className="mt-4 leading-7 text-slate-600">Před realizací dostanete písemný rozsah, harmonogram a cenu. Práce nad rámec se nespouští bez předchozí dohody.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Konkrétní výstup každé fáze", "Předem známý další krok", "Měření zdroje poptávek", "Možnost začít bez závazku"].map(item => <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 font-semibold"><Check className="h-5 w-5 text-emerald-600" />{item}</div>)}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-bold">Nejste si jistí, kde začít?</h2>
          <p className="mt-4 text-lg text-slate-300">Pošlete web do mini auditu. Doporučíme nejmenší smysluplný krok, ne nejdražší balíček.</p>
          <a href={CORE_OFFERS.MINI_AUDIT.href} className="mt-8 inline-flex items-center rounded-full bg-white px-7 py-3 font-bold text-slate-900 hover:bg-slate-100">{CORE_OFFERS.MINI_AUDIT.cta}<ArrowRight className="ml-2 h-4 w-4" /></a>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 px-4 py-8 text-center text-sm text-slate-500">© 2026 OPTIMATEO · {activeConfig.legalName} · IČO {activeConfig.billingInfo.companyId}</footer>
    </main>
  );
}

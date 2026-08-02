import { useState } from "react";
import { useLocation } from "wouter";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Sparkles, Calculator, ShieldCheck, Zap, TrendingUp, Layers } from "lucide-react";
import { motion } from "framer-motion";

const BASE_WEBS = [
  { id: "LITE", name: "Lite Web", price: 9900, desc: "Jednostránkový responzivní web s kontaktem a CTA pro živnostníky a řemeslníky.", time: "1 týden" },
  { id: "LEAD", name: "Lead Web", price: 24900, desc: "Vícestránkový konverzní web s CRM napojením a měřením Sklik/GA4.", time: "1–2 týdny", popular: true },
  { id: "ESHOP", name: "E-shop / Gastro", price: 39900, desc: "Online prodej produktů, kurzů, poukazů nebo menu s rozvozem.", time: "2–3 týdny" },
];

const ADDONS = [
  { id: "sms", name: "SMS notifikace leadů na mobil", price: 2900, desc: "Rychlá SMS notifikace při každé nové poptávce z webu." },
  { id: "booking", name: "Online rezervace a kalendář", price: 3500, desc: "Napojení Cal.com/Reservio pro automatický výběr termínu schůzky." },
  { id: "crm", name: "CRM Setup & Automatický follow-up", price: 4900, desc: "Přehledná databáze leadů + automatická e-mailová sekvence." },
  { id: "seo", name: "Lokální SEO & Google Maps profil", price: 5900, desc: "Optimalizace pro vyhledávače v okolí a Google Moje Firma." },
];

const SUBSCRIPTIONS = [
  { id: "none", name: "Bez měsíční péče", price: 0, desc: "Jednorázové předání webu bez dalších závazků." },
  { id: "monitoring", name: "ONYX OS Monitoring", price: 1900, desc: "Pravidelná kontrola funkčnosti, měsíční report a drobné úpravy.", popular: true },
  { id: "optihub", name: "Full Optimization Hub", price: 3900, desc: "A/B testování konverzí, kontinuální SEO a priorita podpory." },
];

export default function KalkulackaPage() {
  const [, setLocation] = useLocation();

  const [selectedWeb, setSelectedWeb] = useState(BASE_WEBS[1]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(["crm"]);
  const [selectedSub, setSelectedSub] = useState(SUBSCRIPTIONS[1]);

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const addonsTotal = ADDONS.filter(a => selectedAddons.includes(a.id)).reduce((acc, a) => acc + a.price, 0);
  const oneTimeTotal = selectedWeb.price + addonsTotal;
  const depositAmount = Math.round(oneTimeTotal / 2);
  const monthlyTotal = selectedSub.price;

  const handleOrderRedirect = () => {
    setLocation(`/checkout?product=FIX_SPRINT&amount=${oneTimeTotal}`);
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-white font-[Plus_Jakarta_Sans,Inter,sans-serif]">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <OptimateoLogo className="h-8" light />
          </a>
          <button onClick={() => setLocation("/")} className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Hlavní stránka
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            🧮 Interaktivní konfigurátor
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-4 mb-4">
            Kalkulačka řešení na míru
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Sestavte si web, automatizace a péči podle vašich potřeb. Vypočítejte si cenu a okamžitou návratnost.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Options Section */}
          <div className="md:col-span-7 space-y-8">
            {/* Step 1: Base Web */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-white">
                <Layers className="w-4 h-4 text-violet-400" /> 1. Vyberte základní rozsah webu
              </h2>
              <p className="text-xs text-slate-400 mb-4">Základní architektura a konverzní struktura.</p>

              <div className="space-y-3">
                {BASE_WEBS.map((web) => (
                  <div
                    key={web.id}
                    onClick={() => setSelectedWeb(web)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedWeb.id === web.id
                        ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-900/20"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white flex items-center gap-2">
                        {web.name}
                        {web.popular && <span className="text-[10px] bg-violet-500/30 border border-violet-400/40 text-violet-200 px-2 py-0.5 rounded-full font-bold">Doporučeno</span>}
                      </span>
                      <span className="text-xs font-extrabold text-violet-300">{web.price.toLocaleString("cs-CZ")} Kč</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">{web.desc}</p>
                    <span className="text-[10px] text-slate-500">Doba realizace: {web.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Addons */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-white">
                <Zap className="w-4 h-4 text-amber-400" /> 2. Volitelné automatizace a funkce
              </h2>
              <p className="text-xs text-slate-400 mb-4">Doplňky pro zrychlení zpracování poptávek.</p>

              <div className="space-y-3">
                {ADDONS.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked
                          ? "border-amber-500/50 bg-amber-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-colors ${isChecked ? "bg-amber-500 border-amber-500 text-black" : "border-slate-600 bg-slate-900"}`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-white">{addon.name}</span>
                          <span className="text-xs font-extrabold text-amber-300">+{addon.price.toLocaleString("cs-CZ")} Kč</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{addon.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Subscription */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-white">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> 3. Měsíční správa a růst
              </h2>
              <p className="text-xs text-slate-400 mb-4">Pravidelný dohled a optimalizace konverzí.</p>

              <div className="space-y-3">
                {SUBSCRIPTIONS.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSub(sub)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedSub.id === sub.id
                        ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-900/20"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white flex items-center gap-2">
                        {sub.name}
                        {sub.popular && <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">Nejoblíbenější</span>}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-400">{sub.price === 0 ? "0 Kč" : `${sub.price.toLocaleString("cs-CZ")} Kč/měs`}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{sub.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Summary Card */}
          <div className="md:col-span-5 bg-gradient-to-b from-violet-900/40 to-indigo-950/60 border border-violet-500/30 rounded-3xl p-6 md:p-8 shadow-2xl sticky top-24">
            <h2 className="text-lg font-bold mb-4 text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-violet-400" /> Rekapitulace nabídky
            </h2>

            <div className="space-y-3 text-xs mb-6">
              <div className="flex justify-between text-slate-300">
                <span>Základní web ({selectedWeb.name}):</span>
                <span className="font-bold text-white">{selectedWeb.price.toLocaleString("cs-CZ")} Kč</span>
              </div>

              {selectedAddons.length > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Doplňky a automatizace ({selectedAddons.length}):</span>
                  <span className="font-bold text-amber-300">+{addonsTotal.toLocaleString("cs-CZ")} Kč</span>
                </div>
              )}

              <div className="flex justify-between text-slate-300 border-t border-white/10 pt-2 font-bold text-sm">
                <span>Jednorázově celkem:</span>
                <span className="text-violet-300">{oneTimeTotal.toLocaleString("cs-CZ")} Kč</span>
              </div>

              <div className="flex justify-between text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                <span>50% Záloha ke spuštění:</span>
                <span>{depositAmount.toLocaleString("cs-CZ")} Kč</span>
              </div>

              {monthlyTotal > 0 && (
                <div className="flex justify-between text-slate-300 text-xs border-t border-white/10 pt-2">
                  <span>Měsíční správa:</span>
                  <span className="font-bold text-emerald-400">{monthlyTotal.toLocaleString("cs-CZ")} Kč / měsíc</span>
                </div>
              )}
            </div>

            <Button onClick={handleOrderRedirect} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-lg shadow-violet-900/40">
              Zaplatit zálohu ({depositAmount.toLocaleString("cs-CZ")} Kč) →
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-400 mt-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Nezávazná konfigurace · Garance kvality
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

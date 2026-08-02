import { useState } from "react";
import { useLocation } from "wouter";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, TrendingUp, DollarSign, Users, ShieldCheck, Sparkles, Zap, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function RoiKalkulackaPage() {
  const [, setLocation] = useLocation();

  const [avgCustomerValue, setAvgCustomerValue] = useState(5000);
  const [monthlyVisitors, setMonthlyVisitors] = useState(600);
  const [currentConversionRate, setCurrentConversionRate] = useState(1.0);

  // Math calculation
  const currentLeadsPerMonth = Math.round(monthlyVisitors * (currentConversionRate / 100));
  const currentRevenuePerMonth = currentLeadsPerMonth * avgCustomerValue;

  const newConversionRate = currentConversionRate + 2.0; // +2% conversion boost with ONYX WEB
  const newLeadsPerMonth = Math.round(monthlyVisitors * (newConversionRate / 100));
  const newRevenuePerMonth = newLeadsPerMonth * avgCustomerValue;

  const extraMonthlyRevenue = newRevenuePerMonth - currentRevenuePerMonth;
  const onyxWebPrice = 24900;
  const paybackDays = extraMonthlyRevenue > 0 ? Math.max(1, Math.round((onyxWebPrice / extraMonthlyRevenue) * 30)) : 30;

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
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            📈 Kalkulačka Návratnosti (ROI)
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-4 mb-4">
            Za jak dlouho se vám web zaplatí?
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Web není náklad, ale investiční nástroj. Spočěte si přesný finanční přínos zvýšení konverzí pro vaše podnikání.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Inputs */}
          <div className="md:col-span-6 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <h2 className="text-base font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Vstupní parametry vašeho webu
            </h2>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-semibold">Průměrný zisk z 1 zákazníka / zakázky (Kč)</label>
                <span className="font-mono font-bold text-violet-300">{avgCustomerValue.toLocaleString("cs-CZ")} Kč</span>
              </div>
              <input
                type="range"
                min={500}
                max={50000}
                step={500}
                value={avgCustomerValue}
                onChange={e => setAvgCustomerValue(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-semibold">Odhadovaná měsíční návštěvnost webu (lidí/měsíc)</label>
                <span className="font-mono font-bold text-violet-300">{monthlyVisitors.toLocaleString("cs-CZ")} návštěv</span>
              </div>
              <input
                type="range"
                min={100}
                max={10000}
                step={100}
                value={monthlyVisitors}
                onChange={e => setMonthlyVisitors(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-semibold">Odhadovaný současný konverzní poměr (%)</label>
                <span className="font-mono font-bold text-violet-300">{currentConversionRate.toFixed(1)} %</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={5.0}
                step={0.1}
                value={currentConversionRate}
                onChange={e => setCurrentConversionRate(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <p className="text-[11px] text-slate-500 mt-1">Průměrný český web konvertuje cca 0,8 % až 1,5 % návštěvníků.</p>
            </div>
          </div>

          {/* Results Box */}
          <div className="md:col-span-6 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 sticky top-24">
            <h2 className="text-base font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Propočítaný finanční přínos
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="text-[11px] text-slate-400">Současný stav</div>
                <div className="text-lg font-bold text-slate-300 mt-1">{currentLeadsPerMonth} zákazníků/měs</div>
                <div className="text-xs font-mono text-slate-500 mt-0.5">{currentRevenuePerMonth.toLocaleString("cs-CZ")} Kč/měs</div>
              </div>

              <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30">
                <div className="text-[11px] text-emerald-300 font-bold">Po optimalizaci OPTIMATEO (+2 %)</div>
                <div className="text-lg font-extrabold text-emerald-400 mt-1">{newLeadsPerMonth} zákazníků/měs</div>
                <div className="text-xs font-mono text-emerald-300 mt-0.5">{newRevenuePerMonth.toLocaleString("cs-CZ")} Kč/měs</div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Extra tržby každý měsíc navíc:</span>
                <span className="text-emerald-400 font-extrabold text-base">+{extraMonthlyRevenue.toLocaleString("cs-CZ")} Kč / měsíc</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/10 pt-2">
                <span className="text-slate-300 font-medium">Odhadovaná doba návratnosti ONYX WEB:</span>
                <span className="text-violet-300 font-extrabold text-sm">cca {paybackDays} dní ⚡</span>
              </div>
            </div>

            <Button
              onClick={() => setLocation(`/checkout?product=ONYX_WEB`)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-lg shadow-emerald-950/50"
            >
              Chci nový konverzní web a tyto výsledky →
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Měřitelné navýšení konverzí · 100% transparentní kalkulace
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

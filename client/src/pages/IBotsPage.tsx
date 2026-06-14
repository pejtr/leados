import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ibots, categories } from "@/data/ibots";
import { Search, ArrowRight, Target, Heart, Crown, Coins, Sparkles, Activity, Lightbulb, BookOpen, Zap, Lock } from "lucide-react";

// Map category icon names to components
const ICON_MAP: Record<string, React.ElementType> = {
  Target, Heart, Crown, Coins, Sparkles, Activity, Lightbulb,
};

const FEATURED_IDS = [
  "alex-hormozi", "russell-brunson", "frank-kern", "carl-jung",
  "elon-musk", "warren-buffett", "steve-jobs", "napoleon-hill",
  "buddha", "nikola-tesla", "aristotle", "platon",
  "gary-vaynerchuk", "dan-kennedy", "leila-hormozi",
];

export default function IBotsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    return ibots.filter(b => {
      const matchCat = !activeCategory || b.categoryId === activeCategory;
      const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.specialty.toLowerCase().includes(search.toLowerCase()) || b.tags.some(t => t.includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const visible = showAll ? filtered : filtered.slice(0, 12);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* NAV */}
      <nav className="border-b border-white/5 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="text-xl font-extrabold tracking-tight">
            <span className="text-amber-400">OPT</span>IVIO
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/agents" className="text-violet-400 hover:text-violet-200">✨ AI Agenti</a>
            <a href="/" className="text-white/50 hover:text-white">← Zpět</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 border border-amber-400/30 bg-amber-400/5 rounded-full px-4 py-1.5 text-sm text-amber-400 mb-6">
            <Zap className="w-3.5 h-3.5" /> {ibots.length} AI osobností · 7 kategorií
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-4 leading-tight">
            AI chatboti,<br />
            <span className="text-amber-400">kteří prodávají za vás.</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto mb-8">
            Nejlepší světoví marketéři, podnikatelé a psychologové jako AI asistenti pro váš byznys.
            Každý bot je naučen specifickým frameworkem a metodikou.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/agents">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3 rounded-full text-base shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                Vyzkoušet AI Agenty OPTIVIO <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <a href="/#pricing">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full">
                Zobrazit ceny
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="border-y border-white/5 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[["77+", "AI osobností"], ["+327%", "průměrné ROI"], ["7", "kategorií expertízy"], ["5 min", "do nasazení"]].map(([v, l]) => (
            <div key={String(l)}>
              <div className="text-3xl font-extrabold text-amber-400 mb-1">{String(v)}</div>
              <div className="text-white/40 text-sm">{String(l)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CATALOG */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Search + filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Hledat bota... (jméno, specialita, tag)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!activeCategory ? "bg-amber-500 border-amber-500 text-black" : "border-white/20 text-white/60 hover:border-white/40"}`}
              >
                Vše ({ibots.length})
              </button>
              {categories.map(cat => {
                const Icon = ICON_MAP[cat.icon] || BookOpen;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${cat.id === activeCategory ? "bg-amber-500 border-amber-500 text-black" : "border-white/20 text-white/60 hover:border-white/40"}`}
                  >
                    <Icon className="w-3 h-3" /> {cat.name} ({cat.count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visible.map(bot => {
              const isFeatured = FEATURED_IDS.includes(bot.id);
              return (
                <div
                  key={bot.id}
                  className={`relative rounded-2xl p-4 border flex flex-col gap-3 transition-all group ${
                    isFeatured
                      ? "border-amber-400/30 bg-amber-400/5 hover:border-amber-400/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                      : "border-white/10 bg-white/3 hover:border-white/20"
                  }`}
                >
                  {!isFeatured && (
                    <div className="absolute top-2 right-2 text-white/20">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="text-3xl">{bot.avatar}</div>
                  <div>
                    <div className="font-bold text-sm text-white">{bot.name}</div>
                    <div className="text-xs text-amber-400/80 mt-0.5">{bot.specialty}</div>
                    <p className={`text-xs mt-1 leading-relaxed ${isFeatured ? "text-white/60" : "text-white/30"}`}>
                      {isFeatured ? bot.description : "Dostupné v Premium plánu"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {bot.tags.slice(0, 2).map(t => (
                      <span key={t} className="text-[10px] border border-white/10 rounded px-1.5 py-0.5 text-white/40">{t}</span>
                    ))}
                  </div>
                  {isFeatured ? (
                    <a href="/agents">
                      <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-black text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        Spustit agenta →
                      </Button>
                    </a>
                  ) : (
                    <a href="/#pricing">
                      <Button size="sm" variant="outline" className="w-full border-white/10 text-white/30 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        Odemknout v Premium
                      </Button>
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length > 12 && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                className="border-white/20 text-white/60 hover:bg-white/10 rounded-full px-8"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Zobrazit méně" : `Zobrazit všech ${filtered.length} botů`}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Chcete AI chatboty <span className="text-amber-400">pro váš byznys?</span>
          </h2>
          <p className="text-white/40 mb-8">
            OPTIVIO integruje tyto AI osobnosti přímo do vašeho webu nebo Telegram kanálu.
            Nastavení za 5 minut, provoz 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/#pricing">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3 rounded-full">
                Začít s OPTIVIO →
              </Button>
            </a>
            <a href="/agents">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 py-3">
                ✨ AI Agenti Hub
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-white/20 text-sm border-t border-white/5">
        © {new Date().getFullYear()} OPTIVIO · <a href="/agents" className="text-violet-400 hover:text-violet-300">AI Agenti</a>
      </footer>
    </div>
  );
}

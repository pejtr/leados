import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { OptimateoLogo } from "@/components/OptimateoLogo";
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
    <div className="min-h-screen bg-[#061421] text-white">
      {/* NAV */}
      <nav className="border-b border-slate-200 bg-white px-4 py-4 text-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" aria-label="OPTIMATEO">
            <OptimateoLogo className="h-9" />
          </a>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <a href="/agents" className="flex items-center gap-1.5 text-sky-700 hover:text-sky-900">
              <Sparkles className="h-4 w-4" /> AI Asistenti
            </a>
            <a href="/" className="flex items-center gap-1 text-slate-500 hover:text-slate-900">
              <ArrowRight className="h-4 w-4 rotate-180" /> Zpět
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5 px-4 py-20 text-center">
        <div className="absolute inset-x-0 top-0 h-px bg-sky-400/60" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 border border-sky-400/30 bg-sky-400/5 rounded-full px-4 py-1.5 text-sm text-sky-400 mb-6">
            <Zap className="w-3.5 h-3.5" /> {ibots.length} AI osobností · 7 kategorií
          </div>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight lg:text-6xl">
            AI Asistenti,<br />
            <span className="text-sky-400">kteří pracují s vaším kontextem.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg leading-8 text-white/60">
            Vyberte si specializovanou roli pro marketing, prodej, vedení firmy nebo strategii.
            Každý asistent má jasně popsanou oblast a sadu metodik.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/agents">
              <Button className="bg-sky-500 hover:bg-sky-600 text-black font-bold px-8 py-3 rounded-full text-base shadow-[0_0_30px_rgba(14,165,233,0.28)]">
                Vyzkoušet asistenty OPTIMATEO <ArrowRight className="w-4 h-4 ml-2" />
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
          {[[String(ibots.length), "AI osobností"], [String(categories.length), "oblastí expertízy"], ["24/7", "přístup k nástrojům"], ["1", "společný AI Core"]].map(([v, l]) => (
            <div key={String(l)}>
              <div className="text-3xl font-extrabold text-sky-400 mb-1">{String(v)}</div>
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
                placeholder="Hledat asistenta podle jména nebo specializace"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-400/50 transition-colors"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!activeCategory ? "bg-sky-500 border-sky-500 text-black" : "border-white/20 text-white/60 hover:border-white/40"}`}
              >
                Vše ({ibots.length})
              </button>
              {categories.map(cat => {
                const Icon = ICON_MAP[cat.icon] || BookOpen;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${cat.id === activeCategory ? "bg-sky-500 border-sky-500 text-black" : "border-white/20 text-white/60 hover:border-white/40"}`}
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
                  className={`group relative flex flex-col gap-3 rounded-lg border p-4 transition-all ${
                    isFeatured
                      ? "border-sky-400/30 bg-sky-400/5 hover:border-sky-400/60 hover:shadow-[0_0_20px_rgba(14,165,233,0.12)]"
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
                    <div className="text-xs text-sky-400/80 mt-0.5">{bot.specialty}</div>
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
                      <Button size="sm" className="w-full rounded-lg bg-sky-500 text-xs text-slate-950 opacity-100 transition-opacity hover:bg-sky-600 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                        Spustit asistenta <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </a>
                  ) : (
                    <a href="/#pricing">
                      <Button size="sm" variant="outline" className="w-full rounded-lg border-white/15 text-xs text-white/60 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
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
                {showAll ? "Zobrazit méně" : `Zobrazit všech ${filtered.length} asistentů`}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4 text-3xl font-extrabold">
            Chcete AI Asistenty <span className="text-sky-400">zapojit do svého provozu?</span>
          </h2>
          <p className="mb-8 text-white/60">
            OPTIMATEO propojí vybrané asistenty s vaším webem, CRM a firemními daty.
            Integraci navrhneme podle procesu, oprávnění a požadovaného výsledku.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/#pricing">
              <Button className="bg-sky-500 hover:bg-sky-600 text-black font-bold px-8 py-3 rounded-full">
                Začít s OPTIMATEO →
              </Button>
            </a>
            <a href="/agents">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 py-3">
                <Sparkles className="mr-2 h-4 w-4" /> AI Asistenti
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-sm text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
          <a href="/" aria-label="OPTIMATEO">
            <OptimateoLogo className="h-10" light withTagline />
          </a>
          <p>© {new Date().getFullYear()} OPTIMATEO · <a href="/agents" className="text-sky-400 hover:text-sky-300">AI Asistenti</a></p>
        </div>
      </footer>
    </div>
  );
}

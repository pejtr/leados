import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Clock, Search, ChevronRight, X } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  "Pipeline Development": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Outreach & Capture": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Market Intelligence": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Closing & Negotiation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Team & Process": "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export default function KnowledgeBase() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);

  const { data: articles = [], isLoading } = trpc.knowledge.list.useQuery();

  const categories = [...new Set(articles.map(a => a.category))];
  const filtered = articles.filter(a => {
    const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCategory || a.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const article = articles.find(a => a.id === selectedArticle);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="w-6 h-6 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
      </div>
      <p className="text-white/50 text-sm mb-6">B2B sales best practices, BD frameworks, and outreach playbooks</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..." className="bg-white/5 border-white/20 text-white pl-9" />
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${!selectedCategory ? "bg-emerald-500/20 text-emerald-400" : "text-white/60 hover:bg-white/5"}`}
              >
                All Articles ({articles.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${selectedCategory === cat ? "bg-emerald-500/20 text-emerald-400" : "text-white/60 hover:bg-white/5"}`}
                >
                  <span>{cat}</span>
                  <span className="text-xs text-white/30">{articles.filter(a => a.category === cat).length}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Article List / Detail */}
        <div className="lg:col-span-2">
          {article ? (
            <div className="border border-white/10 rounded-xl p-6 bg-white/5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  <Badge variant="outline" className={`text-xs mb-2 border ${CATEGORY_COLORS[article.category] ?? "border-white/20 text-white/50"}`}>
                    {article.category}
                  </Badge>
                  <h2 className="text-xl font-bold text-white">{article.title}</h2>
                  <div className="flex items-center gap-1 mt-1 text-white/40 text-xs">
                    <Clock className="w-3 h-3" /> {article.readTime} min read
                  </div>
                </div>
                <button onClick={() => setSelectedArticle(null)} className="text-white/30 hover:text-white/70 flex-shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                {article.content.split("\n").map((para, i) => (
                  <p key={i} className="text-white/70 leading-relaxed mb-3">{para}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {isLoading && (
                <div className="text-center py-16 text-white/30">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse" />
                  <p>Loading articles...</p>
                </div>
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="text-center py-16 text-white/30 border border-white/10 rounded-xl">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No articles found</p>
                </div>
              )}
              {filtered.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedArticle(a.id)}
                  className="w-full text-left p-4 border border-white/10 rounded-xl bg-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs border ${CATEGORY_COLORS[a.category] ?? "border-white/20 text-white/50"}`}>
                          {a.category}
                        </Badge>
                        <span className="text-white/30 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />{a.readTime} min
                        </span>
                      </div>
                      <h3 className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">{a.title}</h3>
                      <p className="text-white/40 text-xs mt-1 line-clamp-2">{a.content}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

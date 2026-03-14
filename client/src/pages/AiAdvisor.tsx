import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Brain, Search, Trash2, Loader2, MessageCircle, User, Sparkles,
  Clock, BarChart3, BookOpen, Activity, Heart, ChevronRight, ThumbsUp, Star,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

interface Persona {
  id: string;
  name: string;
  title: string;
  specialty: string;
  emoji: string;
  color: string;
  tags: string[];
  category: string;
}

export default function AiAdvisor() {
  const [searchQuery, setSearchQuery] = useState("");

  // SEO: set page title and meta description for /chat-agent
  useEffect(() => {
    document.title = "Chat Agent — 33 AI Expert Personas | LeadOS";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      (metaDesc as HTMLMetaElement).name = "description";
      document.head.appendChild(metaDesc);
    }
    (metaDesc as HTMLMetaElement).content =
      "Chat Agent by LeadOS — 33 AI expert personas including Alex Hormozi, Warren Buffett, Sun Tzu and more. Get sales strategies, growth advice, and B2B lead generation insights powered by AI.";
    return () => {
      document.title = "LeadOS — AI Lead Generation Platform";
    };
  }, []);
  const [selectedPersonaForResume, setSelectedPersonaForResume] = useState<Persona | null>(null);
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);

  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = trpc.aiChat.searchHistory.useQuery(
    { query: searchQuery || undefined, limit: 200 },
    { staleTime: 10_000 }
  );

  const { data: insights, isLoading: insightsLoading } = trpc.aiChat.insights.useQuery(undefined, {
    staleTime: 30_000,
  });

  const { data: personas, isLoading: personasLoading } = trpc.aiChat.getPersonas.useQuery(undefined, {
    staleTime: Infinity,
  });

  const { data: favoriteIds = [], refetch: refetchFavorites } = trpc.aiChat.getFavorites.useQuery(undefined, {
    staleTime: 30_000,
  });

  const { data: personaRatings = [] } = trpc.aiChat.getPersonaRatings.useQuery(undefined, {
    staleTime: 30_000,
  });

  const clearHistoryMutation = trpc.aiChat.clear.useMutation({
    onSuccess: () => {
      refetchHistory();
      toast.success("Chat history cleared");
    },
    onError: () => toast.error("Failed to clear history"),
  });

  const toggleFavoriteMutation = trpc.aiChat.toggleFavorite.useMutation({
    onSuccess: async (result) => {
      await refetchFavorites();
      toast.success(result.favorited ? "Added to favorites" : "Removed from favorites");
    },
    onError: () => toast.error("Failed to update favorites"),
  });

  const favoriteSet = new Set(favoriteIds);

  // Group messages into conversations by time gaps (>30 min = new conversation)
  const conversations = useMemo(() => {
    if (!history || history.length === 0) return [];
    const sorted = [...history].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const groups: { id: string; messages: typeof sorted; startTime: Date; endTime: Date }[] = [];
    let current: typeof sorted = [];
    let lastTime: number | null = null;

    for (const msg of sorted) {
      const t = new Date(msg.createdAt).getTime();
      if (lastTime !== null && t - lastTime > 30 * 60 * 1000) {
        if (current.length > 0) {
          groups.push({
            id: `conv-${groups.length}`,
            messages: current,
            startTime: new Date(current[0].createdAt),
            endTime: new Date(current[current.length - 1].createdAt),
          });
          current = [];
        }
      }
      current.push(msg);
      lastTime = t;
    }
    if (current.length > 0) {
      groups.push({
        id: `conv-${groups.length}`,
        messages: current,
        startTime: new Date(current[0].createdAt),
        endTime: new Date(current[current.length - 1].createdAt),
      });
    }
    return groups.reverse(); // newest first
  }, [history]);

  const [expandedConv, setExpandedConv] = useState<string | null>(null);

  const formatDate = (d: Date) => {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return `Today at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (days === 1) return `Yesterday at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + ` at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const categoriesList = ["Sales & Business", "Wealth & Finance", "Leadership"] as const;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Chat Agent</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Full conversation history, AI memory, and performance insights — powered by 33 expert personas
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPersonaPicker(true)}
              className="gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              New Chat
            </Button>
            {history && history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending}
                className="gap-2 text-destructive hover:text-destructive"
              >
                {clearHistoryMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Messages", value: insights?.stats.totalMessages ?? 0, icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Questions Asked", value: insights?.stats.userMessages ?? 0, icon: User, color: "text-violet-400", bg: "bg-violet-500/10" },
            { label: "AI Memories", value: insights?.learnings?.length ?? 0, icon: BookOpen, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "AI Cycles", value: insights?.stats.totalCycles ?? 0, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{insightsLoading ? "—" : stat.value}</p>
                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat History */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Badge variant="secondary" className="shrink-0">
                {conversations.length} sessions
              </Badge>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No messages match your search." : "No conversations yet."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPersonaPicker(true)}
                    className="gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Start your first conversation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => {
                  const isExpanded = expandedConv === conv.id;
                  const userMsg = conv.messages.find((m) => m.role === "user");
                  const preview = userMsg?.content.slice(0, 120) ?? "Conversation";
                  const msgCount = conv.messages.length;

                  return (
                    <Card key={conv.id} className="bg-card border-border overflow-hidden">
                      <button
                        className="w-full text-left"
                        onClick={() => setExpandedConv(isExpanded ? null : conv.id)}
                      >
                        <CardHeader className="pb-2 pt-3 px-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-[11px] text-muted-foreground">
                                  {formatDate(conv.startTime)}
                                </span>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                  {msgCount} msg{msgCount !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                              <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                                {preview}
                              </p>
                            </div>
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform",
                                isExpanded && "rotate-90"
                              )}
                            />
                          </div>
                        </CardHeader>
                      </button>

                      {isExpanded && (
                        <CardContent className="px-4 pb-4 pt-0">
                          <div className="border-t border-border pt-3 space-y-3 max-h-96 overflow-y-auto">
                            {conv.messages.map((msg, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "flex gap-2",
                                  msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                              >
                                {msg.role === "assistant" && (
                                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <Brain className="h-3 w-3 text-primary" />
                                  </div>
                                )}
                                <div
                                  className={cn(
                                    "max-w-[85%] rounded-xl px-3 py-2",
                                    msg.role === "user"
                                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                                      : "bg-muted text-foreground rounded-tl-sm"
                                  )}
                                >
                                  {msg.role === "assistant" ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                                      <Streamdown>{msg.content}</Streamdown>
                                    </div>
                                  ) : (
                                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                  )}
                                </div>
                                {msg.role === "user" && (
                                  <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                                    <User className="h-3 w-3 text-secondary-foreground" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right sidebar: Favorites + Memories */}
          <div className="space-y-4">
            {/* Favorite Personas */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-rose-500/10">
                    <Heart className="h-4 w-4 text-rose-400" />
                  </div>
                  <CardTitle className="text-base font-semibold">Favorite Experts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {personasLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : favoriteIds.length === 0 ? (
                  <div className="text-center py-4">
                    <Heart className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No favorites yet.</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      Click ♡ on any expert in the chat widget.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(personas ?? [])
                      .filter((p) => favoriteSet.has(p.id))
                      .map((persona) => (
                        <div
                          key={persona.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/40 group"
                        >
                          <span className="text-xl shrink-0">{persona.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{persona.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{persona.title}</p>
                          </div>
                          <button
                            onClick={() => toggleFavoriteMutation.mutate({ personaId: persona.id })}
                            className="p-1 rounded-full text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove from favorites"
                          >
                            <Heart className="h-3 w-3 fill-current" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Rated Experts */}
            {personaRatings.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-emerald-500/10">
                      <Star className="h-4 w-4 text-emerald-400" />
                    </div>
                    <CardTitle className="text-base font-semibold">Top Rated Experts</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {personaRatings.slice(0, 5).map((rating) => {
                      const persona = (personas ?? []).find((p) => p.id === rating.personaId);
                      if (!persona) return null;
                      return (
                        <div key={rating.personaId} className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/40">
                          <span className="text-xl shrink-0">{persona.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{persona.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{persona.title}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <ThumbsUp className="h-3 w-3 text-emerald-400" />
                            <span className="text-[10px] font-semibold text-emerald-400">{rating.upCount}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Memory Learnings */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-500/10">
                    <BookOpen className="h-4 w-4 text-amber-400" />
                  </div>
                  <CardTitle className="text-base font-semibold">AI Memory</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : !insights?.learnings || insights.learnings.length === 0 ? (
                  <div className="text-center py-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No memories yet.</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      Chat with the Chat Agent to build memory.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-64">
                    <div className="space-y-2">
                      {insights.learnings.map((item) => (
                        <div key={item.id} className="p-2 rounded-lg bg-secondary/40">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded font-medium",
                              item.type === "preference" ? "bg-blue-500/20 text-blue-400" :
                              item.type === "learning" ? "bg-emerald-500/20 text-emerald-400" :
                              item.type === "insight" ? "bg-amber-500/20 text-amber-400" :
                              "bg-violet-500/20 text-violet-400"
                            )}>
                              {item.type}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {Math.round(item.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Persona Picker Modal */}
        {showPersonaPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold">Choose Your Expert</h2>
                </div>
                <button
                  onClick={() => setShowPersonaPicker(false)}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground"
                >
                  ✕
                </button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {personasLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    categoriesList.map((cat) => {
                      const catPersonas = (personas ?? []).filter((p) => p.category === cat);
                      return (
                        <div key={cat}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                            {cat}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {catPersonas.map((persona) => {
                              const isFav = favoriteSet.has(persona.id);
                              return (
                                <button
                                  key={persona.id}
                                  onClick={() => {
                                    setSelectedPersonaForResume(persona as Persona);
                                    setShowPersonaPicker(false);
                                    // Open the chat widget by dispatching a custom event
                                    window.dispatchEvent(new CustomEvent("open-ai-chat", { detail: { personaId: persona.id } }));
                                  }}
                                  className="relative flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
                                >
                                  <span className="text-xl shrink-0">{persona.emoji}</span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-foreground truncate">{persona.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{persona.title}</p>
                                  </div>
                                  {isFav && (
                                    <Heart className="h-3 w-3 text-rose-400 fill-current shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

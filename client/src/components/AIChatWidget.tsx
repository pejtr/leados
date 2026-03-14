import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  MessageCircle, X, Minimize2, Maximize2, Send, Loader2,
  Sparkles, User, ChevronLeft, Trash2, Brain, Heart, History,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { useLocation } from "wouter";

type PersonaCategory = "Sales & Business" | "Wealth & Finance" | "Leadership" | "Favorites";

interface Persona {
  id: string;
  name: string;
  title: string;
  specialty: string;
  emoji: string;
  color: string;
  tags: string[];
  category: "Sales & Business" | "Wealth & Finance" | "Leadership";
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Analyze my pipeline and tell me what to fix",
  "What's my biggest bottleneck right now?",
  "How can I improve my close rate?",
  "Give me a 30-day growth plan",
];

const CATEGORY_LABELS: Record<PersonaCategory, string> = {
  "Sales & Business": "Sales",
  "Wealth & Finance": "Finance",
  "Leadership": "Lead",
  "Favorites": "★",
};

const CATEGORY_EMOJIS: Record<PersonaCategory, string> = {
  "Sales & Business": "💼",
  "Wealth & Finance": "💰",
  "Leadership": "🎯",
  "Favorites": "❤️",
};

export default function AIChatWidget() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [view, setView] = useState<"personas" | "chat">("personas");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [activeCategory, setActiveCategory] = useState<PersonaCategory>("Sales & Business");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: personas, isLoading: personasLoading } = trpc.aiChat.getPersonas.useQuery(undefined, {
    staleTime: Infinity,
  });

  const { data: favoriteIds = [], refetch: refetchFavorites } = trpc.aiChat.getFavorites.useQuery(undefined, {
    staleTime: 30_000,
  });

  const sendMessageMutation = trpc.aiChat.sendMessage.useMutation();
  const clearHistoryMutation = trpc.aiChat.clear.useMutation();
  const toggleFavoriteMutation = trpc.aiChat.toggleFavorite.useMutation();

  const favoriteSet = new Set(favoriteIds);

  const categorizedPersonas =
    activeCategory === "Favorites"
      ? (personas ?? []).filter((p) => favoriteSet.has(p.id))
      : (personas ?? []).filter((p) => p.category === activeCategory);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSelectPersona = useCallback((persona: Persona) => {
    setSelectedPersona(persona);
    setMessages([]);
    setView("chat");
  }, []);

  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent, personaId: string) => {
      e.stopPropagation();
      try {
        const result = await toggleFavoriteMutation.mutateAsync({ personaId });
        await refetchFavorites();
        toast.success(result.favorited ? "Added to favorites" : "Removed from favorites");
      } catch {
        toast.error("Failed to update favorites");
      }
    },
    [toggleFavoriteMutation, refetchFavorites]
  );

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    try {
      const result = await sendMessageMutation.mutateAsync({
        message: userMessage,
        personaId: selectedPersona?.id,
        conversationHistory: newMessages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: result.content }]);
    } catch {
      toast.error("Failed to get response. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, selectedPersona, sendMessageMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleClearChat = useCallback(async () => {
    setMessages([]);
    try {
      await clearHistoryMutation.mutateAsync();
    } catch {
      // silent
    }
  }, [clearHistoryMutation]);

  const handleSuggestedPrompt = useCallback((prompt: string) => {
    setInput(prompt);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  // Widget dimensions
  const widgetWidth = isMaximized ? "w-[600px]" : "w-[380px]";
  const widgetHeight = isMaximized ? "h-[680px]" : "h-[520px]";

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 group"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-semibold hidden sm:block">AI Advisor</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden transition-all duration-200",
        widgetWidth,
        widgetHeight
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {view === "chat" && selectedPersona && (
            <button
              onClick={() => setView("personas")}
              className="p-1 rounded-md hover:bg-accent transition-colors shrink-0"
              aria-label="Back to personas"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {view === "chat" && selectedPersona ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">{selectedPersona.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{selectedPersona.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{selectedPersona.title}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">AI Advisor</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {personas?.length ?? 0} experts
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {view === "chat" && messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-md hover:bg-accent transition-colors"
              aria-label="Clear chat"
              title="Clear conversation"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {view === "personas" && (
            <button
              onClick={() => { setIsOpen(false); setLocation("/ai-advisor"); }}
              className="p-1.5 rounded-md hover:bg-accent transition-colors"
              aria-label="Chat history"
              title="View chat history"
            >
              <History className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => setIsMaximized((v) => !v)}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Persona Selector View */}
      {view === "personas" && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Category Tabs */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <Tabs
              value={activeCategory}
              onValueChange={(v) => setActiveCategory(v as PersonaCategory)}
            >
              <TabsList className="w-full h-8">
                {(["Sales & Business", "Wealth & Finance", "Leadership", "Favorites"] as PersonaCategory[]).map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="flex-1 text-[10px] gap-0.5 h-6 px-1">
                    <span>{CATEGORY_EMOJIS[cat]}</span>
                    <span className="hidden sm:inline">{CATEGORY_LABELS[cat]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Persona Grid */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-3 pb-3">
              {personasLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : categorizedPersonas.length === 0 && activeCategory === "Favorites" ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                  <Heart className="h-10 w-10 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground">No favorites yet.</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Click the ♡ on any expert to pin them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {categorizedPersonas.map((persona) => {
                    const isFav = favoriteSet.has(persona.id);
                    return (
                      <button
                        key={persona.id}
                        onClick={() => handleSelectPersona(persona as Persona)}
                        className="relative flex flex-col items-start gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
                      >
                        {/* Favorite toggle */}
                        <button
                          onClick={(e) => handleToggleFavorite(e, persona.id)}
                          className={cn(
                            "absolute top-2 right-2 p-0.5 rounded-full transition-colors z-10",
                            isFav
                              ? "text-rose-400 hover:text-rose-300"
                              : "text-muted-foreground/30 hover:text-rose-400 opacity-0 group-hover:opacity-100"
                          )}
                          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                          title={isFav ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart className={cn("h-3 w-3", isFav && "fill-current")} />
                        </button>

                        <div className="flex items-center gap-2 w-full pr-4">
                          <span className="text-2xl">{persona.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate leading-tight">
                              {persona.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate leading-tight">
                              {persona.title}
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {persona.specialty}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {persona.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/80 font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer hint */}
          <div className="px-3 py-2 border-t border-border shrink-0">
            <p className="text-[10px] text-muted-foreground text-center">
              Select an expert · ♡ to pin favorites · <button onClick={() => { setIsOpen(false); setLocation("/ai-advisor"); }} className="text-primary hover:underline">View history</button>
            </p>
          </div>
        </div>
      )}

      {/* Chat View */}
      {view === "chat" && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-4">
                {selectedPersona && (
                  <div className="text-center">
                    <div className="text-4xl mb-2">{selectedPersona.emoji}</div>
                    <p className="text-sm font-semibold text-foreground">{selectedPersona.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedPersona.specialty}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center px-4">
                  Ask me anything about your B2B lead generation strategy
                </p>
                <div className="flex flex-col gap-1.5 w-full">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="text-xs text-left px-3 py-2 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/30 transition-colors text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs">{selectedPersona?.emoji ?? "🤖"}</span>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm",
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
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs">{selectedPersona?.emoji ?? "🤖"}</span>
                </div>
                <div className="rounded-xl rounded-tl-sm bg-muted px-3 py-2.5">
                  <div className="flex gap-1 items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border shrink-0">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${selectedPersona?.name ?? "AI"}...`}
                className="flex-1 min-h-[38px] max-h-24 resize-none text-xs"
                rows={1}
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="h-[38px] w-[38px] shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

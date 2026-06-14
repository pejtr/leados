import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain, Sparkles, Send, Plus, ChevronRight, ArrowLeft,
  Settings, MessageSquare, Zap, Target, MailCheck,
  Search, Megaphone, FileText, Magnet, BookOpen, Clock,
  CheckCircle, AlertCircle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import BrandMemorySetup from "./BrandMemorySetup";

type View = "hub" | "skill" | "chat" | "brand-setup" | "brand-edit" | "persona-chat";

type PersonaInfo = {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  accent: string;
  tier: "free" | "gold" | "diamond";
  featured: boolean;
  suggestedPrompts: string[];
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  orchestrace: Brain,
  obsah: FileText,
  email: MailCheck,
  prodej: Target,
  reklama: Megaphone,
  "lead gen": Magnet,
  konverze: Zap,
};

const CATEGORY_COLORS: Record<string, string> = {
  orchestrace: "bg-violet-100 text-violet-700 border-violet-200",
  obsah: "bg-blue-100 text-blue-700 border-blue-200",
  email: "bg-amber-100 text-amber-700 border-amber-200",
  prodej: "bg-green-100 text-green-700 border-green-200",
  reklama: "bg-red-100 text-red-700 border-red-200",
  "lead gen": "bg-pink-100 text-pink-700 border-pink-200",
  konverze: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function AgentsHub() {
  const { user, isAuthenticated, loading } = useAuth();
  const [view, setView] = useState<View>("hub");
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [personaMessages, setPersonaMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: skills } = trpc.agents.listSkills.useQuery(undefined, { enabled: isAuthenticated });
  const { data: personas } = trpc.personas.list.useQuery();
  const personaChatMutation = trpc.personas.chat.useMutation();
  const { data: brandMemory, refetch: refetchBrand } = trpc.brandMemory.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: sessions, refetch: refetchSessions } = trpc.agents.listSessions.useQuery(undefined, { enabled: isAuthenticated });
  const { data: sessionData } = trpc.agents.getSession.useQuery(
    { sessionId: activeSessionId! },
    { enabled: !!activeSessionId }
  );

  const createSession = trpc.agents.createSession.useMutation();
  const chatMutation = trpc.agents.chat.useMutation();

  useEffect(() => {
    if (sessionData?.messages) {
      setLocalMessages(
        sessionData.messages
          .filter(m => m.role !== "system")
          .map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
      );
    }
  }, [sessionData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, isSending]);

  const activeSkill = skills?.find(s => s.id === activeSkillId);

  const handleStartChat = async (skillId: string) => {
    if (!isAuthenticated) return;
    try {
      const skill = skills?.find(s => s.id === skillId);
      const result = await createSession.mutateAsync({
        agentType: skillId,
        skillId,
        title: skill?.name || skillId,
      });
      setActiveSessionId(result.sessionId);
      setActiveSkillId(skillId);
      setLocalMessages([]);
      setView("chat");
      refetchSessions();
    } catch {
      toast.error("Nepodařilo se spustit agenta");
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !activeSessionId || isSending) return;
    const msg = message.trim();
    setMessage("");
    setLocalMessages(prev => [...prev, { role: "user", content: msg }]);
    setIsSending(true);
    try {
      const response = await chatMutation.mutateAsync({ sessionId: activeSessionId, message: msg });
      setLocalMessages(prev => [...prev, { role: "assistant", content: response.content }]);
    } catch {
      toast.error("Chyba při komunikaci s agentem");
      setLocalMessages(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setMessage(prompt);
    textareaRef.current?.focus();
  };

  const activePersona = personas?.find(p => p.id === activePersonaId) as PersonaInfo | undefined;

  const handleStartPersona = (personaId: string) => {
    setActivePersonaId(personaId);
    setPersonaMessages([]);
    setMessage("");
    setView("persona-chat");
  };

  const handleSendPersona = async () => {
    if (!message.trim() || !activePersonaId || isSending) return;
    const msg = message.trim();
    setMessage("");
    const updated = [...personaMessages, { role: "user" as const, content: msg }];
    setPersonaMessages(updated);
    setIsSending(true);
    try {
      const response = await personaChatMutation.mutateAsync({
        personaId: activePersonaId,
        messages: updated,
      });
      setPersonaMessages(prev => [...prev, { role: "assistant", content: response.content }]);
    } catch {
      toast.error("Chyba při komunikaci s koučem");
      setPersonaMessages(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handlePersonaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendPersona();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Načítám...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl bg-white">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">AI Agenti</h2>
            <p className="text-slate-500">Přihlaste se a získejte přístup k virtuálnímu CMO a celé sadě marketingových agentů.</p>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Přihlásit se
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Brand Memory Setup view
  if (view === "brand-setup" || view === "brand-edit") {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-2xl mx-auto mb-6">
          <Button variant="ghost" onClick={() => setView("hub")} className="gap-2 text-slate-600">
            <ArrowLeft className="w-4 h-4" />
            Zpět na agenty
          </Button>
        </div>
        <BrandMemorySetup
          initialData={brandMemory ? {
            companyName: brandMemory.companyName,
            tagline: brandMemory.tagline || "",
            industry: brandMemory.industry || "",
            website: brandMemory.website || "",
            targetAudience: brandMemory.targetAudience || "",
            brandVoice: brandMemory.brandVoice || "",
            uniqueValue: brandMemory.uniqueValue || "",
            products: brandMemory.products || "",
            painPoints: brandMemory.painPoints || "",
            pastCampaigns: brandMemory.pastCampaigns || "",
          } : undefined}
          onComplete={() => { refetchBrand(); setView("hub"); }}
        />
      </div>
    );
  }

  // Chat view
  if (view === "chat" && activeSkill) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => { setView("hub"); setActiveSessionId(null); }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="text-2xl">{activeSkill.icon}</div>
          <div>
            <div className="font-semibold text-slate-900">{activeSkill.name}</div>
            {activeSkill.framework && (
              <div className="text-xs text-slate-400">{activeSkill.framework}</div>
            )}
          </div>
          {brandMemory && (
            <Badge className="ml-auto bg-violet-100 text-violet-700 border-violet-200 text-xs">
              <Brain className="w-3 h-3 mr-1" />
              Brand Memory aktivní
            </Badge>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 max-w-3xl w-full mx-auto" ref={scrollRef}>
          {localMessages.length === 0 ? (
            <div className="text-center py-12 space-y-6">
              <div className="text-5xl">{activeSkill.icon}</div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">{activeSkill.name}</h3>
                <p className="text-slate-500 max-w-sm mx-auto">{activeSkill.description}</p>
              </div>
              {!brandMemory && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-sm mx-auto text-sm text-amber-700">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Pro personalizované výstupy nastavte{" "}
                  <button onClick={() => setView("brand-setup")} className="underline font-medium">
                    Brand Memory
                  </button>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-slate-400 font-medium">Zkuste začít s:</p>
                {activeSkill.suggestedPrompts.map(p => (
                  <button
                    key={p}
                    onClick={() => handleSuggestedPrompt(p)}
                    className="block w-full max-w-sm mx-auto text-left px-4 py-3 rounded-xl bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-sm text-slate-700 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {localMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-base mr-3 flex-shrink-0 mt-1">
                      {activeSkill.icon}
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-tr-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:mb-2">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-base mr-3 flex-shrink-0">
                    {activeSkill.icon}
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4 sticky bottom-0">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Napište zadání... (Enter = odeslat, Shift+Enter = nový řádek)"
              className="resize-none min-h-[52px] max-h-[200px] rounded-xl border-slate-200 focus-visible:ring-violet-500"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              size="icon"
              className="w-12 h-12 rounded-xl bg-violet-600 hover:bg-violet-700 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Persona chat view (sales coaches — stateless, Brand Memory aware)
  if (view === "persona-chat" && activePersona) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => { setView("hub"); setActivePersonaId(null); }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${activePersona.accent}1a` }}>
            {activePersona.icon}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{activePersona.name}</div>
            <div className="text-xs text-slate-400">{activePersona.title}</div>
          </div>
          {brandMemory && (
            <Badge className="ml-auto bg-violet-100 text-violet-700 border-violet-200 text-xs">
              <Brain className="w-3 h-3 mr-1" />
              Brand Memory aktivní
            </Badge>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 max-w-3xl w-full mx-auto" ref={scrollRef}>
          {personaMessages.length === 0 ? (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto" style={{ backgroundColor: `${activePersona.accent}1a` }}>
                {activePersona.icon}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-1">{activePersona.name}</h3>
                <p className="text-sm font-medium mb-2" style={{ color: activePersona.accent }}>{activePersona.title}</p>
                <p className="text-slate-500 max-w-sm mx-auto">{activePersona.description}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-400 font-medium">Zeptejte se:</p>
                {activePersona.suggestedPrompts.map(p => (
                  <button key={p} onClick={() => handleSuggestedPrompt(p)}
                    className="block w-full max-w-sm mx-auto text-left px-4 py-3 rounded-xl bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-sm text-slate-700 transition-all">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {personaMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-base mr-3 flex-shrink-0 mt-1" style={{ backgroundColor: `${activePersona.accent}1a` }}>
                      {activePersona.icon}
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user" ? "bg-violet-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"}`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:mb-2">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-base mr-3 flex-shrink-0" style={{ backgroundColor: `${activePersona.accent}1a` }}>
                    {activePersona.icon}
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border-t p-4 sticky bottom-0">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handlePersonaKeyDown}
              placeholder={`Napište zprávu pro ${activePersona.name}...`}
              className="resize-none min-h-[52px] max-h-[200px] rounded-xl border-slate-200 focus-visible:ring-violet-500"
              rows={1}
            />
            <Button onClick={handleSendPersona} disabled={!message.trim() || isSending} size="icon"
              className="w-12 h-12 rounded-xl bg-violet-600 hover:bg-violet-700 flex-shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main Hub view
  const groupedSkills = skills?.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 text-white px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-sm">
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
              <span className="text-violet-200">AI Marketing Suite</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView(brandMemory ? "brand-edit" : "brand-setup")}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 gap-2"
            >
              <Brain className="w-4 h-4" />
              {brandMemory ? "Brand Memory ✓" : "Nastavit Brand Memory"}
            </Button>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Váš tým AI agentů
          </h1>
          <p className="text-violet-200 text-lg max-w-xl mb-6">
            Specializovaní agenti s přístupy od nejlepších světových marketérů.
            Říkáte CO — oni vědí JAK.
          </p>

          {/* Brand Memory status */}
          {brandMemory ? (
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 px-4 py-2 rounded-xl text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-300">
                <strong>{brandMemory.companyName}</strong> — agenti znají váš brand
              </span>
            </div>
          ) : (
            <div
              onClick={() => setView("brand-setup")}
              className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 px-4 py-2 rounded-xl text-sm cursor-pointer hover:bg-amber-500/30 transition-all"
            >
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300">Nastavte Brand Memory pro personalizované výstupy</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Recent Sessions */}
        {sessions && sessions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-700">Nedávné konverzace</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {sessions.filter(s => s.title !== "[smazáno]").slice(0, 6).map(session => {
                const skill = skills?.find(s => s.id === (session.skillId || session.agentType));
                return (
                  <button
                    key={session.id}
                    onClick={async () => {
                      setActiveSessionId(session.id);
                      setActiveSkillId(session.skillId || session.agentType);
                      setView("chat");
                    }}
                    className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-violet-300 hover:shadow-sm transition-all text-left min-w-[200px] max-w-[260px]"
                  >
                    <span className="text-xl">{skill?.icon || "💬"}</span>
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium text-slate-800 truncate">{session.title}</div>
                      <div className="text-xs text-slate-400">{skill?.name || session.agentType}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Sales Coaches (Personas) */}
        {personas && personas.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 border">
                <Target className="w-3 h-3 mr-1" />
                Prodejní kouči
              </Badge>
              <span className="text-sm text-slate-400">Chatujte s AI verzemi legend prodeje a marketingu</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {personas.filter(p => p.category !== "optivio").map(persona => (
                <Card
                  key={persona.id}
                  className="border border-slate-200 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => handleStartPersona(persona.id)}
                  style={{ borderTopColor: persona.accent, borderTopWidth: 3 }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: `${persona.accent}1a` }}>
                        {persona.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 truncate">{persona.name}</h3>
                          {persona.tier !== "free" && (
                            <Badge className={`text-[10px] px-1.5 py-0 ${persona.tier === "gold" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"} border-0 uppercase`}>
                              {persona.tier}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: persona.accent }}>{persona.title}</p>
                        <p className="text-sm text-slate-500 leading-snug line-clamp-2">{persona.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Skills by category */}
        {groupedSkills && Object.entries(groupedSkills).map(([category, categorySkills]) => {
          const Icon = CATEGORY_ICONS[category] || BookOpen;
          const colorClass = CATEGORY_COLORS[category] || "bg-slate-100 text-slate-700 border-slate-200";

          return (
            <section key={category}>
              <div className="flex items-center gap-2 mb-4">
                <Badge className={`${colorClass} border capitalize`}>
                  <Icon className="w-3 h-3 mr-1" />
                  {category}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categorySkills?.map(skill => (
                  <Card
                    key={skill.id}
                    className="border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleStartChat(skill.id)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl flex-shrink-0">{skill.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{skill.name}</h3>
                          </div>
                          {skill.framework && (
                            <p className="text-xs text-violet-600 font-medium mb-1">{skill.framework}</p>
                          )}
                          <p className="text-sm text-slate-500 leading-snug">{skill.description}</p>
                          <div className="flex items-center gap-1 mt-3 text-violet-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Spustit agenta
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}

        {!skills && (
          <div className="text-center py-16 text-slate-400">Načítám agenty...</div>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, MessageCircle, Sparkles, Loader2, User, CheckCircle } from "lucide-react";
import { Streamdown } from "streamdown";
import { motion, AnimatePresence } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string };

function genId() {
  return "conv_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const SUGGESTED = [
  "Potřebuju web pro kavárnu",
  "Kolik stojí web s automatizací?",
  "Jaký je rozdíl mezi balíčky?",
];

export function SalesChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [lead, setLead] = useState({ name: "", email: "", phone: "" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversationId = useMemo(genId, []);

  const chatMutation = trpc.salesChat.send.useMutation({
    onSuccess: (res) => {
      setMessages((prev) => [...prev, { role: "assistant", content: res.content }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: "assistant", content: "Omlouvám se, zkuste to prosím znovu nebo nám napište na poptavka@optivio.cz." }]);
    },
  });

  const captureMutation = trpc.salesChat.captureLead.useMutation({
    onSuccess: () => {
      setLeadCaptured(true);
      setShowLeadForm(false);
      setMessages((prev) => [...prev, { role: "assistant", content: "Děkuji! 🎉 Vaše poptávka je u nás. Ozveme se vám do 48 hodin s nezávaznou nabídkou." }]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatMutation.isPending, showLeadForm]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // Offer lead form after a few exchanges (gentle nudge)
  useEffect(() => {
    const userMsgs = messages.filter((m) => m.role === "user").length;
    if (userMsgs >= 2 && !leadCaptured && !showLeadForm) {
      const t = setTimeout(() => setShowLeadForm(true), 800);
      return () => clearTimeout(t);
    }
  }, [messages, leadCaptured, showLeadForm]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatMutation.isPending) return;
    const updated = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(updated);
    setInput("");
    chatMutation.mutate({ conversationId, personaId: "optivio-sales", messages: updated });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const submitLead = () => {
    if (!lead.name.trim() || !lead.email.trim()) return;
    captureMutation.mutate({
      conversationId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || undefined,
      message: messages.filter((m) => m.role === "user").map((m) => m.content).join(" | ").slice(0, 500),
    });
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-xl shadow-violet-600/30 flex items-center justify-center hover:shadow-violet-600/50 transition-shadow cursor-pointer group"
            aria-label="Otevřít chat"
          >
            <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <span className="absolute inset-0 rounded-full bg-violet-500/40 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-violet-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-lg">💼</div>
                <div>
                  <h3 className="text-sm font-bold">Viktor — poradce OPTIVIO</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-violet-100">Online · odpovídá ihned</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors" aria-label="Zavřít">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-violet-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-800 mb-1">Ahoj! 👋 Jsem Viktor.</p>
                    <p className="text-xs text-slate-500">Pomůžu vám vybrat web na míru. Na co se chcete zeptat?</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-[280px]">
                    {SUGGESTED.map((p) => (
                      <button key={p} onClick={() => sendMessage(p)}
                        className="text-left text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-violet-700 hover:border-violet-300 hover:bg-violet-50 transition-all cursor-pointer">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        msg.role === "user" ? "bg-violet-600 text-white" : "bg-white text-slate-700 border border-slate-200 shadow-sm"}`}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none [&_p]:m-0 [&_p]:leading-relaxed">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-7 h-7 shrink-0 rounded-full bg-violet-100 flex items-center justify-center mt-0.5">
                          <User className="w-3.5 h-3.5 text-violet-600" />
                        </div>
                      )}
                    </div>
                  ))}

                  {chatMutation.isPending && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex gap-1">
                          {[0, 150, 300].map((d) => (
                            <span key={d} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inline lead capture form */}
                  {showLeadForm && !leadCaptured && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-violet-200 rounded-xl p-3 shadow-sm space-y-2"
                    >
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-violet-500" /> Chcete nezávaznou nabídku?
                      </p>
                      <p className="text-xs text-slate-500">Nechte kontakt a ozveme se do 48 hodin.</p>
                      <Input placeholder="Vaše jméno" value={lead.name} onChange={(e) => setLead((l) => ({ ...l, name: e.target.value }))} className="h-8 text-sm" />
                      <Input placeholder="E-mail" type="email" value={lead.email} onChange={(e) => setLead((l) => ({ ...l, email: e.target.value }))} className="h-8 text-sm" />
                      <Input placeholder="Telefon (volitelné)" value={lead.phone} onChange={(e) => setLead((l) => ({ ...l, phone: e.target.value }))} className="h-8 text-sm" />
                      <div className="flex gap-2">
                        <Button onClick={submitLead} disabled={!lead.name.trim() || !lead.email.trim() || captureMutation.isPending}
                          className="flex-1 bg-violet-600 hover:bg-violet-700 h-8 text-xs">
                          {captureMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Odeslat poptávku"}
                        </Button>
                        <Button variant="ghost" className="h-8 text-xs" onClick={() => setShowLeadForm(false)}>Později</Button>
                      </div>
                    </motion.div>
                  )}

                  {leadCaptured && (
                    <div className="flex items-center gap-2 justify-center text-green-600 text-xs font-medium py-2">
                      <CheckCircle className="w-4 h-4" /> Poptávka odeslána
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-3 bg-white">
              <div className="flex gap-2">
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Napište zprávu..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 transition-all"
                  disabled={chatMutation.isPending}
                />
                <Button onClick={() => sendMessage(input)} disabled={!input.trim() || chatMutation.isPending} size="icon"
                  className="shrink-0 w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-30">
                  {chatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              {!leadCaptured && messages.length > 0 && (
                <button onClick={() => setShowLeadForm(true)} className="text-[11px] text-violet-600 hover:text-violet-700 mt-2 w-full text-center">
                  💬 Chci nezávaznou nabídku
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Send, X, HeadphonesIcon, Loader2, Bot, User } from "lucide-react";
import { Streamdown } from "streamdown";
import { motion, AnimatePresence } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string };

function genId() {
  return "sup_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const SUGGESTED = [
  "Jak přidám nový text na web?",
  "Proč mi nejde formulář?",
  "Jak funguji s LeadOS?",
];

export function TechSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversationId = useMemo(genId, []);

  const chatMutation = trpc.salesChat.send.useMutation({
    onSuccess: (res) => {
      setMessages((prev) => [...prev, { role: "assistant", content: res.content }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: "assistant", content: "Omlouvám se, něco se pokazilo. Napište nám na poptavka@optivio.cz nebo zkuste znovu." }]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatMutation.isPending]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatMutation.isPending) return;
    const updated = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(updated);
    setInput("");
    chatMutation.mutate({ conversationId, personaId: "optivio-support", messages: updated });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
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
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-xl shadow-sky-600/30 flex items-center justify-center hover:shadow-sky-600/50 transition-shadow cursor-pointer group"
            aria-label="Technická podpora"
          >
            <HeadphonesIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
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
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-6rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-sky-100 bg-gradient-to-r from-sky-500 to-sky-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-base">🛠️</div>
                <div>
                  <h3 className="text-sm font-bold">Alex — Technická podpora</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                    <span className="text-xs text-sky-100">Online · odpovídá ihned</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center text-2xl">🛠️</div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-800 mb-1">Ahoj! 👋 Jsem Alex.</p>
                    <p className="text-xs text-slate-500">Jsem tu pro technické dotazy ohledně vašeho webu a služeb OPTIVIO.</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-[280px]">
                    {SUGGESTED.map((p) => (
                      <button key={p} onClick={() => sendMessage(p)}
                        className="text-left text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-sky-700 hover:border-sky-300 hover:bg-sky-50 transition-all cursor-pointer">
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
                        <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        msg.role === "user" ? "bg-sky-500 text-white" : "bg-white text-slate-700 border border-slate-200 shadow-sm"}`}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none [&_p]:m-0 [&_p]:leading-relaxed">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-7 h-7 shrink-0 rounded-full bg-sky-100 flex items-center justify-center mt-0.5">
                          <User className="w-3.5 h-3.5 text-sky-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex gap-1">
                          {[0, 150, 300].map((d) => (
                            <span key={d} className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-3 bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Napište dotaz..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200 transition-all"
                  disabled={chatMutation.isPending}
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || chatMutation.isPending}
                  size="icon"
                  className="shrink-0 w-10 h-10 rounded-xl bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-30"
                >
                  {chatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Pro urgentní věci: <a href="mailto:poptavka@optivio.cz" className="text-sky-500 hover:underline">poptavka@optivio.cz</a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

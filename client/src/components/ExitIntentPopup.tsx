import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ExitIntentPopupProps {
  enabled?: boolean;
}

export default function ExitIntentPopup({ enabled = true }: ExitIntentPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const captureEmail = trpc.capturedLeads.captureEmail.useMutation();

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      if (e.clientY <= 0 && !dismissed && !isVisible) {
        // Check if already shown in this session
        const shown = sessionStorage.getItem("exitIntentShown");
        if (!shown) {
          setIsVisible(true);
          sessionStorage.setItem("exitIntentShown", "true");
        }
      }
    },
    [dismissed, isVisible]
  );

  useEffect(() => {
    if (!enabled) return;
    // Delay attaching listener so it doesn't fire immediately
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 3000);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [enabled, handleMouseLeave]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Zadejte platnou emailovou adresu");
      return;
    }
    setIsLoading(true);
    try {
      const result = await captureEmail.mutateAsync({
        email,
        source: "exit_intent",
        pageUrl: window.location.href,
        utmSource: new URLSearchParams(window.location.search).get("utm_source") ?? undefined,
        utmMedium: new URLSearchParams(window.location.search).get("utm_medium") ?? undefined,
        utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign") ?? undefined,
      });
      setSubmitted(true);
      if (result.alreadyCaptured) {
        toast.info(result.message);
      } else {
        toast.success("Průvodce je na cestě! Zkontrolujte inbox.");
      }
    } catch (err: any) {
      toast.error("Nepodařilo se odeslat. Zkuste to znovu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg pointer-events-auto rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #0D1B2A 0%, #1a2744 50%, #0D1B2A 100%)",
                border: "1px solid rgba(0, 212, 200, 0.3)",
                boxShadow: "0 0 60px rgba(0, 212, 200, 0.15), 0 25px 50px rgba(0,0,0,0.5)",
              }}
            >
              {/* Top glow bar */}
              <div
                className="h-1 w-full"
                style={{
                  background: "linear-gradient(90deg, #00D4C8, #6B4FE8, #00D4C8)",
                }}
              />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8">
                {!submitted ? (
                  <>
                    {/* Icon */}
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, #00D4C8, #6B4FE8)",
                          boxShadow: "0 0 20px rgba(0, 212, 200, 0.4)",
                        }}
                      >
                        <Gift size={22} className="text-white" />
                      </div>
                      <div>
                        <div
                          className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                          style={{ color: "#00D4C8" }}
                        >
                          Exkluzivní nabídka
                        </div>
                        <div className="text-white font-bold text-lg leading-tight">
                          Počkejte — máme pro vás dárek
                        </div>
                      </div>
                    </div>

                    <h2 className="text-white text-2xl font-bold mb-2 leading-tight">
                      Zdarma: Průvodce{" "}
                      <span style={{ color: "#00D4C8" }}>
                        "50 B2B leadů za 24 hodin"
                      </span>
                    </h2>
                    <p className="text-white/60 text-sm mb-6 leading-relaxed">
                      Přesný postup jak generovat kvalifikované B2B leady pomocí AI — bez cold calling a bez agentury. Stáhněte si PDF průvodce zdarma.
                    </p>

                    {/* Value props */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        { label: "Leadů za den", value: "50+" },
                        { label: "Průměrný reply rate", value: "34%" },
                        { label: "Ušetřených hodin", value: "8h" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl p-3 text-center"
                          style={{
                            background: "rgba(0, 212, 200, 0.08)",
                            border: "1px solid rgba(0, 212, 200, 0.15)",
                          }}
                        >
                          <div
                            className="text-xl font-bold"
                            style={{ color: "#00D4C8" }}
                          >
                            {item.value}
                          </div>
                          <div className="text-white/50 text-xs mt-0.5">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Email form */}
                    <form onSubmit={handleSubmit} className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="vas@email.cz"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 text-white placeholder:text-white/30"
                        style={{
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(0, 212, 200, 0.25)",
                        }}
                      />
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="shrink-0 font-semibold gap-1.5"
                        style={{
                          background: "linear-gradient(135deg, #00D4C8, #6B4FE8)",
                          border: "none",
                          color: "white",
                          opacity: isLoading ? 0.7 : 1,
                        }}
                      >
                        {isLoading ? "Odesílám..." : <>{"Stáhnout"} <ArrowRight size={14} /></>}
                      </Button>
                    </form>

                    <p className="text-white/30 text-xs mt-3 text-center">
                      Žádný spam. Odhlásit se můžete kdykoliv.
                    </p>
                  </>
                ) : (
                  /* Success state */
                  <div className="text-center py-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{
                        background: "linear-gradient(135deg, #00D4C8, #4ECBA0)",
                        boxShadow: "0 0 30px rgba(0, 212, 200, 0.4)",
                      }}
                    >
                      <Zap size={28} className="text-white" />
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">
                      Průvodce je na cestě!
                    </h3>
                    <p className="text-white/60 text-sm mb-6">
                      Zkontrolujte inbox — PDF dorazí do 2 minut.
                    </p>
                    <Button
                      onClick={handleClose}
                      className="w-full font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #00D4C8, #6B4FE8)",
                        border: "none",
                        color: "white",
                      }}
                    >
                      Zpět na stránku
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

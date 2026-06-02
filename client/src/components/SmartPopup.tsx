import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, ArrowRight, Star, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

// ── Color tokens (matching Landing.tsx) ──────────────────────────────────────
const C = {
  bg: "#f0f4f8",
  bgCard: "#ffffff",
  bgDark: "#0d1b2a",
  teal: "#00c4b4",
  tealDark: "#009e91",
  indigo: "#5b4fe8",
  violet: "#7c3aed",
  green: "#10b981",
  amber: "#f59e0b",
  text: "#0f172a",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  border: "#dde4ef",
};

// ── Case study highlights for the popup ──────────────────────────────────────
function useHighlights() {
  const { t } = useTranslation();
  return [
    {
      company: "TechScale s.r.o.",
      industry: "SaaS",
      result: t("landing.popupResult1") || "47 qualified leads",
      period: t("landing.popupPeriod1") || "in 3 days",
      metric: "28%",
      metricLabel: t("landing.popupMetricLabel1") || "Reply rate",
      color: C.indigo,
    },
    {
      company: "LogiCzech a.s.",
      industry: "Logistics",
      result: t("landing.popupResult2") || "€340K pipeline",
      period: t("landing.popupPeriod2") || "in 6 months",
      metric: "1,200+",
      metricLabel: t("landing.popupMetricLabel2") || "New contacts",
      color: C.teal,
    },
    {
      company: "ShopBoost CZ",
      industry: "E-commerce",
      result: t("landing.popupResult3") || "3× pipeline growth",
      period: t("landing.popupPeriod3") || "in 90 days",
      metric: "80%",
      metricLabel: t("landing.popupMetricLabel3") || "Less research",
      color: C.amber,
    },
  ];
}

interface SmartPopupProps {
  /** Delay in milliseconds before showing the popup (default: 30000 = 30s) */
  delay?: number;
  /** ID of the case studies section to scroll to */
  caseStudiesSectionId?: string;
}

export default function SmartPopup({
  delay = 30000,
  caseStudiesSectionId = "case-studies",
}: SmartPopupProps) {
  const { t } = useTranslation();
  const HIGHLIGHTS = useHighlights();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  // Show after delay, only once per session
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("smartPopupShown");
    if (alreadyShown) return;

    const timer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem("smartPopupShown", "true");
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  // Rotate through case study highlights every 3.5s
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % HIGHLIGHTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [visible]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  const handleCTAClick = () => {
    handleDismiss();
    // Scroll to case studies section
    const el = document.getElementById(caseStudiesSectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (dismissed) return null;

  const highlight = HIGHLIGHTS[activeIdx];

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop (subtle) */}
          <motion.div
            className="fixed inset-0 z-[80] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(13,27,42,0.18)" }}
          />

          {/* Popup card — bottom-left corner */}
          <motion.div
            className="fixed bottom-6 left-6 z-[90] w-[340px] max-w-[calc(100vw-3rem)]"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                boxShadow: `0 24px 60px rgba(91,79,232,0.18), 0 8px 24px rgba(0,0,0,0.10)`,
              }}
            >
              {/* Header bar */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`,
                }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-card/80"
                  />
                  <span
                    className="text-xs font-semibold text-white/90"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {t("landing.popupTitle")}
                  </span>
                </div>
                <button
                  onClick={handleDismiss}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                  aria-label="Close popup"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              {/* Rotating case study highlight */}
              <div className="px-5 pt-4 pb-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIdx}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Industry badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: `${highlight.color}14`,
                          color: highlight.color,
                          border: `1px solid ${highlight.color}30`,
                        }}
                      >
                        {highlight.industry}
                      </span>
                      <span className="text-xs" style={{ color: C.textLight }}>
                        {highlight.company}
                      </span>
                    </div>

                    {/* Result headline */}
                    <div
                      className="text-xl font-black mb-0.5"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {highlight.result}
                    </div>
                    <div className="text-sm mb-3" style={{ color: C.textMuted }}>
                      {highlight.period}
                    </div>

                    {/* Metric pill */}
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl mb-3"
                      style={{
                        background: `${highlight.color}0f`,
                        border: `1px solid ${highlight.color}25`,
                      }}
                    >
                      <TrendingUp
                        className="w-3.5 h-3.5"
                        style={{ color: highlight.color }}
                      />
                      <span
                        className="text-sm font-bold"
                        style={{ color: highlight.color }}
                      >
                        {highlight.metric}
                      </span>
                      <span className="text-xs" style={{ color: C.textMuted }}>
                        {highlight.metricLabel}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Star rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-current"
                      style={{ color: C.amber }}
                    />
                  ))}
                  <span className="text-xs ml-1" style={{ color: C.textMuted }}>
                    {t("landing.popupVerified")}
                  </span>
                </div>

                {/* Dot indicators */}
                <div className="flex items-center gap-1.5 mb-4">
                  {HIGHLIGHTS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === activeIdx ? 20 : 6,
                        height: 6,
                        background:
                          i === activeIdx
                            ? `linear-gradient(90deg, ${C.indigo}, ${C.teal})`
                            : C.border,
                      }}
                      aria-label={`Case study ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* CTA button */}
              <div className="px-5 pb-5">
                <button
                  onClick={handleCTAClick}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`,
                    boxShadow: `0 4px 16px ${C.indigo}35`,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {t("landing.popupCTA")}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-full text-center text-xs mt-2 py-1.5 transition-colors"
                  style={{ color: C.textLight }}
                >
                  {t("landing.popupDismiss")}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Zap } from "lucide-react";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft {
  // Set deadline to end of today (midnight)
  const now = new Date();
  const deadline = new Date();
  deadline.setHours(23, 59, 59, 999);
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };

  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function UrgencyBanner() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("urgencyBannerDismissed");
    if (dismissed) setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("urgencyBannerDismissed", "true");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full overflow-hidden"
          style={{
            background: "linear-gradient(90deg, #0D1B2A 0%, #1a2744 50%, #0D1B2A 100%)",
            borderBottom: "1px solid rgba(0, 212, 200, 0.2)",
          }}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-2.5 gap-4">
              {/* Left: offer text */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #00D4C8, #6B4FE8)" }}
                >
                  <Zap size={12} className="text-white" />
                </div>
                <span className="text-white text-sm font-medium truncate">
                  <span style={{ color: "#00D4C8" }} className="font-bold">
                    Speciální nabídka:
                  </span>{" "}
                  Prvních 14 dní zdarma + onboarding call v hodnotě €299 — pouze dnes
                </span>
              </div>

              {/* Center: countdown */}
              <div className="flex items-center gap-2 shrink-0">
                <Clock size={14} className="text-white/50" />
                <div className="flex items-center gap-1">
                  {[
                    { value: timeLeft.hours, label: "hod" },
                    { value: timeLeft.minutes, label: "min" },
                    { value: timeLeft.seconds, label: "sek" },
                  ].map((unit, i) => (
                    <span key={unit.label} className="flex items-center gap-1">
                      {i > 0 && <span className="text-white/30 text-xs">:</span>}
                      <span
                        className="font-mono font-bold text-sm tabular-nums"
                        style={{ color: "#00D4C8" }}
                      >
                        {pad(unit.value)}
                      </span>
                      <span className="text-white/40 text-xs hidden sm:inline">
                        {unit.label}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: dismiss */}
              <button
                onClick={handleDismiss}
                className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
                aria-label="Zavřít"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

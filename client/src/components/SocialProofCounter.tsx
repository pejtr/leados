import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, TrendingUp, Zap, Globe } from "lucide-react";

interface CounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

function AnimatedCounter({ target, suffix = "", prefix = "", duration = 2000 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);
      setCount(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString("cs-CZ")}{suffix}
    </span>
  );
}

const stats = [
  {
    icon: Users,
    value: 1247,
    suffix: "+",
    label: "B2B týmů",
    sublabel: "aktivních uživatelů",
    color: "#00D4C8",
  },
  {
    icon: TrendingUp,
    value: 94800,
    suffix: "+",
    label: "leadů vygenerováno",
    sublabel: "tento měsíc",
    color: "#6B4FE8",
  },
  {
    icon: Zap,
    value: 34,
    suffix: "%",
    label: "průměrný reply rate",
    sublabel: "vs 8% industry avg",
    color: "#4ECBA0",
  },
  {
    icon: Globe,
    value: 28,
    suffix: "",
    label: "zemí",
    sublabel: "globální pokrytí",
    color: "#F59E0B",
  },
];

export default function SocialProofCounter() {
  const [liveCount, setLiveCount] = useState(1247);

  // Simulate live user count incrementing
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setLiveCount((prev) => prev + 1);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      {/* Live indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: "#4ECBA0" }}
          />
          <span
            className="relative inline-flex rounded-full h-2.5 w-2.5"
            style={{ backgroundColor: "#4ECBA0" }}
          />
        </span>
        <span className="text-sm font-medium" style={{ color: "#4ECBA0" }}>
          {liveCount.toLocaleString("cs-CZ")} firem právě používá LeadOS
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="relative rounded-2xl p-5 text-center overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${stat.color}22`,
            }}
          >
            {/* Glow background */}
            <div
              className="absolute inset-0 opacity-5 rounded-2xl"
              style={{ background: `radial-gradient(circle at center, ${stat.color}, transparent 70%)` }}
            />

            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{
                background: `${stat.color}18`,
                border: `1px solid ${stat.color}30`,
              }}
            >
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>

            <div
              className="text-3xl font-bold mb-1 tabular-nums"
              style={{ color: stat.color }}
            >
              <AnimatedCounter
                target={stat.value}
                suffix={stat.suffix}
                duration={2000 + i * 200}
              />
            </div>
            <div className="text-white font-semibold text-sm">{stat.label}</div>
            <div className="text-white/40 text-xs mt-0.5">{stat.sublabel}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

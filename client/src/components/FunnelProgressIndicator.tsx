import { motion } from "framer-motion";
import { Check } from "lucide-react";

export interface FunnelStep {
  id: number;
  label: string;
  sublabel?: string;
}

interface FunnelProgressIndicatorProps {
  steps: FunnelStep[];
  currentStep: number; // 1-based
  className?: string;
}

const DEFAULT_STEPS: FunnelStep[] = [
  { id: 1, label: "Choose Plan", sublabel: "Select your tier" },
  { id: 2, label: "Create Account", sublabel: "30 seconds" },
  { id: 3, label: "Start Free Trial", sublabel: "No card needed" },
];

export default function FunnelProgressIndicator({
  steps = DEFAULT_STEPS,
  currentStep = 1,
  className = "",
}: FunnelProgressIndicatorProps) {
  const C = {
    teal: "#00D4C8",
    indigo: "#6B4FE8",
    bg: "#F0F4FF",
    bgCard: "#FFFFFF",
    textPrimary: "#0D1B2A",
    textMuted: "#64748B",
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-center gap-0">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isUpcoming = step.id > currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5">
                {/* Circle */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: isCompleted
                      ? `linear-gradient(135deg, ${C.teal}, ${C.indigo})`
                      : isActive
                      ? `linear-gradient(135deg, ${C.teal}, ${C.indigo})`
                      : C.bg,
                    border: isUpcoming
                      ? `2px solid rgba(0, 212, 200, 0.25)`
                      : "none",
                    boxShadow: isActive
                      ? `0 0 0 4px rgba(0, 212, 200, 0.15), 0 0 20px rgba(0, 212, 200, 0.3)`
                      : "none",
                    color: isCompleted || isActive ? "white" : C.textMuted,
                  }}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <span>{step.id}</span>
                  )}

                  {/* Active pulse ring */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        background: `radial-gradient(circle, rgba(0, 212, 200, 0.3), transparent)`,
                      }}
                    />
                  )}
                </motion.div>

                {/* Label */}
                <div className="text-center" style={{ minWidth: "80px" }}>
                  <div
                    className="text-xs font-semibold leading-tight"
                    style={{
                      color: isCompleted || isActive ? C.textPrimary : C.textMuted,
                    }}
                  >
                    {step.label}
                  </div>
                  {step.sublabel && (
                    <div
                      className="text-[10px] leading-tight mt-0.5"
                      style={{ color: C.textMuted }}
                    >
                      {step.sublabel}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className="relative mx-2 mb-5"
                  style={{ width: "60px", height: "2px" }}
                >
                  {/* Background track */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: "rgba(0, 212, 200, 0.15)" }}
                  />
                  {/* Progress fill */}
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    initial={false}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    style={{
                      background: `linear-gradient(90deg, ${C.teal}, ${C.indigo})`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress text */}
      <div className="text-center mt-3">
        <span
          className="text-xs font-medium"
          style={{ color: "#64748B" }}
        >
          Step {currentStep} of {steps.length}
          {currentStep < steps.length && (
            <span style={{ color: C.teal }}>
              {" "}— {steps[currentStep]?.label} is next
            </span>
          )}
          {currentStep === steps.length && (
            <span style={{ color: C.teal }}> — Almost there!</span>
          )}
        </span>
      </div>
    </div>
  );
}

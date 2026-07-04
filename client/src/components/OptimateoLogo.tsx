import { useId } from "react";

export function OptimateoLogo({
  className = "h-8",
  light = false,
  withWordmark = true,
  withTagline = false,
}: {
  className?: string;
  light?: boolean;
  withWordmark?: boolean;
  withTagline?: boolean;
}) {
  const gradientId = `optimateo-gradient-${useId().replace(/:/g, "")}`;
  const wordmark = light ? "text-white" : "text-slate-950";
  const muted = light ? "text-white/70" : "text-slate-500";

  return (
    <span className={`inline-flex items-center gap-[0.45em] leading-none ${className}`}>
      <svg viewBox="0 0 96 96" className="h-full w-auto shrink-0 overflow-visible drop-shadow-[0_0_12px_rgba(124,58,237,0.35)]" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="15" y1="78" x2="82" y2="15" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#008cff" />
            <stop offset="48%" stopColor="#2338ff" />
            <stop offset="100%" stopColor="#e014ff" />
          </linearGradient>
        </defs>
        <path
          d="M29 65.5A31 31 0 0 1 63.5 22.5"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="12"
          strokeLinecap="butt"
        />
        <path
          d="M66.5 42.5A31 31 0 0 1 44 72"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="12"
          strokeLinecap="butt"
        />
        <path
          d="M21 75L72 24"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="11"
          strokeLinecap="square"
        />
        <path d="M61 17L82 12L77 33Z" fill={`url(#${gradientId})`} />
      </svg>

      {withWordmark && (
        <span className="flex flex-col justify-center gap-[0.15em]">
          <span className={`flex items-center gap-[0.28em] font-extrabold uppercase tracking-[0.32em] text-[1.05em] ${wordmark}`}>
            <span className="inline-block h-[0.75em] w-[0.75em] rounded-[0.18em] border-[0.12em] border-[#078bff]" />
            <span>PTIMATE</span>
            <span className="inline-block h-[0.75em] w-[0.75em] rounded-[0.18em] border-[0.12em] border-[#c31cff]" />
          </span>
          {withTagline && (
            <span className={`flex items-center gap-[0.55em] pl-[0.1em] text-[0.34em] font-bold uppercase tracking-[0.8em] ${muted}`}>
              <span className="h-px w-[5em] bg-gradient-to-r from-[#008cff] to-[#2338ff]" />
              <span className="bg-gradient-to-r from-[#008cff] via-[#4f46e5] to-[#e014ff] bg-clip-text text-transparent">
                Digital Agency
              </span>
              <span className="h-px w-[5em] bg-gradient-to-r from-[#7c2dff] to-[#e014ff]" />
            </span>
          )}
        </span>
      )}
    </span>
  );
}

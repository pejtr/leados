// Hlavní logo OPTIVIO — modrý V-mark (vektorová rekonstrukce brand assetu).
// `light` přepíná wordmark do bílé pro tmavá pozadí.
export function OptivioLogo({
  className = "h-8",
  light = false,
  withWordmark = true,
}: {
  className?: string;
  light?: boolean;
  withWordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-auto shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="optivio-mark-l" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="optivio-mark-r" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        {/* levé rameno V */}
        <path d="M6 14 L34 14 L57 86 L40 86 Z" fill="url(#optivio-mark-l)" />
        {/* pravé rameno V — vyšší, světlejší */}
        <path d="M94 6 L66 6 L43 86 L57 86 Z" fill="url(#optivio-mark-r)" />
      </svg>
      {withWordmark && (
        <span className={`font-extrabold tracking-tight leading-none text-[1.35em] ${light ? "text-white" : "text-slate-900"}`}>
          OPTIVIO
        </span>
      )}
    </span>
  );
}

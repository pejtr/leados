// Hlavní logo ONYX WEB — faceted onyx-gem mark (vektorová rekonstrukce brand assetu).
// Pozn.: komponenta i soubor si zatím drží legacy název `OptivioLogo` kvůli importům
// napříč ~15 soubory — přejmenování identifikátoru je samostatný pozdější krok.
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
          <linearGradient id="onyx-mark-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        {/* faceted onyx gem — table + dva pavilion facety, jeden s amber jiskrou */}
        <polygon points="30,18 70,18 82,42 18,42" fill="url(#onyx-mark-body)" />
        <polygon points="18,42 50,42 50,86" fill="#1e293b" />
        <polygon points="50,42 82,42 50,86" fill="#f59e0b" />
      </svg>
      {withWordmark && (
        <span className={`font-extrabold tracking-tight leading-none text-[1.35em] ${light ? "text-white" : "text-slate-900"}`}>
          ONYX <span className="text-amber-500">WEB</span>
        </span>
      )}
    </span>
  );
}

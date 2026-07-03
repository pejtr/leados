// Optimateo — značka agentury (ZAMČENO 2026-06-20). Aperture-O jako poslední
// písmeno: soustředné onyx kruhy + tyrkysová zornička. Vizuálně pojí agenturu
// s enginem ONYX OS a stejný motiv jde do patiček klientských webů
// ("Powered by ONYX OS"). `light` přepíná wordmark do bílé pro tmavá pozadí.
//
// Pozn.: zatím samostatná komponenta. Napojení napříč webem (náhrada
// OnyxWebLogo) proběhne v rámci rebrand passu Optimateo + světlý motiv.
export function OptimateoLogo({
  className = "h-8",
  light = false,
  withWordmark = true,
}: {
  className?: string;
  light?: boolean;
  withWordmark?: boolean;
}) {
  const ink = light ? "#ffffff" : "#0c0e11";
  const teal = "#14b8a6";
  return (
    <span className={`inline-flex items-center leading-none ${className}`}>
      {withWordmark && (
        <span
          className="font-extrabold tracking-tight text-[1.3em] -mr-[0.04em]"
          style={{ color: ink }}
        >
          OPTIMATE
        </span>
      )}
      {/* aperture-O — signature mark, most k ONYX OS */}
      <svg viewBox="0 0 100 100" className="h-full w-auto shrink-0" aria-hidden="true">
        <circle cx="50" cy="50" r="43" fill="none" stroke={ink} strokeWidth="8.5" />
        <circle cx="50" cy="50" r="27" fill="none" stroke={teal} strokeWidth="5.5" opacity="0.9" />
        <circle cx="50" cy="50" r="10.5" fill={teal} />
      </svg>
    </span>
  );
}

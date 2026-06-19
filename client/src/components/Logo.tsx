import { useId } from "react";

/**
 * OPTIHUB brand logo.
 *
 * The mark is a monoline onyx "aperture" — concentric onyx rings around a teal
 * pupil, evoking a polished banded-onyx eye (insight / scanning) that doubles as
 * the letter O. In the lockup the mark IS the O of "OPTIHUB" (monogram).
 *
 *  - variant="icon"   → standalone mark (favicon, collapsed nav, app icon)
 *  - variant="lockup" → mark + "PTIHUB" wordmark in Space Grotesk
 *  - theme="dark"     → for dark surfaces (light strokes)
 *  - theme="light"    → for light surfaces (dark strokes)
 */

export type LogoProps = {
  variant?: "icon" | "lockup";
  /** Mark height in px (wordmark scales from it). */
  size?: number;
  theme?: "dark" | "light";
  /** Show the tagline under the wordmark (lockup only). */
  showTagline?: boolean;
  className?: string;
};

export function Logo({
  variant = "lockup",
  size = 28,
  theme = "dark",
  showTagline = false,
  className,
}: LogoProps) {
  const gid = useId();
  const pupilId = `onyx-pupil-${gid}`;

  const ringColor = theme === "dark" ? "#99a3ac" : "#94a3b8";
  const bandColor = theme === "dark" ? "#e9eef2" : "#0f172a";
  const hexColor = theme === "dark" ? "#2dd4bf" : "#0d9488";
  const wordPrimary = theme === "dark" ? "#f2f5f7" : "#0c0e11";
  const wordAccent = theme === "dark" ? "#2dd4bf" : "#0c8074";
  const tagColor = theme === "dark" ? "#8b97a3" : "#64748b";

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="OPTIHUB"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <radialGradient id={pupilId} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#7ff0dc" />
          <stop offset="45%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0c8074" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="none" stroke={ringColor} strokeWidth="2" />
      <circle cx="100" cy="100" r="66" fill="none" stroke={bandColor} strokeWidth="3" />
      <polygon
        points="140,100 120,134.6 80,134.6 60,100 80,65.4 120,65.4"
        fill="none"
        stroke={hexColor}
        strokeWidth="2.5"
      />
      <circle cx="100" cy="100" r="18" fill="#14b8a6" opacity={0.13} />
      <circle cx="100" cy="100" r="10" fill={`url(#${pupilId})`} />
    </svg>
  );

  if (variant === "icon") {
    return (
      <span className={className} style={{ display: "inline-flex" }}>
        {mark}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.3) }}
    >
      {mark}
      <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
            fontWeight: 600,
            fontSize: Math.round(size * 0.62),
            letterSpacing: 0.3,
            color: wordPrimary,
          }}
        >
          PTI<span style={{ color: wordAccent }}>HUB</span>
        </span>
        {showTagline && (
          <span
            style={{
              fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: Math.max(9, Math.round(size * 0.26)),
              letterSpacing: 1.4,
              color: tagColor,
              marginTop: Math.round(size * 0.12),
            }}
          >
            AI Lead-Gen · CRM · Autonomous System
          </span>
        )}
      </span>
    </span>
  );
}

export default Logo;

type OptimateoLogoProps = {
  className?: string;
  light?: boolean;
  withWordmark?: boolean;
  withTagline?: boolean;
};

export function OptimateoLogo({
  className = "h-8",
  light = false,
  withWordmark = true,
  withTagline = false,
}: OptimateoLogoProps) {
  const ink = light ? "#F8FAFC" : "#081521";
  const muted = light ? "#A9C4D5" : "#3E5B70";
  const viewBox = withWordmark
    ? withTagline
      ? "0 0 500 112"
      : "0 0 500 96"
    : "0 0 96 96";

  return (
    <svg
      viewBox={viewBox}
      className={`block w-auto shrink-0 ${className}`}
      role="img"
      aria-label={withWordmark ? "OPTIMATEO, web, data, automatizace" : "OPTIMATEO"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g aria-hidden="true">
        <path
          d="M72 20A34 34 0 1 0 72 76"
          fill="none"
          stroke={ink}
          strokeWidth="13"
          strokeLinecap="butt"
        />
        <path d="M27 61L43 40L57 53L76 30L84 45L58 75L43 61L33 75Z" fill="#0EA5E9" />
        <path d="M27 61L43 40L48 56L33 75Z" fill="#0788C4" />
        <path d="M43 40L57 53L50 61L36 47Z" fill="#39C6F0" />
      </g>

      {withWordmark && (
        <g aria-hidden="true">
          <text
            x="112"
            y="62"
            fill={ink}
            fontFamily="Plus Jakarta Sans, Inter, Arial, sans-serif"
            fontSize="43"
            fontWeight="800"
            letterSpacing="1.5"
          >
            OPTIMATEO
          </text>
          {withTagline && (
            <text
              x="114"
              y="91"
              fill={muted}
              fontFamily="Plus Jakarta Sans, Inter, Arial, sans-serif"
              fontSize="15"
              fontWeight="600"
              letterSpacing="2.6"
            >
              WEB · DATA · AUTOMATIZACE
            </text>
          )}
        </g>
      )}
    </svg>
  );
}

import { OptimateoLogo } from "./OptimateoLogo";

export function OnyxWebLogo({
  className = "h-8",
  light = false,
  withWordmark = true,
}: {
  className?: string;
  light?: boolean;
  withWordmark?: boolean;
}) {
  return <OptimateoLogo className={className} light={light} withWordmark={withWordmark} />;
}

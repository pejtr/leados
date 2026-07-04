import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { setSklikConsent, trackSklikRetargeting } from "@/lib/sklik";

const STORAGE_KEY = "marketing_consent_choice";

function hasChoice() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== null;
}

export function MarketingConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasChoice());
  }, []);

  const saveChoice = (consent: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, consent ? "accepted" : "rejected");
    setSklikConsent(consent);
    setVisible(false);

    if (consent) {
      trackSklikRetargeting({
        pageType: window.location.pathname.startsWith("/lp/") ? "landing" : "other",
        category: window.location.pathname.startsWith("/lp/")
          ? `sklik-${window.location.pathname.replace("/lp/", "")}`
          : window.location.pathname.replace(/^\//, "") || "homepage",
        rtgUrl: window.location.href,
      });
    }
  };

  if (!visible) return null;

  return (
    <section
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl shadow-slate-950/20 sm:inset-x-6 sm:bottom-6"
      aria-label="Nastavení marketingových cookies"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold">Marketingové měření</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Pomůže nám poznat, které reklamy přivádí poptávky. Bez souhlasu posíláme Skliku jen anonymizované měření.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="rounded-full" onClick={() => saveChoice(false)}>
            Odmítnout
          </Button>
          <Button type="button" className="rounded-full bg-slate-950 text-white hover:bg-slate-800" onClick={() => saveChoice(true)}>
            Souhlasím
          </Button>
        </div>
      </div>
    </section>
  );
}

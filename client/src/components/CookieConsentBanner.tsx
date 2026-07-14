import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { setSklikConsent, trackSklikRetargeting } from "@/lib/sklik";
import { initLinkedInInsight, setLinkedInConsent } from "@/lib/linkedin";
import {
  clearNonEssentialClientStorage,
  CONSENT_UPDATED_EVENT,
  DEFAULT_CONSENT_CHANNELS,
  getConsentChannels,
  hasValidConsentChoice,
  saveConsentChoice,
  type ConsentChannels,
} from "@/lib/consent";

export { CONSENT_UPDATED_EVENT, getConsentChannels, isChannelConsented } from "@/lib/consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [channels, setChannels] = useState<ConsentChannels>(DEFAULT_CONSENT_CHANNELS);

  useEffect(() => {
    setChannels(getConsentChannels());
    setVisible(!hasValidConsentChoice());
  }, []);

  const applyConsent = (ch: ConsentChannels) => {
    const previous = getConsentChannels();
    const requiresReload = (Object.keys(previous) as Array<keyof ConsentChannels>)
      .some((key) => previous[key] && !ch[key]);

    saveConsentChoice(ch);
    setVisible(false);

    // Apply Sklik
    setSklikConsent(ch.sklik);

    // Apply LinkedIn
    setLinkedInConsent(ch.linkedin);
    if (ch.linkedin) {
      initLinkedInInsight();
    }

    window.localStorage.setItem("meta_consent", ch.meta ? "1" : "0");
    window.localStorage.setItem("google_consent", ch.google ? "1" : "0");
    if (!Object.values(ch).some(Boolean)) clearNonEssentialClientStorage();

    // Fire initial Sklik retargeting if consented
    if (ch.sklik) {
      trackSklikRetargeting({
        pageType: window.location.pathname.startsWith("/lp/") ? "landing" : "other",
        category: window.location.pathname.startsWith("/lp/")
          ? `sklik-${window.location.pathname.replace("/lp/", "")}`
          : window.location.pathname.replace(/^\//, "") || "homepage",
        rtgUrl: window.location.href,
      });
    }

    window.dispatchEvent(new Event(CONSENT_UPDATED_EVENT));
    if (requiresReload) window.location.reload();
  };

  const acceptAll = () => {
    const all: ConsentChannels = { sklik: true, meta: true, google: true, linkedin: true };
    applyConsent(all);
  };

  const acceptSelected = () => {
    applyConsent(channels);
  };

  const rejectAll = () => {
    applyConsent(DEFAULT_CONSENT_CHANNELS);
  };

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => {
          setChannels(getConsentChannels());
          setShowDetail(true);
          setVisible(true);
        }}
        className="fixed bottom-3 left-3 z-40 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-md hover:bg-slate-50 print:hidden"
      >
        Nastavení cookies
      </button>
    );
  }

  return (
    <section
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl shadow-slate-950/20 sm:inset-x-6 sm:bottom-6"
      aria-label="Nastavení cookies a sledování"
    >
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold">Cookies a sledování</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Používáme nástroje pro měření výkonu reklam (Sklik, Google, Meta, LinkedIn).
            Bez souhlasu analytické ani marketingové nástroje nespouštíme.{" "}
            <a href="/cookies" className="font-medium text-violet-700 underline">Více informací</a>.{" "}
            <button
              type="button"
              onClick={() => setShowDetail(!showDetail)}
              className="text-violet-600 underline hover:text-violet-700 font-medium"
            >
              {showDetail ? "Skrýt detaily" : "Detailní nastavení"}
            </button>
          </p>
        </div>

        {showDetail && (
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
            {([
              { key: "sklik" as const, label: "Sklik (Seznam.cz)", desc: "Retargeting a měření konverzí" },
              { key: "meta" as const, label: "Meta (Facebook/Instagram)", desc: "Pixel a měření reklam" },
              { key: "google" as const, label: "Google (Ads & Analytics)", desc: "Konverze a chování uživatelů" },
              { key: "linkedin" as const, label: "LinkedIn Insight Tag", desc: "B2B retargeting a konverze" },
            ]).map(({ key, label, desc }) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div>
                  <span className="text-sm font-semibold text-slate-800">{label}</span>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={channels[key]}
                  onChange={() => setChannels({ ...channels, [key]: !channels[key] })}
                  className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
              </label>
            ))}
          </div>
        )}

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-w-32 rounded-md text-xs"
            onClick={rejectAll}
          >
            Odmítnout vše
          </Button>
          {showDetail && (
            <Button
              type="button"
              variant="outline"
              className="min-w-32 rounded-md text-xs"
              onClick={acceptSelected}
            >
              Uložit vybrané
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="min-w-32 rounded-md border-violet-300 text-xs text-violet-800 hover:bg-violet-50"
            onClick={acceptAll}
          >
            Přijmout vše
          </Button>
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useState, useRef } from "react";
import { ArrowRight, Plane, Building2, MapPin } from "lucide-react";
import {
  getAnonymousVisitorId,
  getSessionId,
  getJourneyId,
  trackCrossPromoImpression,
  trackCrossPromoClick,
} from "../../lib/travel-tracking";

export interface TravelCrossPromoProps {
  domainId: string;
  placementKey: string;
  pageUrl?: string;
  pageType?: string;
  destination?: string;
  contentCategory?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  decisionApiEndpoint?: string;
  className?: string;
}

export interface DecisionResult {
  decisionId: string;
  campaignId: string | null;
  creativeId: string | null;
  placementId: string | null;
  format?: string;
  headline?: string;
  body?: string;
  ctaText?: string;
  targetUrl?: string;
  imageUrl?: string | null;
  reason?: string;
}

export const TravelCrossPromo: React.FC<TravelCrossPromoProps> = ({
  domainId,
  placementKey,
  pageUrl,
  pageType = "article",
  destination,
  contentCategory,
  deviceType,
  decisionApiEndpoint = "/api/travel/cross-promo/decision",
  className = "",
}) => {
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [impressionLogged, setImpressionLogged] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentUrl = pageUrl || (typeof window !== "undefined" ? window.location.href : "");

  // 1. Fetch Decision from server
  useEffect(() => {
    let isMounted = true;
    async function fetchDecision() {
      try {
        setLoading(true);
        const res = await fetch(decisionApiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            domainId,
            placementKey,
            pageUrl: currentUrl,
            pageType,
            destination,
            contentCategory,
            deviceType:
              deviceType ||
              (typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop"),
            anonymousVisitorId: getAnonymousVisitorId(),
            sessionId: getSessionId(),
            journeyId: getJourneyId(),
          }),
        });

        if (!res.ok) {
          if (isMounted) {
            setDecision(null);
            setLoading(false);
          }
          return;
        }

        const data: DecisionResult = await res.json();
        if (isMounted) {
          if (data && data.creativeId && data.targetUrl) {
            setDecision(data);
          } else {
            setDecision(null);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setDecision(null);
          setLoading(false);
        }
      }
    }

    if (domainId && placementKey) {
      fetchDecision();
    }
  }, [domainId, placementKey, currentUrl, destination, contentCategory]);

  // 2. IntersectionObserver for impression logging (ONCE when visible in viewport)
  useEffect(() => {
    if (!decision || impressionLogged || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionLogged) {
            setImpressionLogged(true);
            trackCrossPromoImpression({
              campaignId: decision.campaignId || undefined,
              creativeId: decision.creativeId || undefined,
              placementId: decision.placementId || undefined,
              destination,
              contentCategory,
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [decision, impressionLogged, destination, contentCategory]);

  // 3. Handle click
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!decision) return;
    trackCrossPromoClick({
      campaignId: decision.campaignId || undefined,
      creativeId: decision.creativeId || undefined,
      placementId: decision.placementId || undefined,
      destination,
      contentCategory,
    });
  };

  // Skeleton fallback during loading to prevent layout shift
  if (loading) {
    return (
      <div
        className={`w-full p-4 my-6 bg-muted/30 border border-border/50 rounded-xl animate-pulse min-h-[140px] flex flex-col justify-between ${className}`}
        aria-busy="true"
        aria-label="Načítání doporučené nabídky"
      >
        <div className="space-y-2">
          <div className="h-5 w-2/3 bg-muted rounded"></div>
          <div className="h-4 w-full bg-muted/70 rounded"></div>
        </div>
        <div className="h-9 w-32 bg-muted rounded self-end mt-4"></div>
      </div>
    );
  }

  // If no decision or no eligible campaign, suppress render silently
  if (!decision || !decision.targetUrl) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`w-full my-6 p-5 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-accent/5 shadow-sm transition-all hover:shadow-md ${className}`}
      role="region"
      aria-label="Cross-promo doporučení"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Plane className="w-4 h-4 text-primary" />
            <span>Doporučený tip</span>
            {destination && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                • <MapPin className="w-3 h-3" /> {destination}
              </span>
            )}
          </div>
          <h4 className="text-lg font-bold text-foreground leading-snug">
            {decision.headline}
          </h4>
          {decision.body && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {decision.body}
            </p>
          )}
        </div>

        <a
          href={decision.targetUrl}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shrink-0 w-full sm:w-auto"
        >
          <span>{decision.ctaText || "Zobrazit nabídku"}</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

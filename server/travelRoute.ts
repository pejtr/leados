import type { Express, Request, Response } from "express";
import { processEventIngestion } from "./travel/eventIngestion";
import { evaluateDecision } from "./travel/decisionEngine";
import { getJourneySecret } from "./travel/journeyToken";

export function registerTravelRoutes(app: Express) {
  // ─── 1. Health Check Endpoint ──────────────────────────────────
  app.get("/api/travel/health", (req: Request, res: Response) => {
    const secret = getJourneySecret();
    const tokenSignerActive = Boolean(secret);

    const isDegraded = !tokenSignerActive;

    res.status(200).json({
      status: isDegraded ? "degraded" : "healthy",
      timestamp: new Date().toISOString(),
      tokenSigner: tokenSignerActive ? "active" : "disabled",
      reasons: isDegraded ? ["TRAVEL_JOURNEY_SECRET missing"] : [],
    });
  });

  // ─── 2. Event Ingestion API Endpoint ────────────────────────────
  app.post("/api/travel/events", async (req: Request, res: Response) => {
    try {
      const originHeader = req.headers.origin || req.headers.referer;
      const projectKeyHeader = (req.headers["x-onyx-project-key"] as string) || undefined;

      const result = await processEventIngestion(req.body, originHeader, projectKeyHeader);
      return res.status(result.status).json(result.body);
    } catch (err: any) {
      console.error("[TravelEventsAPI] Error processing events:", err);
      return res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: err.message || "An unexpected error occurred",
      });
    }
  });

  // ─── 3. Cross-Promo Decision API Endpoint ───────────────────────
  app.post("/api/travel/cross-promo/decision", async (req: Request, res: Response) => {
    try {
      const {
        domainId,
        placementKey,
        pageUrl,
        pageType,
        destination,
        contentCategory,
        deviceType,
        trafficSource,
        anonymousVisitorId,
        sessionId,
        journeyId,
      } = req.body || {};

      if (!domainId || !placementKey || !pageUrl || !anonymousVisitorId || !sessionId) {
        return res.status(400).json({
          error: "MISSING_REQUIRED_FIELDS",
          message: "domainId, placementKey, pageUrl, anonymousVisitorId, and sessionId are required",
        });
      }

      const decision = await evaluateDecision({
        domainId,
        placementKey,
        pageUrl,
        pageType,
        destination,
        contentCategory,
        deviceType,
        trafficSource,
        anonymousVisitorId,
        sessionId,
        journeyId,
      });

      return res.status(200).json(decision);
    } catch (err: any) {
      console.error("[TravelDecisionAPI] Error evaluating decision:", err);
      return res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to evaluate decision",
      });
    }
  });
}

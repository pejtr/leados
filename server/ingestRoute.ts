import type { Express, Request, Response } from "express";
import { getProjectByApiKey, ingestEvent } from "./projectsDb";

/**
 * Public API endpoint for external projects to push analytics events.
 * POST /api/ingest/:apiKey
 *
 * Body (single event):
 * { eventType: "sale" | "pageview" | "signup" | "refund" | "adspend" | "custom",
 *   value?: number, currency?: string, metadata?: object, occurredAt?: string }
 *
 * Body (batch events):
 * { events: [{ eventType, value, currency, metadata, occurredAt }] }
 */
export function registerIngestRoute(app: Express) {
  app.post("/api/ingest/:apiKey", async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.params;

      if (!apiKey || !apiKey.startsWith("lpos_")) {
        return res.status(401).json({ error: "Invalid API key format" });
      }

      const project = await getProjectByApiKey(apiKey);
      if (!project) {
        return res.status(401).json({ error: "Invalid or inactive API key" });
      }

      const body = req.body;

      // Batch mode: { events: [...] }
      if (Array.isArray(body.events)) {
        const events = body.events.slice(0, 100); // max 100 events per batch
        for (const ev of events) {
          await ingestEvent({
            projectId: project.id,
            eventType: ev.eventType || "custom",
            value: ev.value ? parseFloat(ev.value) : 0,
            currency: ev.currency || project.currency,
            metadata: ev.metadata || {},
            occurredAt: ev.occurredAt ? new Date(ev.occurredAt) : new Date(),
          });
        }
        return res.json({ ok: true, ingested: events.length, projectId: project.id });
      }

      // Single event mode
      const eventType = body.eventType || "custom";
      const value = body.value ? parseFloat(body.value) : 0;
      const currency = body.currency || project.currency;
      const metadata = body.metadata || {};
      const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();

      await ingestEvent({ projectId: project.id, eventType, value, currency, metadata, occurredAt });

      return res.json({ ok: true, ingested: 1, projectId: project.id, eventType, value });
    } catch (err: any) {
      console.error("[Ingest] Error:", err?.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/ingest/:apiKey/ping — health check for external projects
  app.get("/api/ingest/:apiKey/ping", async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.params;
      const project = await getProjectByApiKey(apiKey);
      if (!project) return res.status(401).json({ ok: false, error: "Invalid API key" });
      return res.json({ ok: true, projectName: project.name, projectId: project.id });
    } catch {
      return res.status(500).json({ ok: false });
    }
  });
}

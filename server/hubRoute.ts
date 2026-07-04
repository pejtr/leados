/**
 * OMNICORE Hub — the single connection point for every portfolio project.
 *
 * One base URL + one per-project API key (connectedProjects). Any external
 * project/agent integrates against four endpoints:
 *
 *   GET  /api/hub/manifest  — public self-description (agents discover the contract)
 *   GET  /api/hub/ping      — auth check ({ ok, project })
 *   POST /api/hub/lead      — push a captured lead (email required)
 *   POST /api/hub/event     — push analytics events (sale/pageview/signup/... single or batch)
 *   POST /api/hub/report    — status/incident report -> owner's Telegram via CML (notifyOwner)
 *
 * Auth header (any of): X-Hub-Key | X-API-Key | Authorization: Bearer <key>
 */
import type { Express, Request, Response } from "express";
import { getProjectByApiKey, ingestEvent } from "./projectsDb";
import { autoUpdateCampaignRevenue } from "./ingestRoute";
import { getDb } from "./db";
import { ingestedLeads } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

const HUB_VERSION = "1.0";

function readApiKey(req: Request): string | undefined {
  const key =
    (req.headers["x-hub-key"] as string) ||
    (req.headers["x-api-key"] as string) ||
    (req.headers["x-leados-key"] as string) ||
    (req.headers["authorization"] as string)?.replace(/^Bearer\s+/i, "");
  return key && key.length >= 8 ? key : undefined;
}

async function requireProject(req: Request, res: Response) {
  const apiKey = readApiKey(req);
  if (!apiKey) {
    res.status(401).json({ ok: false, error: "Missing API key (X-Hub-Key header)" });
    return null;
  }
  const project = await getProjectByApiKey(apiKey);
  if (!project) {
    res.status(401).json({ ok: false, error: "Invalid or inactive API key" });
    return null;
  }
  return project;
}

export function registerHubRoute(app: Express) {
  // ── Public manifest: agents self-discover the contract ────────────────────
  app.get("/api/hub/manifest", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      hub: "OMNICORE Hub",
      version: HUB_VERSION,
      auth: { header: "X-Hub-Key", alt: ["X-API-Key", "Authorization: Bearer"] },
      endpoints: {
        ping: { method: "GET", path: "/api/hub/ping", purpose: "auth + connectivity check" },
        lead: {
          method: "POST",
          path: "/api/hub/lead",
          purpose: "push a captured lead into the central CRM",
          body: {
            email: "REQUIRED string",
            name: "string?",
            phone: "string?",
            source: "string? (e.g. 'myproject:homepage')",
            interest: "string?",
            url: "string? (page URL)",
            utm_source: "string?",
            utm_medium: "string?",
            utm_campaign: "string?",
            "...anything else": "stored as extra data",
          },
        },
        event: {
          method: "POST",
          path: "/api/hub/event",
          purpose: "push analytics events (revenue, traffic, signups)",
          body: {
            eventType: "sale | pageview | signup | refund | adspend | custom",
            value: "number? (e.g. sale amount)",
            currency: "string? (default project currency)",
            metadata: "object?",
            occurredAt: "ISO string?",
          },
          batch: "{ events: [ ...same shape, max 100 ] }",
        },
        report: {
          method: "POST",
          path: "/api/hub/report",
          purpose: "status/incident report delivered to the owner's Telegram (CML)",
          body: {
            message: "REQUIRED string",
            title: "string? (short headline)",
            level: "info | warn | error (default info)",
          },
        },
      },
    });
  });

  // ── Auth check ─────────────────────────────────────────────────────────────
  app.get("/api/hub/ping", async (req: Request, res: Response) => {
    const project = await requireProject(req, res);
    if (!project) return;
    return res.json({ ok: true, hub: "OMNICORE Hub", project: project.name, projectId: project.id });
  });

  // ── Lead capture ───────────────────────────────────────────────────────────
  app.post("/api/hub/lead", async (req: Request, res: Response) => {
    try {
      const project = await requireProject(req, res);
      if (!project) return;

      const body = req.body || {};
      const email = String(body.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        return res.status(400).json({ ok: false, error: "Valid email is required" });
      }

      const db = await getDb();
      if (!db) return res.status(503).json({ ok: false, error: "DB unavailable" });

      const { source, name, phone, interest, url, utm_source, utm_medium, utm_campaign, ...rest } = body;
      const extraData: Record<string, any> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (k !== "email") extraData[k] = v;
      }

      const [inserted] = await db.insert(ingestedLeads).values({
        projectId: project.id,
        projectName: project.name,
        source: String(source || project.name),
        name: name ? String(name).slice(0, 256) : undefined,
        email,
        phone: phone ? String(phone).slice(0, 64) : undefined,
        interest: interest ? String(interest).slice(0, 512) : undefined,
        pageUrl: url ? String(url) : undefined,
        utmSource: utm_source ? String(utm_source).slice(0, 128) : undefined,
        utmMedium: utm_medium ? String(utm_medium).slice(0, 128) : undefined,
        utmCampaign: utm_campaign ? String(utm_campaign).slice(0, 128) : undefined,
        ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || undefined,
        userAgent: (req.headers["user-agent"] as string)?.slice(0, 512) || undefined,
        extraData: Object.keys(extraData).length > 0 ? extraData : undefined,
        status: "new",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ingestEvent({
        projectId: project.id,
        eventType: "signup",
        value: 0,
        currency: project.currency,
        metadata: { email, name: name || "", source: source || project.name },
        occurredAt: new Date(),
      });

      console.log(`[Hub] Lead from ${project.name}: ${email}`);
      notifyOwner({
        title: `🎯 Nový lead z ${project.name}`,
        content: `Email: ${email}\nJméno: ${name || "neznámé"}\nZdroj: ${source || project.name}\nZájem: ${interest || "—"}`,
      }).catch(err => console.warn("[Hub] notifyOwner failed:", err?.message));

      return res.json({ ok: true, leadId: (inserted as any)?.insertId, project: project.name });
    } catch (err: any) {
      console.error("[Hub] lead error:", err?.message);
      return res.status(500).json({ ok: false, error: "Internal server error" });
    }
  });

  // ── Analytics events (single or batch) ────────────────────────────────────
  app.post("/api/hub/event", async (req: Request, res: Response) => {
    try {
      const project = await requireProject(req, res);
      if (!project) return;

      const body = req.body || {};
      const events = Array.isArray(body.events) ? body.events.slice(0, 100) : [body];

      let ingested = 0;
      for (const ev of events) {
        const eventType = String(ev.eventType || "custom");
        const value = ev.value ? parseFloat(String(ev.value)) : 0;
        await ingestEvent({
          projectId: project.id,
          eventType,
          value,
          currency: ev.currency || project.currency,
          metadata: ev.metadata || {},
          occurredAt: ev.occurredAt ? new Date(ev.occurredAt) : new Date(),
        });
        if (eventType === "sale" && value > 0) {
          await autoUpdateCampaignRevenue(project.id, value);
        }
        ingested++;
      }

      return res.json({ ok: true, ingested, project: project.name });
    } catch (err: any) {
      console.error("[Hub] event error:", err?.message);
      return res.status(500).json({ ok: false, error: "Internal server error" });
    }
  });

  // ── Status report -> owner's Telegram via CML ──────────────────────────────
  app.post("/api/hub/report", async (req: Request, res: Response) => {
    try {
      const project = await requireProject(req, res);
      if (!project) return;

      const body = req.body || {};
      const message = String(body.message || "").trim();
      if (!message) return res.status(400).json({ ok: false, error: "message is required" });

      const level = ["info", "warn", "error"].includes(body.level) ? body.level : "info";
      const icon = level === "error" ? "🔴" : level === "warn" ? "🟡" : "📡";
      const title = body.title ? String(body.title).slice(0, 200) : `Report (${level})`;

      const delivered = await notifyOwner({
        title: `${icon} ${project.name}: ${title}`,
        content: message.slice(0, 4000),
      }).catch(() => false);

      return res.json({ ok: true, delivered, project: project.name });
    } catch (err: any) {
      console.error("[Hub] report error:", err?.message);
      return res.status(500).json({ ok: false, error: "Internal server error" });
    }
  });
}

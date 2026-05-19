/**
 * External REST API Endpoints
 * LeadOS CRM Integration — allows third-party systems to access leads, sequences, and analytics
 * All endpoints require Bearer token authentication (API key)
 */
import { Express, Request, Response, NextFunction } from "express";
import { validateApiKey, hasPermission } from "./apiKeys";
import { getDb } from "./db";
import { leads, emailSequences, emailSequenceSteps } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Middleware: Extract and validate Bearer token
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  const apiKey = await validateApiKey(token);

  if (!apiKey) {
    return res.status(401).json({ error: "Invalid or expired API key" });
  }

  // Attach to request for use in handlers
  (req as any).apiKey = apiKey;
  (req as any).userId = apiKey.userId;
  next();
}

/**
 * Permission check middleware
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = (req as any).apiKey;
    if (!hasPermission(apiKey, permission)) {
      return res.status(403).json({ error: `Permission denied. Required: ${permission}` });
    }
    next();
  };
}

/**
 * Register external API endpoints
 */
export function registerExternalApi(app: Express) {
  // ──── GET /api/external/leads ────────────────────────────────────────────
  // Fetch leads for the authenticated user
  app.get("/api/external/leads", authMiddleware, requirePermission("read"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { status, limit = 50, offset = 0 } = req.query;

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database unavailable" });
      }

      let query = db.select().from(leads).where(eq(leads.userId, userId));

      // Filter by status if provided
      if (status && typeof status === "string") {
        query = query.where(eq(leads.status, status as any));
      }

      const results = await query.limit(Number(limit)).offset(Number(offset));

      res.json({
        success: true,
        data: results,
        pagination: { limit: Number(limit), offset: Number(offset) },
      });
    } catch (error) {
      console.error("[ExternalAPI] GET /leads error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ──── GET /api/external/leads/:id ────────────────────────────────────────
  // Fetch a specific lead
  app.get("/api/external/leads/:id", authMiddleware, requirePermission("read"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const leadId = Number(req.params.id);

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database unavailable" });
      }

      const result = await db
        .select()
        .from(leads)
        .where(eq(leads.id, leadId))
        .limit(1);

      if (result.length === 0 || result[0].userId !== userId) {
        return res.status(404).json({ error: "Lead not found" });
      }

      res.json({ success: true, data: result[0] });
    } catch (error) {
      console.error("[ExternalAPI] GET /leads/:id error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ──── PUT /api/external/leads/:id ────────────────────────────────────────
  // Update a lead (status, notes, etc.)
  app.put("/api/external/leads/:id", authMiddleware, requirePermission("write"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const leadId = Number(req.params.id);
      const { status, notes, dealValue, dealClosed } = req.body;

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database unavailable" });
      }

      // Verify ownership
      const existing = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
      if (existing.length === 0 || existing[0].userId !== userId) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Build update object
      const updateData: Record<string, any> = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (dealValue !== undefined) updateData.dealValue = dealValue;
      if (dealClosed !== undefined) updateData.dealClosed = dealClosed;
      updateData.updatedAt = new Date();

      await db.update(leads).set(updateData).where(eq(leads.id, leadId));

      res.json({ success: true, message: "Lead updated successfully" });
    } catch (error) {
      console.error("[ExternalAPI] PUT /leads/:id error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ──── GET /api/external/email-sequences ──────────────────────────────────
  // Fetch email sequences
  app.get("/api/external/email-sequences", authMiddleware, requirePermission("read"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database unavailable" });
      }

      const results = await db
        .select()
        .from(emailSequences)
        .where(eq(emailSequences.userId, userId));

      res.json({ success: true, data: results });
    } catch (error) {
      console.error("[ExternalAPI] GET /email-sequences error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ──── GET /api/external/analytics ────────────────────────────────────────
  // Fetch aggregated analytics
  app.get("/api/external/analytics", authMiddleware, requirePermission("read"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database unavailable" });
      }

      // Aggregate stats
      const allLeads = await db.select().from(leads).where(eq(leads.userId, userId));

      const stats = {
        totalLeads: allLeads.length,
        byStatus: {
          new: allLeads.filter(l => l.status === "new").length,
          contacted: allLeads.filter(l => l.status === "contacted").length,
          replied: allLeads.filter(l => l.status === "replied").length,
          qualified: allLeads.filter(l => l.status === "qualified").length,
          disqualified: allLeads.filter(l => l.status === "disqualified").length,
        },
        totalDeals: allLeads.filter(l => l.dealValue && l.dealValue > 0).length,
        totalDealValue: allLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0),
        closedDeals: allLeads.filter(l => l.dealClosed).length,
        conversionRate: allLeads.length > 0 ? (allLeads.filter(l => l.dealClosed).length / allLeads.length * 100).toFixed(2) : "0",
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error("[ExternalAPI] GET /analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ──── GET /api/external/orders ───────────────────────────────────────────
  // Fetch orders (for future Stripe integration)
  app.get("/api/external/orders", authMiddleware, requirePermission("read"), async (req: Request, res: Response) => {
    try {
      // Placeholder for future Stripe orders integration
      res.json({
        success: true,
        data: [],
        message: "Orders endpoint — Stripe integration coming soon",
      });
    } catch (error) {
      console.error("[ExternalAPI] GET /orders error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  console.log("[ExternalAPI] Registered endpoints: /api/external/*");
}

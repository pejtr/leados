import crypto from "crypto";
import type { Express, Request, Response } from "express";
import express from "express";
import { getDb } from "./db";
import { ingestedLeads, projectEvents } from "../drizzle/schema";

export function registerHdmWebhookRoute(app: Express) {
  const webhookSecret = process.env.HDM_WEBHOOK_SECRET;
  const projectId = Number.parseInt(process.env.HDM_PROJECT_ID ?? "", 10);
  const projectName = process.env.HDM_PROJECT_NAME ?? "Human Design Chart";

  if (!webhookSecret || !Number.isInteger(projectId) || projectId <= 0) {
    console.warn("[HDM Webhook] HDM_WEBHOOK_SECRET or HDM_PROJECT_ID not configured — webhook disabled");
    return;
  }

  // Must use raw body for HMAC verification
  app.post(
    "/api/webhook/hdm",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      try {
        const sig = req.headers["x-hdm-signature"] as string;
        if (!sig) {
          return res.status(401).json({ error: "Missing signature" });
        }

        // Verify HMAC-SHA256
        const hmac = crypto.createHmac("sha256", webhookSecret);
        hmac.update(req.body);
        const calculatedSig = hmac.digest("hex");

        const suppliedSignature = Buffer.from(sig, "hex");
        const expectedSignature = Buffer.from(calculatedSig, "hex");
        if (
          suppliedSignature.length !== expectedSignature.length ||
          !crypto.timingSafeEqual(suppliedSignature, expectedSignature)
        ) {
          console.error("[HDM Webhook] Signature verification failed");
          return res.status(401).json({ error: "Invalid signature" });
        }

        const payload = JSON.parse(req.body.toString("utf8"));
        console.log(`[HDM Webhook] Event received: ${payload.eventType}`);

        const db = await getDb();
        if (!db) {
          return res.status(503).json({ error: "Database unavailable" });
        }

        const eventType = payload.eventType;
        const email = payload.email || "";
        const occurredAt = payload.timestamp ? new Date(payload.timestamp) : new Date();

        switch (eventType) {
          case "new_user": {
            // 1. Insert lead
            if (email) {
              await db.insert(ingestedLeads).values({
                projectId,
                projectName,
                source: "hdm_webhook",
                name: payload.name || undefined,
                email: email,
                status: "new",
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            }
            // 2. Insert event
            await db.insert(projectEvents).values({
              projectId,
              eventType: "signup",
              value: "0",
              currency: "CZK",
              metadata: JSON.stringify({ email, name: payload.name }),
              occurredAt,
            });
            break;
          }

          case "new_order":
          case "subscription_upgraded": {
            const value = payload.amount || payload.value || 0;
            const currency = payload.currency || "CZK";
            
            await db.insert(projectEvents).values({
              projectId,
              eventType: "sale",
              value: value.toString(),
              currency: currency,
              metadata: JSON.stringify({ 
                email, 
                orderId: payload.orderId,
                plan: payload.plan
              }),
              occurredAt,
            });
            break;
          }

          case "chart_created": {
            await db.insert(projectEvents).values({
              projectId,
              eventType: "custom",
              value: "0",
              currency: "CZK",
              metadata: JSON.stringify({ 
                subtype: "chart_created",
                email,
                chartId: payload.chartId,
                chartType: payload.chartType
              }),
              occurredAt,
            });
            break;
          }

          default:
            console.log(`[HDM Webhook] Unhandled eventType: ${eventType}`);
            break;
        }

        return res.json({ received: true });
      } catch (err: any) {
        console.error("[HDM Webhook] Error:", err?.message);
        return res.status(500).json({ error: "Webhook handler failed" });
      }
    }
  );
}

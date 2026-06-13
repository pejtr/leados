import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerStripeWebhook } from "../stripeWebhook";
import { registerCallsUploadRoute } from "../callsUploadRoute";
import { registerIngestRoute } from "../ingestRoute";
import { registerGoogleOAuthRoutes } from "../googleOAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  // Stripe webhook must be registered BEFORE express.json() to get raw body
  registerStripeWebhook(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Storage proxy for webdev static assets
  registerStorageProxy(app);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Calls upload route
  registerCallsUploadRoute(app);
  // Public project analytics ingest endpoint
  registerIngestRoute(app);
  // Google OAuth routes
  registerGoogleOAuthRoutes(app);
  // Webhook retry scheduler (Heartbeat cron endpoint)
  app.post("/api/scheduled/webhook-retry", async (req, res) => {
    const { webhookRetryHandler } = await import("../webhookRetryScheduler");
    return webhookRetryHandler(req, res);
  });

  // External API endpoints (Bearer token auth)
  const { registerExternalApi } = await import("../externalApi");
  registerExternalApi(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start autopilot scheduler
    import("../autopilotScheduler").then(m => m.startAutopilotScheduler()).catch(console.error);
    // Start email sequence scheduler (checks every 60 minutes for due enrollment steps)
    import("../sequenceScheduler").then(m => m.startSequenceScheduler()).catch(console.error);
    // Start daily report scheduler (sends email digest at configured hour)
    import("../dailyReportScheduler").then(m => m.startDailyReportScheduler()).catch(console.error);
    // Daily digests: HERMES (tech, 08:00 CET) + HERA (marketing, 08:10 CET)
    import("node-cron").then((cron: any) => {
      cron.schedule("0 8 * * *", () => {
        import("../hermesDigest").then((m: any) => m.sendDailyDigest()).catch(console.error);
      }, { timezone: "Europe/Prague" });
      cron.schedule("10 8 * * *", () => {
        import("../heraDigest").then((m: any) => m.sendHeraDailyBrief()).catch(console.error);
      }, { timezone: "Europe/Prague" });
      console.log("[Digests] HERMES 08:00 + HERA 08:10 CET schedulers registered");
    }).catch(console.error);
  });
}

startServer().catch(console.error);

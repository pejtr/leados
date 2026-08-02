import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerSeoRoutes } from "../seo";
import { registerStripeWebhook } from "../stripe-webhook";

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
  registerStripeWebhook(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerSeoRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Heartbeat Monitoring Callback
  app.post("/api/scheduled/monitor-project", async (req, res) => {
    try {
      const { sdk } = await import("./sdk");
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        return res.status(403).json({ error: "cron-only" });
      }

      const { projectId } = req.body;
      const { monitorProjectHealth } = await import("../heartbeat-monitoring");
      const result = await monitorProjectHealth(projectId);
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: (err as Error).message,
        stack: (err as Error).stack,
        context: { url: req.url, taskUid: req.body.projectId },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Heartbeat Self-Healing Callback
  app.post("/api/scheduled/heal-project", async (req, res) => {
    try {
      const { sdk } = await import("./sdk");
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        return res.status(403).json({ error: "cron-only" });
      }

      const { projectId } = req.body;
      const { selfHealingCheck } = await import("../heartbeat-healing");
      const result = await selfHealingCheck(projectId);
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: (err as Error).message,
        stack: (err as Error).stack,
        context: { url: req.url, taskUid: req.body.projectId },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  // V produkci (Railway/Render/…) MUSÍME bindovat přesně na přidělený $PORT —
  // hledání „volného" portu by způsobilo, že platforma na server nedosáhne (502).
  // Lokálně necháme fallback na nejbližší volný port kvůli pohodlí při vývoji.
  const port =
    process.env.NODE_ENV === "production"
      ? preferredPort
      : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

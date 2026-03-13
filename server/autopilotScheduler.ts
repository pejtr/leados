/**
 * Autopilot Scheduler — background worker that checks for due autopilot configs
 * and triggers lead generation pipeline runs.
 */

import {
  getDueAutopilotConfigs,
  createAutopilotRun,
  updateAutopilotRun,
  updateAutopilotConfig,
} from "./db";
import { runLeadPipeline } from "./leadPipeline";
import { dispatchWebhooks } from "./webhookDispatcher";
import { notifyOwner } from "./_core/notification";

const CHECK_INTERVAL_MS = 60_000; // Check every 60 seconds

function computeNextRunAt(
  scheduleType: string,
  scheduleDayOfWeek: number | null,
  scheduleHour: number
): Date {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(scheduleHour);

  switch (scheduleType) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() !== (scheduleDayOfWeek ?? 1));
      break;

    case "monthly":
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      break;
    default:
      next.setDate(next.getDate() + 7);
  }

  return next;
}

async function processAutopilotConfig(config: Awaited<ReturnType<typeof getDueAutopilotConfigs>>[0]) {
  console.log(`[Autopilot] Starting run for config "${config.name}" (id=${config.id})`);

  const runId = await createAutopilotRun({
    configId: config.id,
    userId: config.userId,
    status: "running",
  });

  try {
    const result = await runLeadPipeline({
      industry: config.industry,
      location: config.location,
      seniorityLevel: config.seniorityLevel,
      count: config.leadCount,
      segment: config.segment ?? undefined,
    });

    const nextRunAt = computeNextRunAt(config.scheduleType, config.scheduleDayOfWeek, config.scheduleHour);

    await updateAutopilotRun(runId, {
      status: "completed",
      leadsGenerated: result.leads.length,
      completedAt: new Date(),
    });

    await updateAutopilotConfig(config.id, config.userId, {
      lastRunAt: new Date(),
      nextRunAt,
      totalRuns: config.totalRuns + 1,
      totalLeadsGenerated: config.totalLeadsGenerated + result.leads.length,
    });

    // Dispatch webhooks for autopilot-generated leads
    if (result.leads.length > 0) {
      dispatchWebhooks(config.userId, "generate", result.leads as any, {
        source: "autopilot",
        configName: config.name,
      }).catch((err) => console.error("[Autopilot] Webhook dispatch error:", err));
    }

    // Notify owner
    notifyOwner({
      title: `Autopilot: ${config.name} completed`,
      content: `Generated ${result.leads.length} leads for ${config.industry} in ${config.location}. Next run: ${nextRunAt.toISOString()}`,
    }).catch(() => {});

    console.log(`[Autopilot] Run completed: ${result.leads.length} leads generated for config "${config.name}"`);
  } catch (err: any) {
    console.error(`[Autopilot] Run failed for config "${config.name}":`, err);

    await updateAutopilotRun(runId, {
      status: "failed",
      errorMessage: err?.message || "Unknown error",
      completedAt: new Date(),
    });

    const nextRunAt = computeNextRunAt(config.scheduleType, config.scheduleDayOfWeek, config.scheduleHour);
    await updateAutopilotConfig(config.id, config.userId, {
      lastRunAt: new Date(),
      nextRunAt,
    });
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startAutopilotScheduler() {
  if (intervalId) return;

  console.log("[Autopilot] Scheduler started — checking every 60s");

  intervalId = setInterval(async () => {
    try {
      const dueConfigs = await getDueAutopilotConfigs();
      if (dueConfigs.length > 0) {
        console.log(`[Autopilot] Found ${dueConfigs.length} due config(s)`);
        for (const config of dueConfigs) {
          await processAutopilotConfig(config);
        }
      }
    } catch (err) {
      console.error("[Autopilot] Scheduler error:", err);
    }
  }, CHECK_INTERVAL_MS);
}

export function stopAutopilotScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Autopilot] Scheduler stopped");
  }
}

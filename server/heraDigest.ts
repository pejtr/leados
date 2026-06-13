/**
 * HERA Daily Brief — autonomous morning marketing action plan.
 * Mirrors hermesDigest: generated from live platform data and delivered via
 * notifyOwner. Scheduled daily at 08:10 CET (after the HERMES digest at 08:00).
 * Set once, runs forever — no prompting needed.
 */

import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";
import { getUserByOpenId } from "./db";
import { generateHeraDailyBrief } from "./heraAgent";
import { buildPlatformContext } from "./hermesRouter";

export async function sendHeraDailyBrief(): Promise<void> {
  try {
    const owner = ENV.ownerOpenId ? await getUserByOpenId(ENV.ownerOpenId) : undefined;
    if (!owner) {
      console.warn("[HERA Brief] Owner not found — skipping daily brief");
      return;
    }

    const platformContext = await buildPlatformContext(owner.id);
    const brief = await generateHeraDailyBrief(platformContext);

    await notifyOwner({
      title: "🎯 HERA — dnešní marketingové akce",
      content: brief,
    });
    console.log("[HERA Brief] Daily marketing brief sent");
  } catch (error) {
    console.error("[HERA Brief] Failed to send daily brief:", error);
  }
}

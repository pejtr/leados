/**
 * Heartbeat Self-Healing — Autonomous Project Escalation
 * Auto-escalates stalled projects and performs corrective actions
 */

import { getDb } from "./db";
import { projects } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Self-healing check for a single project
 * - Auto-escalate stalled projects (pending for >24 hours)
 * - Auto-mark delayed projects as failed if >2x deadline
 */
export async function selfHealingCheck(projectId: string) {
  try {
    const db = await getDb();
    if (!db) {
      return { ok: false, error: "Database not available" };
    }

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project[0]) {
      return { ok: true, skipped: "project-not-found" };
    }

    const now = Date.now();
    let healed = false;

    // Auto-escalate stalled projects (pending for >24 hours)
    if (
      project[0].status === "pending" &&
      now - project[0].createdAt.getTime() > 24 * 60 * 60 * 1000
    ) {
      const db2 = await getDb();
      if (db2) {
        await db2
          .update(projects)
          .set({ status: "in_progress", updatedAt: new Date() })
          .where(eq(projects.id, projectId));

        await notifyOwner({
          title: `✅ Auto-Escalated: ${project[0].title}`,
          content: "Project moved from pending to in_progress after 24 hours of inactivity.",
        });

        healed = true;
      }
    }

    // Auto-mark as failed if >2x deadline
    if (
      project[0].deadline &&
      project[0].status === "in_progress" &&
      now > project[0].deadline * 2
    ) {
      const db3 = await getDb();
      if (db3) {
        await db3
          .update(projects)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(projects.id, projectId));

        await notifyOwner({
          title: `❌ Auto-Failed: ${project[0].title}`,
          content: `Project exceeded deadline by 2x (${Math.floor((now - project[0].deadline) / (1000 * 60 * 60 * 24))} days). Marked as failed.`,
        });

        healed = true;
      }
    }

    return { ok: true, projectId, healed };
  } catch (err) {
    console.error(`Error in self-healing check for project ${projectId}:`, err);
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Run self-healing on all projects
 * Called by system-wide Heartbeat job
 */
export async function healAllProjects() {
  try {
    const db = await getDb();
    if (!db) {
      return { ok: false, error: "Database not available" };
    }

    const allProjects = await db.select().from(projects);

    let healed = 0;

    for (const project of allProjects) {
      const result = await selfHealingCheck(project.id);
      if ((result as any).healed) {
        healed++;
      }
    }

    return { ok: true, healed, total: allProjects.length };
  } catch (err) {
    console.error("Error in system-wide self-healing:", err);
    return { ok: false, error: (err as Error).message };
  }
}

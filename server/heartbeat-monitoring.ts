/**
 * Heartbeat Monitoring — Project Health Checks
 * Monitors project status, detects overdue projects, and stalled milestones
 */

import { getDb } from "./db";
import { projects, projectMilestones } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Monitor project health status
 * - Check if project is overdue
 * - Check for stalled milestones (in_progress for >3 days)
 * - Send alerts if issues detected
 */
export async function monitorProjectHealth(projectId: string) {
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
    const isOverdue = project[0].deadline && project[0].deadline < now;

    // Alert if project is overdue and not completed
    if (isOverdue && project[0].status !== "completed" && project[0].deadline) {
      const daysOverdue = Math.floor((now - project[0].deadline) / (1000 * 60 * 60 * 24));
      await notifyOwner({
        title: `⚠️ Project Overdue: ${project[0].title}`,
        content: `Project deadline was ${new Date(project[0].deadline).toLocaleDateString()}. Status: ${project[0].status}. Days overdue: ${daysOverdue}`,
      });
    }

    // Check for stalled milestones
    const db2 = await getDb();
    if (!db2) {
      return { ok: false, error: "Database not available" };
    }

    const milestones = await db2
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId));

    for (const milestone of milestones) {
      if (milestone.status === "in_progress" && milestone.createdAt) {
        const createdTime = milestone.createdAt instanceof Date ? milestone.createdAt.getTime() : milestone.createdAt;
        const stalledDays = (now - createdTime) / (1000 * 60 * 60 * 24);
        if (stalledDays > 3) {
          await notifyOwner({
            title: `🔧 Stalled Milestone: ${milestone.title}`,
            content: `Milestone has been in progress for ${Math.floor(stalledDays)} days. Project: ${project[0].title}`,
          });
        }
      }
    }

    return { ok: true, projectId, checked: true, isOverdue };
  } catch (err) {
    console.error(`Error monitoring project ${projectId}:`, err);
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Check all active projects for health issues
 * Called by Heartbeat job to perform system-wide monitoring
 */
export async function monitorAllProjects() {
  try {
    const db = await getDb();
    if (!db) {
      return { ok: false, error: "Database not available" };
    }

    const activeProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.status, "in_progress"));

    let checked = 0;
    let alerts = 0;

    for (const project of activeProjects) {
      const result = await monitorProjectHealth(project.id);
      if ((result as any).checked) {
        checked++;
      }
      if ((result as any).isOverdue) {
        alerts++;
      }
    }

    return { ok: true, checked, alerts };
  } catch (err) {
    console.error("Error monitoring all projects:", err);
    return { ok: false, error: (err as Error).message };
  }
}

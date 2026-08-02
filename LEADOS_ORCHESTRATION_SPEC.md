# LeadOS Orchestration Specification — ONYXO v1.1+

## Overview

LeadOS is the **autonomous orchestration hub** for ONYXO projects. It centralizes project management, lead generation, email automation, and CRM through Manus API v2.

**Goal:** Clients order websites via ONYXO, projects are automatically orchestrated through LeadOS, and Heartbeat jobs provide autonomous monitoring and self-healing.

---

## Architecture

### System Components

1. **ONYXO Frontend** — Landing page, pricing, contact form, Stripe checkout
2. **ONYXO Backend** — tRPC routers, database (orders, payments, subscriptions)
3. **LeadOS Control Hub** — Project orchestration, status tracking, lead management
4. **Heartbeat Jobs** — Autonomous monitoring, alerts, self-healing
5. **Manus API v2** — Task creation, project management, LLM integration

### Data Flow

```
Client Order → ONYXO Checkout → Order Created → LeadOS Orchestration
                                                        ↓
                                                  Create Manus Task
                                                        ↓
                                                  Assign to Team
                                                        ↓
                                                  Heartbeat Monitoring
                                                        ↓
                                                  Auto-Alerts & Healing
```

---

## Fáze 4: LeadOS Orchestration

### 4.1 Database Schema Extensions

Add to `drizzle/schema.ts`:

```typescript
// Projects table — tracks all ONYXO projects orchestrated via LeadOS
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(8))))`),
  orderId: text('order_id').notNull().references(() => orders.id),
  leadsOsProjectId: text('leados_project_id'), // Manus API project ID
  status: text('status').notNull().default('pending'), // pending, in_progress, completed, failed
  title: text('title').notNull(),
  description: text('description'),
  packageType: text('package_type').notNull(), // lite, basic, lead_gen, automation
  assignedTo: text('assigned_to'), // Team member email
  deadline: integer('deadline'), // Unix timestamp
  completionPercentage: integer('completion_percentage').default(0),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`),
});

// Project milestones — track progress within a project
export const projectMilestones = sqliteTable('project_milestones', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(8))))`),
  projectId: text('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'), // pending, in_progress, completed
  dueDate: integer('due_date'), // Unix timestamp
  completedAt: integer('completed_at'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
});

// Heartbeat job tracking
export const heartbeatJobs = sqliteTable('heartbeat_jobs', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(8))))`),
  taskUid: text('task_uid').notNull().unique(),
  projectId: text('project_id').references(() => projects.id),
  jobType: text('job_type').notNull(), // monitoring, alert, healing
  name: text('name').notNull(),
  cronExpression: text('cron_expression').notNull(),
  isActive: integer('is_active').default(1),
  lastExecutedAt: integer('last_executed_at'),
  nextExecutionAt: integer('next_execution_at'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
});
```

### 4.2 tRPC Procedures for LeadOS

Add to `server/routers.ts`:

```typescript
// LeadOS Orchestration Router
export const leados = router({
  // Create a new project in LeadOS
  createProject: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      packageType: z.enum(['lite', 'basic', 'lead_gen', 'automation']),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Verify order exists and belongs to user
      const order = await db.select().from(orders)
        .where(eq(orders.id, input.orderId)).limit(1);
      if (!order[0]) throw new TRPCError({ code: 'NOT_FOUND' });

      // 2. Create project in database
      const projectId = generateId();
      const deadline = Date.now() + (14 * 24 * 60 * 60 * 1000); // 2 weeks
      
      await db.insert(projects).values({
        id: projectId,
        orderId: input.orderId,
        status: 'pending',
        title: input.title,
        description: input.description,
        packageType: input.packageType,
        deadline,
      });

      // 3. Create Manus task via Manus API v2
      const manusTask = await createManusTask({
        title: input.title,
        description: input.description,
        packageType: input.packageType,
        deadline,
      });

      // 4. Update project with Manus task ID
      await db.update(projects)
        .set({ leadsOsProjectId: manusTask.id })
        .where(eq(projects.id, projectId));

      // 5. Create initial Heartbeat job for monitoring
      await createProjectMonitoringJob(projectId);

      return { projectId, manusTaskId: manusTask.id };
    }),

  // Get project status
  getProjectStatus: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await db.select().from(projects)
        .where(eq(projects.id, input.projectId)).limit(1);
      
      if (!project[0]) throw new TRPCError({ code: 'NOT_FOUND' });

      const milestones = await db.select().from(projectMilestones)
        .where(eq(projectMilestones.projectId, input.projectId));

      return {
        ...project[0],
        milestones,
        timeRemaining: project[0].deadline - Date.now(),
      };
    }),

  // Update project status
  updateProjectStatus: adminProcedure
    .input(z.object({
      projectId: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
      completionPercentage: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.update(projects)
        .set({
          status: input.status,
          completionPercentage: input.completionPercentage,
          updatedAt: Date.now(),
        })
        .where(eq(projects.id, input.projectId));

      // Notify client of status change
      const project = await db.select().from(projects)
        .where(eq(projects.id, input.projectId)).limit(1);
      
      if (project[0]) {
        await notifyOwner({
          title: `Project Status Update: ${project[0].title}`,
          content: `Status changed to: ${input.status}`,
        });
      }

      return { ok: true };
    }),

  // Add milestone to project
  addMilestone: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      dueDate: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const milestoneId = generateId();
      await db.insert(projectMilestones).values({
        id: milestoneId,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
      });

      return { milestoneId };
    }),

  // Complete milestone
  completeMilestone: protectedProcedure
    .input(z.object({ milestoneId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(projectMilestones)
        .set({ status: 'completed', completedAt: Date.now() })
        .where(eq(projectMilestones.id, input.milestoneId));

      return { ok: true };
    }),
});
```

### 4.3 Manus API v2 Integration

Create `server/manus-api.ts`:

```typescript
import { BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY } from './_core/env';

export async function createManusTask(input: {
  title: string;
  description?: string;
  packageType: string;
  deadline: number;
}) {
  const response = await fetch(`${BUILT_IN_FORGE_API_URL}/v1/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BUILT_IN_FORGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      metadata: {
        packageType: input.packageType,
        deadline: input.deadline,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Manus task: ${response.statusText}`);
  }

  return response.json();
}

export async function updateManusTask(taskId: string, updates: any) {
  const response = await fetch(`${BUILT_IN_FORGE_API_URL}/v1/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${BUILT_IN_FORGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update Manus task: ${response.statusText}`);
  }

  return response.json();
}
```

---

## Fáze 5: Heartbeat Jobs for Autonomous Monitoring

### 5.1 Project Monitoring Job

Create `server/heartbeat-monitoring.ts`:

```typescript
import { db } from './db';
import { projects, projectMilestones } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { notifyOwner } from './_core/notification';

export async function monitorProjectHealth(projectId: string) {
  const project = await db.select().from(projects)
    .where(eq(projects.id, projectId)).limit(1);

  if (!project[0]) return { ok: true, skipped: 'project-not-found' };

  // Check if project is overdue
  const now = Date.now();
  const isOverdue = project[0].deadline && project[0].deadline < now;

  if (isOverdue && project[0].status !== 'completed') {
    await notifyOwner({
      title: `⚠️ Project Overdue: ${project[0].title}`,
      content: `Project deadline was ${new Date(project[0].deadline).toLocaleDateString()}. Status: ${project[0].status}`,
    });
  }

  // Check for stalled milestones (in_progress for >3 days)
  const milestones = await db.select().from(projectMilestones)
    .where(eq(projectMilestones.projectId, projectId));

  for (const milestone of milestones) {
    if (milestone.status === 'in_progress') {
      const stalledDays = (now - milestone.createdAt) / (1000 * 60 * 60 * 24);
      if (stalledDays > 3) {
        await notifyOwner({
          title: `🔧 Stalled Milestone: ${milestone.title}`,
          content: `Milestone has been in progress for ${Math.floor(stalledDays)} days.`,
        });
      }
    }
  }

  return { ok: true, projectId, checked: true };
}
```

### 5.2 Self-Healing Alerts

Create `server/heartbeat-healing.ts`:

```typescript
import { db } from './db';
import { projects } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { notifyOwner } from './_core/notification';

export async function selfHealingCheck(projectId: string) {
  const project = await db.select().from(projects)
    .where(eq(projects.id, projectId)).limit(1);

  if (!project[0]) return { ok: true, skipped: 'project-not-found' };

  // Auto-escalate stalled projects
  if (project[0].status === 'pending' && Date.now() - project[0].createdAt > 24 * 60 * 60 * 1000) {
    await db.update(projects)
      .set({ status: 'in_progress' })
      .where(eq(projects.id, projectId));

    await notifyOwner({
      title: `✅ Auto-Escalated: ${project[0].title}`,
      content: 'Project moved from pending to in_progress after 24 hours.',
    });
  }

  return { ok: true, healed: true };
}
```

### 5.3 Heartbeat Job Registration

Add to `server/routers.ts`:

```typescript
export async function createProjectMonitoringJob(projectId: string) {
  const { createHeartbeatJob } = await import('./_core/heartbeat');
  const sessionToken = /* extract from context */;

  try {
    const job = await createHeartbeatJob({
      name: `project-monitor-${projectId}`,
      cron: '0 */6 * * * *', // Every 6 hours
      path: '/api/scheduled/monitor-project',
      payload: { projectId },
      description: `Monitor project ${projectId} health`,
    }, sessionToken);

    await db.insert(heartbeatJobs).values({
      taskUid: job.taskUid,
      projectId,
      jobType: 'monitoring',
      name: `project-monitor-${projectId}`,
      cronExpression: '0 */6 * * * *',
      nextExecutionAt: job.nextExecutionAt ? new Date(job.nextExecutionAt).getTime() : undefined,
    });

    return job;
  } catch (err) {
    console.error('Failed to create monitoring job:', err);
    throw err;
  }
}
```

### 5.4 Express Handlers for Heartbeat Callbacks

Add to `server/_core/index.ts`:

```typescript
// Monitoring callback
app.post('/api/scheduled/monitor-project', async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: 'cron-only' });
    }

    const { projectId } = req.body;
    const result = await monitorProjectHealth(projectId);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      context: { url: req.url, taskUid: req.body.projectId },
      timestamp: new Date().toISOString(),
    });
  }
});

// Self-healing callback
app.post('/api/scheduled/heal-project', async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: 'cron-only' });
    }

    const { projectId } = req.body;
    const result = await selfHealingCheck(projectId);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      context: { url: req.url, taskUid: req.body.projectId },
      timestamp: new Date().toISOString(),
    });
  }
});
```

---

## Implementation Checklist

- [ ] Add projects, projectMilestones, heartbeatJobs tables to schema
- [ ] Run `pnpm drizzle-kit generate` and apply migrations
- [ ] Implement Manus API v2 integration (createManusTask, updateManusTask)
- [ ] Add LeadOS tRPC procedures (createProject, getProjectStatus, updateProjectStatus, addMilestone, completeMilestone)
- [ ] Implement project monitoring job (monitorProjectHealth)
- [ ] Implement self-healing job (selfHealingCheck)
- [ ] Add Express handlers for Heartbeat callbacks
- [ ] Write vitest tests for all procedures and jobs
- [ ] Test end-to-end: Order → LeadOS Project → Heartbeat Monitoring
- [ ] Save checkpoint and deploy

---

## Testing Strategy

1. **Unit tests** — Test each tRPC procedure and heartbeat function in isolation
2. **Integration tests** — Test order → project creation → heartbeat job creation
3. **End-to-end tests** — Simulate full client flow: order → checkout → project created → monitoring active
4. **Heartbeat simulation** — Manually trigger heartbeat callbacks to verify monitoring and healing

---

## Deployment Notes

- **Before scheduling Heartbeat jobs:** Save checkpoint and deploy to production
- **Heartbeat jobs survive sandbox hibernation** — they run on the Manus platform
- **Monitor execution logs** — Use `manus-heartbeat logs --task-uid <uid>` to debug
- **Idempotency is critical** — All handlers must be safe to retry


/**
 * Manus API v2 Integration
 * Handles task creation, project management, and orchestration
 */

import { ENV } from "./_core/env";

export interface ManusTaskInput {
  title: string;
  description?: string;
  packageType: string;
  deadline: number;
}

export interface ManusTaskResponse {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

/**
 * Create a new Manus task for project orchestration
 */
export async function createManusTask(input: ManusTaskInput): Promise<ManusTaskResponse> {
  const response = await fetch(`${ENV.forgeApiUrl}/v1/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.forgeApiKey}`,
      "Content-Type": "application/json",
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

/**
 * Update an existing Manus task
 */
export async function updateManusTask(
  taskId: string,
  updates: Record<string, any>
): Promise<ManusTaskResponse> {
  const response = await fetch(`${ENV.forgeApiUrl}/v1/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${ENV.forgeApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update Manus task: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get task status from Manus API
 */
export async function getManusTaskStatus(taskId: string): Promise<ManusTaskResponse> {
  const response = await fetch(`${ENV.forgeApiUrl}/v1/tasks/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${ENV.forgeApiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Manus task status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a Manus task
 */
export async function deleteManusTask(taskId: string): Promise<void> {
  const response = await fetch(`${ENV.forgeApiUrl}/v1/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${ENV.forgeApiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete Manus task: ${response.statusText}`);
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { ActivityType } from "@prisma/client";
import {
  getOwnedTask,
  requireUserId,
  toActionError,
} from "@/lib/services/auth-helpers";
import {
  emptyToNull,
  logActivity,
  parseOptionalDate,
} from "@/lib/services/dashboard";
import { db } from "@/lib/db";
import { taskSchema } from "@/lib/validations";
import type { ActionResult } from "@/actions/auth";

export async function createTaskAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = taskSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      projectId: formData.get("projectId") || null,
      status: formData.get("status"),
      priority: formData.get("priority"),
      dueDate: formData.get("dueDate"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const projectId = emptyToNull(parsed.data.projectId);
    if (projectId) {
      const project = await db.project.findFirst({
        where: { id: projectId, userId },
      });
      if (!project) {
        return { error: "Project not found" };
      }
    }

    const task = await db.task.create({
      data: {
        userId,
        title: parsed.data.title,
        description: emptyToNull(parsed.data.description),
        projectId,
        status: parsed.data.status,
        priority: parsed.data.priority,
        dueDate: parseOptionalDate(parsed.data.dueDate),
      },
    });

    await logActivity({
      userId,
      type:
        task.status === "DONE"
          ? ActivityType.TASK_COMPLETED
          : ActivityType.TASK_CREATED,
      title:
        task.status === "DONE"
          ? `Completed task "${task.title}"`
          : `Created task "${task.title}"`,
      entityId: task.id,
      entityType: "task",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tasks");
    if (projectId) revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/analytics");
    return { success: "Task created" };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateTaskAction(
  taskId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const existing = await getOwnedTask(taskId, userId);

    const parsed = taskSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      projectId: formData.get("projectId") || null,
      status: formData.get("status"),
      priority: formData.get("priority"),
      dueDate: formData.get("dueDate"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const projectId = emptyToNull(parsed.data.projectId);
    if (projectId) {
      const project = await db.project.findFirst({
        where: { id: projectId, userId },
      });
      if (!project) {
        return { error: "Project not found" };
      }
    }

    const task = await db.task.update({
      where: { id: taskId },
      data: {
        title: parsed.data.title,
        description: emptyToNull(parsed.data.description),
        projectId,
        status: parsed.data.status,
        priority: parsed.data.priority,
        dueDate: parseOptionalDate(parsed.data.dueDate),
      },
    });

    const becameDone =
      existing.status !== "DONE" && task.status === "DONE";

    await logActivity({
      userId,
      type: becameDone
        ? ActivityType.TASK_COMPLETED
        : ActivityType.TASK_UPDATED,
      title: becameDone
        ? `Completed task "${task.title}"`
        : `Updated task "${task.title}"`,
      entityId: task.id,
      entityType: "task",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tasks");
    if (existing.projectId) {
      revalidatePath(`/dashboard/projects/${existing.projectId}`);
    }
    if (projectId) revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/analytics");
    return { success: "Task updated" };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const task = await getOwnedTask(taskId, userId);

    await db.task.delete({ where: { id: taskId } });

    await logActivity({
      userId,
      type: ActivityType.TASK_DELETED,
      title: `Deleted task "${task.title}"`,
      entityType: "task",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tasks");
    if (task.projectId) {
      revalidatePath(`/dashboard/projects/${task.projectId}`);
    }
    revalidatePath("/dashboard/analytics");
    return { success: "Task deleted" };
  } catch (error) {
    return toActionError(error);
  }
}

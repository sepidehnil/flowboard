"use server";

import { revalidatePath } from "next/cache";
import { ActivityType } from "@prisma/client";
import {
  requireUserId,
  getOwnedProject,
  toActionError,
} from "@/lib/services/auth-helpers";
import {
  emptyToNull,
  logActivity,
  parseOptionalDate,
} from "@/lib/services/dashboard";
import { db } from "@/lib/db";
import { projectSchema } from "@/lib/validations";
import type { ActionResult } from "@/actions/auth";

export async function createProjectAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = projectSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      clientId: formData.get("clientId") || null,
      status: formData.get("status"),
      progress: Number(formData.get("progress")),
      deadline: formData.get("deadline"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const clientId = emptyToNull(parsed.data.clientId);
    if (clientId) {
      const client = await db.client.findFirst({
        where: { id: clientId, userId },
      });
      if (!client) {
        return { error: "Client not found" };
      }
    }

    const project = await db.project.create({
      data: {
        userId,
        name: parsed.data.name,
        description: emptyToNull(parsed.data.description),
        clientId,
        status: parsed.data.status,
        progress: parsed.data.progress,
        deadline: parseOptionalDate(parsed.data.deadline),
      },
    });

    await logActivity({
      userId,
      type: ActivityType.PROJECT_CREATED,
      title: `Created project "${project.name}"`,
      entityId: project.id,
      entityType: "project",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard/analytics");
    return { success: "Project created" };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateProjectAction(
  projectId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await getOwnedProject(projectId, userId);

    const parsed = projectSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      clientId: formData.get("clientId") || null,
      status: formData.get("status"),
      progress: Number(formData.get("progress")),
      deadline: formData.get("deadline"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const clientId = emptyToNull(parsed.data.clientId);
    if (clientId) {
      const client = await db.client.findFirst({
        where: { id: clientId, userId },
      });
      if (!client) {
        return { error: "Client not found" };
      }
    }

    const project = await db.project.update({
      where: { id: projectId },
      data: {
        name: parsed.data.name,
        description: emptyToNull(parsed.data.description),
        clientId,
        status: parsed.data.status,
        progress: parsed.data.progress,
        deadline: parseOptionalDate(parsed.data.deadline),
      },
    });

    await logActivity({
      userId,
      type: ActivityType.PROJECT_UPDATED,
      title: `Updated project "${project.name}"`,
      entityId: project.id,
      entityType: "project",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/analytics");
    return { success: "Project updated" };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteProjectAction(projectId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const project = await getOwnedProject(projectId, userId);

    await db.project.delete({ where: { id: projectId } });

    await logActivity({
      userId,
      type: ActivityType.PROJECT_DELETED,
      title: `Deleted project "${project.name}"`,
      entityType: "project",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard/analytics");
    return { success: "Project deleted" };
  } catch (error) {
    return toActionError(error);
  }
}

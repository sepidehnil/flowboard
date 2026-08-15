"use server";

import { revalidatePath } from "next/cache";
import { ActivityType } from "@prisma/client";
import {
  getOwnedClient,
  requireUserId,
  toActionError,
} from "@/lib/services/auth-helpers";
import { emptyToNull, logActivity } from "@/lib/services/dashboard";
import { db } from "@/lib/db";
import { clientSchema } from "@/lib/validations";
import type { ActionResult } from "@/actions/auth";

export async function createClientAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = clientSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company"),
      phone: formData.get("phone"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const client = await db.client.create({
      data: {
        userId,
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        company: emptyToNull(parsed.data.company),
        phone: emptyToNull(parsed.data.phone),
      },
    });

    await logActivity({
      userId,
      type: ActivityType.CLIENT_CREATED,
      title: `Added new client ${client.company ?? client.name}`,
      entityId: client.id,
      entityType: "client",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clients");
    return { success: "Client created" };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateClientAction(
  clientId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await getOwnedClient(clientId, userId);

    const parsed = clientSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company"),
      phone: formData.get("phone"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const client = await db.client.update({
      where: { id: clientId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        company: emptyToNull(parsed.data.company),
        phone: emptyToNull(parsed.data.phone),
      },
    });

    await logActivity({
      userId,
      type: ActivityType.CLIENT_UPDATED,
      title: `Updated client ${client.company ?? client.name}`,
      entityId: client.id,
      entityType: "client",
    });

    revalidatePath("/dashboard/clients");
    return { success: "Client updated" };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteClientAction(clientId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const client = await getOwnedClient(clientId, userId);

    await db.client.delete({ where: { id: clientId } });

    await logActivity({
      userId,
      type: ActivityType.CLIENT_DELETED,
      title: `Deleted client ${client.company ?? client.name}`,
      entityType: "client",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard/invoices");
    return { success: "Client deleted" };
  } catch (error) {
    return toActionError(error);
  }
}

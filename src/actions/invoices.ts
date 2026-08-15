"use server";

import { revalidatePath } from "next/cache";
import { ActivityType } from "@prisma/client";
import {
  getOwnedInvoice,
  requireUserId,
  toActionError,
} from "@/lib/services/auth-helpers";
import {
  emptyToNull,
  logActivity,
  parseOptionalDate,
  toDecimal,
} from "@/lib/services/dashboard";
import { db } from "@/lib/db";
import { invoiceSchema } from "@/lib/validations";
import type { ActionResult } from "@/actions/auth";

export async function createInvoiceAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = invoiceSchema.safeParse({
      invoiceNumber: formData.get("invoiceNumber"),
      clientId: formData.get("clientId") || null,
      amount: Number(formData.get("amount")),
      status: formData.get("status"),
      issueDate: formData.get("issueDate"),
      dueDate: formData.get("dueDate"),
      notes: formData.get("notes"),
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

    const issueDate = parseOptionalDate(parsed.data.issueDate);
    const dueDate = parseOptionalDate(parsed.data.dueDate);
    if (!issueDate || !dueDate) {
      return { error: "Valid issue and due dates are required" };
    }

    const existing = await db.invoice.findFirst({
      where: { userId, invoiceNumber: parsed.data.invoiceNumber },
    });
    if (existing) {
      return { error: "Invoice number already exists" };
    }

    const invoice = await db.invoice.create({
      data: {
        userId,
        invoiceNumber: parsed.data.invoiceNumber,
        clientId,
        amount: toDecimal(parsed.data.amount),
        status: parsed.data.status,
        issueDate,
        dueDate,
        notes: emptyToNull(parsed.data.notes),
      },
    });

    await logActivity({
      userId,
      type: ActivityType.INVOICE_CREATED,
      title: `Created invoice #${invoice.invoiceNumber}`,
      entityId: invoice.id,
      entityType: "invoice",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/analytics");
    return { success: "Invoice created" };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateInvoiceAction(
  invoiceId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await getOwnedInvoice(invoiceId, userId);

    const parsed = invoiceSchema.safeParse({
      invoiceNumber: formData.get("invoiceNumber"),
      clientId: formData.get("clientId") || null,
      amount: Number(formData.get("amount")),
      status: formData.get("status"),
      issueDate: formData.get("issueDate"),
      dueDate: formData.get("dueDate"),
      notes: formData.get("notes"),
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

    const issueDate = parseOptionalDate(parsed.data.issueDate);
    const dueDate = parseOptionalDate(parsed.data.dueDate);
    if (!issueDate || !dueDate) {
      return { error: "Valid issue and due dates are required" };
    }

    const conflict = await db.invoice.findFirst({
      where: {
        userId,
        invoiceNumber: parsed.data.invoiceNumber,
        NOT: { id: invoiceId },
      },
    });
    if (conflict) {
      return { error: "Invoice number already exists" };
    }

    const invoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        invoiceNumber: parsed.data.invoiceNumber,
        clientId,
        amount: toDecimal(parsed.data.amount),
        status: parsed.data.status,
        issueDate,
        dueDate,
        notes: emptyToNull(parsed.data.notes),
      },
    });

    await logActivity({
      userId,
      type: ActivityType.INVOICE_UPDATED,
      title: `Updated invoice #${invoice.invoiceNumber}`,
      entityId: invoice.id,
      entityType: "invoice",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/analytics");
    return { success: "Invoice updated" };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteInvoiceAction(
  invoiceId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const invoice = await getOwnedInvoice(invoiceId, userId);

    await db.invoice.delete({ where: { id: invoiceId } });

    await logActivity({
      userId,
      type: ActivityType.INVOICE_DELETED,
      title: `Deleted invoice #${invoice.invoiceNumber}`,
      entityType: "invoice",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/analytics");
    return { success: "Invoice deleted" };
  } catch (error) {
    return toActionError(error);
  }
}

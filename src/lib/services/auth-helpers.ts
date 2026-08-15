import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Unauthorized", 401);
  }
  return session.user;
}

export async function requireUserId() {
  const user = await requireUser();
  return user.id;
}

export async function getOwnedProject(projectId: string, userId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      client: true,
      tasks: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) {
    throw new AppError("Project not found", 404);
  }
  return project;
}

export async function getOwnedTask(taskId: string, userId: string) {
  const task = await db.task.findFirst({
    where: { id: taskId, userId },
    include: { project: true },
  });
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  return task;
}

export async function getOwnedClient(clientId: string, userId: string) {
  const client = await db.client.findFirst({
    where: { id: clientId, userId },
  });
  if (!client) {
    throw new AppError("Client not found", 404);
  }
  return client;
}

export async function getOwnedInvoice(invoiceId: string, userId: string) {
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { client: true },
  });
  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }
  return invoice;
}

export function toActionError(error: unknown): { error: string } {
  if (error instanceof AppError) {
    return { error: error.message };
  }
  if (error instanceof Error && error.name === "ZodError") {
    return { error: "Invalid input. Please check the form and try again." };
  }
  console.error(error);
  return { error: "Something went wrong. Please try again." };
}

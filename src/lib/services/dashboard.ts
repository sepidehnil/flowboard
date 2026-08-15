import { ActivityType, InvoiceStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function logActivity(params: {
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  entityId?: string;
  entityType?: string;
}) {
  return db.activity.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      description: params.description,
      entityId: params.entityId,
      entityType: params.entityType,
    },
  });
}

export async function getDashboardStats(userId: string) {
  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    paidRevenue,
    outstandingInvoices,
    recentActivities,
  ] = await Promise.all([
    db.project.count({ where: { userId } }),
    db.project.count({
      where: { userId, status: { in: ["PLANNED", "IN_PROGRESS"] } },
    }),
    db.project.count({ where: { userId, status: "COMPLETED" } }),
    db.task.count({ where: { userId } }),
    db.task.count({ where: { userId, status: "DONE" } }),
    db.task.count({
      where: { userId, status: { in: ["TODO", "IN_PROGRESS"] } },
    }),
    db.invoice.aggregate({
      where: { userId, status: InvoiceStatus.PAID },
      _sum: { amount: true },
    }),
    db.invoice.count({
      where: {
        userId,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] },
      },
    }),
    db.activity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    totalRevenue: Number(paidRevenue._sum.amount ?? 0),
    outstandingInvoices,
    recentActivities,
  };
}

export async function getRevenueByMonth(userId: string, months = 6) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  start.setMonth(start.getMonth() - (months - 1));

  const invoices = await db.invoice.findMany({
    where: {
      userId,
      status: InvoiceStatus.PAID,
      issueDate: { gte: start },
    },
    select: { amount: true, issueDate: true },
  });

  const buckets: { label: string; key: string; revenue: number }[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    buckets.push({ label, key, revenue: 0 });
  }

  for (const inv of invoices) {
    const key = `${inv.issueDate.getFullYear()}-${String(inv.issueDate.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) {
      bucket.revenue += Number(inv.amount);
    }
  }

  return buckets.map(({ label, revenue }) => ({ label, revenue }));
}

export async function getProjectStatusBreakdown(userId: string) {
  const groups = await db.project.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });

  const labels: Record<string, string> = {
    COMPLETED: "Completed",
    IN_PROGRESS: "In Progress",
    PLANNED: "Pending",
    ON_HOLD: "On Hold",
  };

  return groups.map((g) => ({
    name: labels[g.status] ?? g.status,
    value: g._count._all,
    status: g.status,
  }));
}

export async function getTaskCompletionBreakdown(userId: string) {
  const [completed, pending] = await Promise.all([
    db.task.count({ where: { userId, status: "DONE" } }),
    db.task.count({
      where: { userId, status: { in: ["TODO", "IN_PROGRESS"] } },
    }),
  ]);

  return [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
  ];
}

export function emptyToNull(value?: string | null) {
  if (!value || value.trim() === "") return null;
  return value;
}

export function parseOptionalDate(value?: string | null) {
  const cleaned = emptyToNull(value);
  if (!cleaned) return null;
  const d = new Date(cleaned);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function toDecimal(amount: number) {
  return new Prisma.Decimal(amount);
}

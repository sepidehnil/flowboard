import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getDashboardStats,
  getProjectStatusBreakdown,
  getRevenueByMonth,
  getTaskCompletionBreakdown,
} from "@/lib/services/dashboard";
import { StatCards } from "@/components/dashboard/stat-cards";
import {
  ProjectStatusChart,
  RevenueChart,
  TaskCompletionChart,
} from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const [stats, revenue, projectStatus, taskCompletion] = await Promise.all([
    getDashboardStats(userId),
    getRevenueByMonth(userId, 8),
    getProjectStatusBreakdown(userId),
    getTaskCompletionBreakdown(userId),
  ]);

  const avgInvoice =
    stats.totalRevenue > 0 && stats.completedProjects > 0
      ? stats.totalRevenue / Math.max(stats.completedProjects, 1)
      : stats.totalRevenue;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Deeper view of delivery velocity and cashflow — all from your own data.
        </p>
      </div>

      <StatCards stats={stats} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Paid revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(stats.totalRevenue)}</p>
            <p className="mt-1 text-sm text-foreground-muted">
              Sum of invoices marked PAID
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completion rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats.totalTasks === 0
                ? "0%"
                : `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`}
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              Completed tasks / total tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue per completed project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(avgInvoice)}</p>
            <p className="mt-1 text-sm text-foreground-muted">
              Rough productivity signal for portfolio demos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart data={revenue} />
        </div>
        <ProjectStatusChart data={projectStatus} />
      </div>
      <TaskCompletionChart data={taskCompletion} />
    </div>
  );
}

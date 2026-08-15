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
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const [stats, revenue, projectStatus, taskCompletion] = await Promise.all([
    getDashboardStats(userId),
    getRevenueByMonth(userId),
    getProjectStatusBreakdown(userId),
    getTaskCompletionBreakdown(userId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Live metrics from your PostgreSQL workspace.
        </p>
      </div>

      <StatCards stats={stats} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart data={revenue} />
        </div>
        <ProjectStatusChart data={projectStatus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TaskCompletionChart data={taskCompletion} />
        <ActivityFeed activities={stats.recentActivities} />
      </div>
    </div>
  );
}

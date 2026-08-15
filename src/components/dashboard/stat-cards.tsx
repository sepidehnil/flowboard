import {
  Briefcase,
  CheckSquare,
  CircleDollarSign,
  ClipboardList,
  FolderOpen,
  Hourglass,
  Receipt,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const icons = {
  projects: Briefcase,
  active: FolderOpen,
  completed: Sparkles,
  revenue: CircleDollarSign,
  tasks: ClipboardList,
  done: CheckSquare,
  pending: Hourglass,
  invoices: Receipt,
};

export function StatCards({
  stats,
}: {
  stats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalRevenue: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    outstandingInvoices: number;
  };
}) {
  const items = [
    {
      label: "Total projects",
      value: String(stats.totalProjects),
      icon: icons.projects,
    },
    {
      label: "Active projects",
      value: String(stats.activeProjects),
      icon: icons.active,
    },
    {
      label: "Completed projects",
      value: String(stats.completedProjects),
      icon: icons.completed,
    },
    {
      label: "Total revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: icons.revenue,
    },
    {
      label: "Total tasks",
      value: String(stats.totalTasks),
      icon: icons.tasks,
    },
    {
      label: "Completed tasks",
      value: String(stats.completedTasks),
      icon: icons.done,
    },
    {
      label: "Pending tasks",
      value: String(stats.pendingTasks),
      icon: icons.pending,
    },
    {
      label: "Outstanding invoices",
      value: String(stats.outstandingInvoices),
      icon: icons.invoices,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="transition-colors hover:border-brand/30">
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
              </div>
              <div className="rounded-lg bg-brand/10 p-2 text-brand">
                <Icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

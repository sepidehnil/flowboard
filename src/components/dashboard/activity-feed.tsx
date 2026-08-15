import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityFeed({
  activities,
}: {
  activities: {
    id: string;
    title: string;
    description: string | null;
    createdAt: Date;
  }[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <p className="text-sm text-foreground-muted">Your latest workspace events</p>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-muted">
            No activity yet. Create a project to get started.
          </p>
        ) : (
          <ul className="space-y-4">
            {activities.map((activity) => (
              <li key={activity.id} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  {activity.description ? (
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      {activity.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-foreground-subtle">
                    {formatDate(activity.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

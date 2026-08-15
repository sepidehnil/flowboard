import { Badge } from "@/components/ui/badge";

export function projectStatusTone(status: string) {
  switch (status) {
    case "COMPLETED":
      return "success" as const;
    case "IN_PROGRESS":
      return "brand" as const;
    case "ON_HOLD":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export function taskStatusTone(status: string) {
  switch (status) {
    case "DONE":
      return "success" as const;
    case "IN_PROGRESS":
      return "brand" as const;
    default:
      return "neutral" as const;
  }
}

export function taskPriorityTone(priority: string) {
  switch (priority) {
    case "URGENT":
      return "danger" as const;
    case "HIGH":
      return "warning" as const;
    case "MEDIUM":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

export function invoiceStatusTone(status: string) {
  switch (status) {
    case "PAID":
      return "success" as const;
    case "SENT":
      return "info" as const;
    case "OVERDUE":
      return "danger" as const;
    case "CANCELLED":
      return "neutral" as const;
    default:
      return "warning" as const;
  }
}

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function StatusBadge({
  status,
  kind,
}: {
  status: string;
  kind: "project" | "task" | "priority" | "invoice";
}) {
  const tone =
    kind === "project"
      ? projectStatusTone(status)
      : kind === "task"
        ? taskStatusTone(status)
        : kind === "priority"
          ? taskPriorityTone(status)
          : invoiceStatusTone(status);

  return <Badge tone={tone}>{formatEnumLabel(status)}</Badge>;
}

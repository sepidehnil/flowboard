"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
} from "@/actions/tasks";
import type { ActionResult } from "@/actions/auth";
import { taskSchema, type TaskInput } from "@/lib/validations";
import { formatDate } from "@/lib/utils";
import { useActionToast } from "@/hooks/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: Date | string | null;
  createdAt: Date | string;
  project: { id: string; name: string } | null;
};

type ProjectOption = { id: string; name: string };

const initial: ActionResult = {};

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

export function TasksManager({
  tasks,
  projects,
}: {
  tasks: TaskRow[];
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [deleting, setDeleting] = useState<TaskRow | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.project?.name.toLowerCase().includes(q);
      const matchesStatus = status === "ALL" || task.status === status;
      const matchesPriority = priority === "ALL" || task.priority === priority;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [tasks, query, status, priority]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Track work across all of your projects.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New task
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
          <Input
            className="pl-9"
            placeholder="Search tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="lg:w-40">
          <option value="ALL">All statuses</option>
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="lg:w-40">
          <option value="ALL">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Create your first task to organize your workload."
          actionLabel="Create Task"
          onAction={() => {
            setEditing(null);
            setOpen(true);
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted/50 text-xs uppercase tracking-wide text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{task.title}</td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {task.project?.name ?? " - "}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.status} kind="task" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.priority} kind="priority" />
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {formatDate(task.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(task);
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(task)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-border md:hidden">
            {filtered.map((task) => (
              <div key={task.id} className="space-y-3 p-4">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-foreground-muted">
                    {task.project?.name ?? "No project"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={task.status} kind="task" />
                  <StatusBadge status={task.priority} kind="priority" />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(task);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(task)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TaskFormModal
        open={open}
        onClose={() => setOpen(false)}
        task={editing}
        projects={projects}
        onSuccess={() => {
          setOpen(false);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete task?"
        description={`Delete "${deleting?.title}" permanently?`}
        loading={pendingDelete}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          startDelete(async () => {
            const result = await deleteTaskAction(deleting.id);
            if (result.error) toast.error(result.error);
            else {
              toast.success("Task deleted");
              setDeleting(null);
              router.refresh();
            }
          });
        }}
      />
    </div>
  );
}

function TaskFormModal({
  open,
  onClose,
  task,
  projects,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  task: TaskRow | null;
  projects: ProjectOption[];
  onSuccess: () => void;
}) {
  const action = task ? updateTaskAction.bind(null, task.id) : createTaskAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const { register, formState: { errors } } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    values: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      projectId: task?.project?.id ?? "",
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "MEDIUM",
      dueDate: toDateInput(task?.dueDate),
    },
  });

  useActionToast(state, onSuccess);

  return (
    <Modal open={open} onClose={onClose} title={task ? "Edit task" : "Create task"}>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title ? <p className="mt-1 text-xs text-danger">{errors.title.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} />
        </div>
        <div>
          <Label htmlFor="projectId">Project</Label>
          <Select id="projectId" {...register("projectId")}>
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" {...register("status")}>
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" {...register("priority")}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : task ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import {
  deleteProjectAction,
  updateProjectAction,
} from "@/actions/projects";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
} from "@/actions/tasks";
import type { ActionResult } from "@/actions/auth";
import { projectSchema, taskSchema, type ProjectInput, type TaskInput } from "@/lib/validations";
import { formatDate, formatPercent } from "@/lib/utils";
import { useActionToast } from "@/hooks/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: Date | string | null;
  projectId: string | null;
};

type ProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  progress: number;
  deadline: Date | string | null;
  createdAt: Date | string;
  client: { id: string; name: string; company: string | null } | null;
  tasks: TaskRow[];
};

type ClientOption = { id: string; name: string; company: string | null };

const initial: ActionResult = {};

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

export function ProjectDetailView({
  project,
  clients,
}: {
  project: ProjectDetail;
  clients: ClientOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskRow | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/projects"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{project.name}</h2>
            <StatusBadge status={project.status} kind="project" />
          </div>
          <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
            {project.description || "No description provided."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => setDeletingProject(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetaCard label="Client" value={project.client?.company ?? project.client?.name ?? "—"} />
        <MetaCard label="Progress" value={formatPercent(project.progress)} />
        <MetaCard label="Deadline" value={formatDate(project.deadline)} />
        <MetaCard label="Created" value={formatDate(project.createdAt)} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Tasks</CardTitle>
            <p className="mt-1 text-sm text-foreground-muted">
              Work items linked to this project
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setTaskOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add task
          </Button>
        </CardHeader>
        <CardContent>
          {project.tasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              No tasks on this project yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {project.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <StatusBadge status={task.status} kind="task" />
                      <StatusBadge status={task.priority} kind="priority" />
                      <span className="text-xs text-foreground-muted">
                        Due {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingTask(task);
                        setTaskOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingTask(task)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ProjectEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        project={project}
        clients={clients}
        onSuccess={() => {
          setEditOpen(false);
          router.refresh();
        }}
      />

      <TaskFormModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        task={editingTask}
        projectId={project.id}
        onSuccess={() => {
          setTaskOpen(false);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={deletingProject}
        title="Delete project?"
        description={`Permanently delete "${project.name}"?`}
        loading={pending}
        onClose={() => setDeletingProject(false)}
        onConfirm={() => {
          startTransition(async () => {
            const result = await deleteProjectAction(project.id);
            if (result.error) toast.error(result.error);
            else {
              toast.success("Project deleted");
              router.push("/dashboard/projects");
              router.refresh();
            }
          });
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        title="Delete task?"
        description={`Delete "${deletingTask?.title}"?`}
        loading={pending}
        onClose={() => setDeletingTask(null)}
        onConfirm={() => {
          if (!deletingTask) return;
          startTransition(async () => {
            const result = await deleteTaskAction(deletingTask.id);
            if (result.error) toast.error(result.error);
            else {
              toast.success("Task deleted");
              setDeletingTask(null);
              router.refresh();
            }
          });
        }}
      />
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ProjectEditModal({
  open,
  onClose,
  project,
  clients,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  project: ProjectDetail;
  clients: ClientOption[];
  onSuccess: () => void;
}) {
  const bound = updateProjectAction.bind(null, project.id);
  const [state, formAction, pending] = useActionState(bound, initial);
  const { register, formState: { errors } } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    values: {
      name: project.name,
      description: project.description ?? "",
      clientId: project.client?.id ?? "",
      status: project.status,
      progress: project.progress,
      deadline: toDateInput(project.deadline),
    },
  });

  useActionToast(state, onSuccess);

  return (
    <Modal open={open} onClose={onClose} title="Edit project">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? <p className="mt-1 text-xs text-danger">{errors.name.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} />
        </div>
        <div>
          <Label htmlFor="clientId">Client</Label>
          <Select id="clientId" {...register("clientId")}>
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company ?? c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" {...register("status")}>
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On hold</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="progress">Progress</Label>
            <Input id="progress" type="number" min={0} max={100} {...register("progress", { valueAsNumber: true })} />
          </div>
        </div>
        <div>
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" type="date" {...register("deadline")} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function TaskFormModal({
  open,
  onClose,
  task,
  projectId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  task: TaskRow | null;
  projectId: string;
  onSuccess: () => void;
}) {
  const action = task
    ? updateTaskAction.bind(null, task.id)
    : createTaskAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const { register, formState: { errors } } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    values: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      projectId,
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "MEDIUM",
      dueDate: toDateInput(task?.dueDate),
    },
  });

  useActionToast(state, onSuccess);

  return (
    <Modal open={open} onClose={onClose} title={task ? "Edit task" : "Add task"}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="projectId" value={projectId} />
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title ? <p className="mt-1 text-xs text-danger">{errors.title.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} />
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
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save task"}</Button>
        </div>
      </form>
    </Modal>
  );
}

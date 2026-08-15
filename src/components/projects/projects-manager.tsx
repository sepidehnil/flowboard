"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import {
  createProjectAction,
  deleteProjectAction,
  updateProjectAction,
} from "@/actions/projects";
import type { ActionResult } from "@/actions/auth";
import { projectSchema, type ProjectInput } from "@/lib/validations";
import { formatDate, formatPercent } from "@/lib/utils";
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

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  progress: number;
  deadline: Date | string | null;
  createdAt: Date | string;
  client: { id: string; name: string; company: string | null } | null;
};

type ClientOption = { id: string; name: string; company: string | null };

const initial: ActionResult = {};

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

export function ProjectsManager({
  projects,
  clients,
}: {
  projects: ProjectRow[];
  clients: ClientOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState<ProjectRow | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  const filtered = useMemo(() => {
    let rows = [...projects];
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.client?.name.toLowerCase().includes(q) ||
          p.client?.company?.toLowerCase().includes(q),
      );
    }
    if (status !== "ALL") {
      rows = rows.filter((p) => p.status === status);
    }
    rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "progress") return b.progress - a.progress;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    return rows;
  }, [projects, query, status, sort]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(project: ProjectRow) {
    setEditing(project);
    setOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Manage deliverables, deadlines, and progress.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
          <Input
            className="pl-9"
            placeholder="Search projects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          className="sm:w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="ON_HOLD">On hold</option>
        </Select>
        <Select
          className="sm:w-40"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="name">Name</option>
          <option value="progress">Progress</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to get started."
          actionLabel="Create Project"
          onAction={openCreate}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted/50 text-xs uppercase tracking-wide text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-border last:border-0 hover:bg-surface-muted/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="font-medium text-foreground hover:text-brand"
                      >
                        {project.name}
                      </Link>
                      {project.description ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-foreground-muted">
                          {project.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {project.client?.company ?? project.client?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={project.status} kind="project" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-muted">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-foreground-muted">
                          {formatPercent(project.progress)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {formatDate(project.deadline)}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(project)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleting(project)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-1 text-xs text-foreground-muted">
                      {project.client?.company ?? project.client?.name ?? "No client"}
                    </p>
                  </div>
                  <StatusBadge status={project.status} kind="project" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground-muted">
                    {formatPercent(project.progress)}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(project)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(project)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ProjectFormModal
        open={open}
        onClose={() => setOpen(false)}
        clients={clients}
        project={editing}
        onSuccess={() => {
          setOpen(false);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete project?"
        description={`This will permanently delete "${deleting?.name}". Tasks will be unlinked.`}
        loading={pendingDelete}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          startDelete(async () => {
            const result = await deleteProjectAction(deleting.id);
            if (result.error) toast.error(result.error);
            else {
              toast.success(result.success ?? "Deleted");
              setDeleting(null);
              router.refresh();
            }
          });
        }}
      />
    </div>
  );
}

function ProjectFormModal({
  open,
  onClose,
  clients,
  project,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  clients: ClientOption[];
  project: ProjectRow | null;
  onSuccess: () => void;
}) {
  const action = project
    ? updateProjectAction.bind(null, project.id)
    : createProjectAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const {
    register,
    reset,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    values: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      clientId: project?.client?.id ?? "",
      status: project?.status ?? "PLANNED",
      progress: project?.progress ?? 0,
      deadline: toDateInput(project?.deadline),
    },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useActionToast(state, onSuccess);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? "Edit project" : "Create project"}
      description="Projects are scoped to your account only."
    >
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? (
            <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
          ) : null}
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
            <Label htmlFor="progress">Progress (%)</Label>
            <Input
              id="progress"
              type="number"
              min={0}
              max={100}
              {...register("progress", { valueAsNumber: true })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" type="date" {...register("deadline")} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : project ? "Save changes" : "Create project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

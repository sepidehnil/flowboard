"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import {
  createClientAction,
  deleteClientAction,
  updateClientAction,
} from "@/actions/clients";
import type { ActionResult } from "@/actions/auth";
import { clientSchema, type ClientInput } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";
import { useActionToast } from "@/hooks/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";

type ClientRow = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  _count: { projects: number };
  invoices: { amount: number; status: string }[];
};

const initial: ActionResult = {};

function clientRevenue(client: ClientRow) {
  return client.invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);
}

export function ClientsManager({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [deleting, setDeleting] = useState<ClientRow | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q),
    );
  }, [clients, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Clients</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            People and companies you bill and deliver for.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
        <Input
          className="pl-9"
          placeholder="Search clients..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Add a client to attach projects and invoices."
          actionLabel="Create Client"
          onAction={() => {
            setEditing(null);
            setOpen(true);
          }}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="rounded-xl border border-border bg-surface p-5 transition hover:border-brand/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{client.company ?? client.name}</h3>
                  <p className="mt-0.5 text-sm text-foreground-muted">{client.name}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                  {(client.company ?? client.name).charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-foreground-muted">
                <p>{client.email}</p>
                <p>{client.phone || "No phone"}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
                <span className="text-foreground-muted">
                  {client._count.projects} projects
                </span>
                <span className="font-semibold">
                  {formatCurrency(clientRevenue(client))}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(client);
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(client)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientFormModal
        open={open}
        onClose={() => setOpen(false)}
        client={editing}
        onSuccess={() => {
          setOpen(false);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete client?"
        description={`Delete "${deleting?.company ?? deleting?.name}"? Linked projects and invoices will keep their records but lose the client link.`}
        loading={pendingDelete}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          startDelete(async () => {
            const result = await deleteClientAction(deleting.id);
            if (result.error) toast.error(result.error);
            else {
              toast.success("Client deleted");
              setDeleting(null);
              router.refresh();
            }
          });
        }}
      />
    </div>
  );
}

function ClientFormModal({
  open,
  onClose,
  client,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  client: ClientRow | null;
  onSuccess: () => void;
}) {
  const action = client
    ? updateClientAction.bind(null, client.id)
    : createClientAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const { register, formState: { errors } } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    values: {
      name: client?.name ?? "",
      email: client?.email ?? "",
      company: client?.company ?? "",
      phone: client?.phone ?? "",
    },
  });

  useActionToast(state, onSuccess);

  return (
    <Modal open={open} onClose={onClose} title={client ? "Edit client" : "Create client"}>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">Contact name</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? <p className="mt-1 text-xs text-danger">{errors.name.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email ? <p className="mt-1 text-xs text-danger">{errors.email.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" {...register("company")} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : client ? "Save changes" : "Create client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

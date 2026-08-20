"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import {
  createInvoiceAction,
  deleteInvoiceAction,
  updateInvoiceAction,
} from "@/actions/invoices";
import type { ActionResult } from "@/actions/auth";
import { invoiceSchema, type InvoiceInput } from "@/lib/validations";
import { formatCurrency, formatDate } from "@/lib/utils";
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

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  issueDate: Date | string;
  dueDate: Date | string;
  notes: string | null;
  client: { id: string; name: string; company: string | null } | null;
};

type ClientOption = { id: string; name: string; company: string | null };

const initial: ActionResult = {};

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

export function InvoicesManager({
  invoices,
  clients,
}: {
  invoices: InvoiceRow[];
  clients: ClientOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InvoiceRow | null>(null);
  const [deleting, setDeleting] = useState<InvoiceRow | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  const filtered = useMemo(() => {
    return invoices.filter((invoice) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        invoice.invoiceNumber.toLowerCase().includes(q) ||
        invoice.client?.name.toLowerCase().includes(q) ||
        invoice.client?.company?.toLowerCase().includes(q);
      const matchesStatus = status === "ALL" || invoice.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, query, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Invoices</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Revenue tracking powers your dashboard metrics.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New invoice
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
          <Input
            className="pl-9"
            placeholder="Search invoices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44">
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create an invoice to start tracking revenue."
          actionLabel="Create Invoice"
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
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Issued</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {invoice.client?.company ?? invoice.client?.name ?? " - "}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(Number(invoice.amount))}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={invoice.status} kind="invoice" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(invoice);
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(invoice)}>
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
            {filtered.map((invoice) => (
              <div key={invoice.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-foreground-muted">
                      {invoice.client?.company ?? invoice.client?.name ?? "No client"}
                    </p>
                  </div>
                  <StatusBadge status={invoice.status} kind="invoice" />
                </div>
                <p className="text-lg font-semibold">
                  {formatCurrency(Number(invoice.amount))}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(invoice);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(invoice)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <InvoiceFormModal
        open={open}
        onClose={() => setOpen(false)}
        invoice={editing}
        clients={clients}
        onSuccess={() => {
          setOpen(false);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete invoice?"
        description={`Delete ${deleting?.invoiceNumber}? This affects dashboard revenue.`}
        loading={pendingDelete}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          startDelete(async () => {
            const result = await deleteInvoiceAction(deleting.id);
            if (result.error) toast.error(result.error);
            else {
              toast.success("Invoice deleted");
              setDeleting(null);
              router.refresh();
            }
          });
        }}
      />
    </div>
  );
}

function InvoiceFormModal({
  open,
  onClose,
  invoice,
  clients,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceRow | null;
  clients: ClientOption[];
  onSuccess: () => void;
}) {
  const action = invoice
    ? updateInvoiceAction.bind(null, invoice.id)
    : createInvoiceAction;
  const [state, formAction, pending] = useActionState(action, initial);

  // Stabilize form values - Date.now()/new Date() in `values` re-runs every render
  // and causes "Maximum update depth exceeded" with react-hook-form.
  const formValues = useMemo<InvoiceInput>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const nextNumber = `INV-${String(Date.now()).slice(-6)}`;
    return {
      invoiceNumber: invoice?.invoiceNumber ?? nextNumber,
      clientId: invoice?.client?.id ?? "",
      amount: invoice ? Number(invoice.amount) : 1000,
      status: invoice?.status ?? "DRAFT",
      issueDate: toDateInput(invoice?.issueDate) || today,
      dueDate: toDateInput(invoice?.dueDate) || today,
      notes: invoice?.notes ?? "",
    };
  }, [open, invoice]);

  const { register, formState: { errors } } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    values: formValues,
  });

  useActionToast(state, onSuccess);

  return (
    <Modal open={open} onClose={onClose} title={invoice ? "Edit invoice" : "Create invoice"}>
      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="invoiceNumber">Invoice number</Label>
            <Input id="invoiceNumber" {...register("invoiceNumber")} />
            {errors.invoiceNumber ? (
              <p className="mt-1 text-xs text-danger">{errors.invoiceNumber.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" min="0" {...register("amount", { valueAsNumber: true })} />
            {errors.amount ? (
              <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>
            ) : null}
          </div>
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
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register("status")}>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="issueDate">Issue date</Label>
            <Input id="issueDate" type="date" {...register("issueDate")} />
          </div>
          <div>
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register("notes")} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : invoice ? "Save changes" : "Create invoice"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

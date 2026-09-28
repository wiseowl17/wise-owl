import { Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InvoiceDocument } from "@/components/invoice-document";
import { PaymentSheet } from "@/components/studio/forms";
import {
  AreaField,
  Badge,
  ConfirmButton,
  controlClass,
  Empty,
  FormActions,
  LoadState,
  PageHeader,
  Panel,
  SelectField,
  Sheet,
  Stat,
  TextField,
  useStudioData,
} from "@/components/studio/ui";
import { ClientLink, addDays } from "@/components/studio/views/tasks";
import { studio } from "@/lib/studio-api";
import { centsToInput, formatDate, formatMoney, todayIso } from "@/lib/money";
import {
  INVOICE_STATE_LABELS,
  label,
  paymentKindLabel,
  type ClientListRow,
  type Invoice,
  type InvoiceDetail,
  type InvoiceItem,
  type Payment,
  type Project,
  type PublicInvoice,
} from "@/lib/studio-types";
import { cn } from "@/lib/utils";

const th = "px-4 py-2.5 font-medium";
const td = "px-4 py-3";

export function InvoiceBadge({ state }: { state: Invoice["state"] }) {
  const tone = { draft: "lead", sent: "active", partial: "pending", overdue: "high", paid: "paid", void: "cancelled" }[state];
  return <Badge tone={tone}>{INVOICE_STATE_LABELS[state]}</Badge>;
}

export function invoiceLink(invoice: Pick<Invoice, "public_token">) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/invoice?t=${encodeURIComponent(invoice.public_token)}`;
}

/* ----------------------------------------------------------------- list */

const FILTERS = [
  { value: "open", label: "Open (sent, partly paid, overdue)" },
  { value: "draft", label: "Drafts" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "all", label: "All invoices" },
];

export function InvoicesView() {
  const { value: invoices, error, reload } = useStudioData<Invoice[]>("listInvoices");
  const [filter, setFilter] = useState("open");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const rows = useMemo(
    () =>
      (invoices ?? []).filter((i) => {
        if (filter === "all") return true;
        if (filter === "open") return ["sent", "partial", "overdue"].includes(i.state);
        return i.state === filter;
      }),
    [invoices, filter],
  );
  const open = (invoices ?? []).filter((i) => ["sent", "partial", "overdue"].includes(i.state));
  const outstanding = open.reduce((s, i) => s + i.balance_cents, 0);
  const overdue = open.filter((i) => i.state === "overdue");
  const drafts = (invoices ?? []).filter((i) => i.state === "draft");

  // Land on drafts when there is nothing open but care invoices are waiting.
  useEffect(() => {
    if (invoices && open.length === 0 && drafts.length > 0) setFilter("draft");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Send a link, take card payments through Stripe, or record Zelle, cash and checks yourself."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Invoice
          </Button>
        }
      />

      {!invoices ? (
        <LoadState error={error} />
      ) : (
        <>
          <Panel className="grid grid-cols-3 gap-px overflow-hidden bg-line [&>*]:bg-surface">
            <Stat label="Outstanding" value={formatMoney(outstanding)} hint={`${open.length} open`} />
            <Stat
              label="Overdue"
              value={formatMoney(overdue.reduce((s, i) => s + i.balance_cents, 0))}
              hint={`${overdue.length} invoice${overdue.length === 1 ? "" : "s"}`}
            />
            <Stat label="Drafts to send" value={String(drafts.length)} hint="Includes monthly care" />
          </Panel>

          <div>
            <label className="sr-only" htmlFor="invoice-filter">Show</label>
            <select
              id="invoice-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={cn(controlClass, "sm:w-72")}
            >
              {FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {rows.length === 0 ? (
            <Panel>
              <Empty
                action={
                  <Button size="sm" onClick={() => setCreating(true)}>
                    Create an invoice
                  </Button>
                }
              >
                {invoices.length
                  ? "Nothing in this list."
                  : "No invoices yet. Create one here, from a project on a client’s page, or start a care plan and it will draft itself each month."}
              </Empty>
            </Panel>
          ) : (
            <Panel className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="border-b border-line bg-bg/60 text-left text-xs text-muted">
                  <tr>
                    <th className={th}>Invoice</th>
                    <th className={th}>Client</th>
                    <th className={th}>Due</th>
                    <th className={th}>Status</th>
                    <th className={cn(th, "text-right")}>Total</th>
                    <th className={cn(th, "text-right")}>Left to pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((i) => (
                    <tr key={i.id} className="transition-colors hover:bg-bg">
                      <td className={td}>
                        <Link
                          to="/studio"
                          search={{ view: "invoices", id: i.id }}
                          className="font-medium tabular-nums hover:text-accent"
                        >
                          {i.number}
                        </Link>
                        <p className="text-xs text-muted">
                          {i.care_plan_id ? "Monthly care" : i.project_name ?? "Issued"} · {formatDate(i.issued_on, false)}
                        </p>
                      </td>
                      <td className={td}>
                        <ClientLink id={i.client_id}>{i.client_company || i.client_name}</ClientLink>
                      </td>
                      <td className={cn(td, "whitespace-nowrap", i.state === "overdue" ? "text-[#9b1c1c]" : "text-muted")}>
                        {i.due_on ? formatDate(i.due_on) : "On receipt"}
                      </td>
                      <td className={td}>
                        <InvoiceBadge state={i.state} />
                      </td>
                      <td className={cn(td, "text-right tabular-nums")}>{formatMoney(i.total_cents)}</td>
                      <td className={cn(td, "text-right font-medium tabular-nums", i.balance_cents === 0 && "text-subtle")}>
                        {i.state === "void" ? "None" : formatMoney(i.balance_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </>
      )}

      <InvoiceSheet
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(newId) => {
          reload();
          if (newId) void navigate({ to: "/studio", search: { view: "invoices", id: newId } });
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- detail */

export function InvoiceDetailView({ id }: { id: number }) {
  const { value: data, error, reload } = useStudioData<InvoiceDetail>("getInvoice", { id });
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const back = (
    <Link to="/studio" search={{ view: "invoices" }} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Invoices
    </Link>
  );

  if (!data) {
    return (
      <div className="space-y-6">
        {back}
        <LoadState error={error} rows={6} />
      </div>
    );
  }

  const { invoice, items, payments } = data;
  const link = invoiceLink(invoice);
  const preview: PublicInvoice = {
    invoice,
    items,
    payments: payments.filter((p) => p.status === "paid"),
    cardPayments: false,
    preview: false,
  };
  const kind = invoice.care_plan_id ? "care" : invoice.project_id ? "project" : "other";

  async function setStatus(status: "draft" | "sent" | "void", message: string) {
    setBusy(true);
    try {
      await studio("setInvoiceStatus", { id: invoice.id, status });
      toast.success(message);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(andSend = false) {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invoice link copied. Paste it in a text or email.");
    } catch {
      toast.error("Could not copy. Select the link below instead.");
    }
    if (andSend && invoice.status === "draft") await setStatus("sent", "Marked as sent.");
  }

  return (
    <div className="space-y-6">
      {back}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight tabular-nums">Invoice {invoice.number}</h1>
            <InvoiceBadge state={invoice.state} />
          </div>
          <p className="mt-1 text-sm text-muted">
            <ClientLink id={invoice.client_id}>{invoice.client_company || invoice.client_name}</ClientLink>
            {invoice.project_name ? ` · ${invoice.project_name}` : ""}
            {invoice.care_plan_id ? " · Monthly care" : ""}
            {invoice.sent_at ? ` · sent ${formatDate(invoice.sent_at)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.state !== "void" && invoice.state !== "paid" ? (
            <Button size="sm" onClick={() => setPaying(true)}>
              Record payment
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={invoice.state === "void"}>
            Edit
          </Button>
        </div>
      </div>

      {invoice.status === "draft" ? (
        <Panel className="border-accent/40 bg-accent/5">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              This is a draft. The client’s link only works once it’s sent.
            </p>
            <Button size="sm" disabled={busy} onClick={() => void copyLink(true)}>
              <Copy className="size-4" /> Mark sent &amp; copy link
            </Button>
          </div>
        </Panel>
      ) : invoice.status === "sent" ? (
        <Panel title="Client link">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
            <input
              readOnly
              value={link}
              aria-label="Invoice link"
              onFocus={(e) => e.currentTarget.select()}
              className={cn(controlClass, "font-mono text-xs")}
            />
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => void copyLink()}>
                <Copy className="size-4" /> Copy
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={link} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" /> Open
                </a>
              </Button>
            </div>
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="overflow-hidden rounded-[14px] border border-line">
          <InvoiceDocument data={preview} />
        </div>

        <div className="space-y-6">
          <Panel title="Payments">
            {payments.length === 0 ? (
              <Empty>Nothing paid yet. Card payments through the link record themselves.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {payments.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setEditPayment(p)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-bg"
                    >
                      <div>
                        <p className="text-sm font-medium">{paymentKindLabel(p.kind)}</p>
                        <p className="text-xs text-muted">
                          {formatDate(p.paid_on)} · {label(p.method)}
                          {p.status === "pending" ? " · pending" : ""}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{formatMoney(p.amount_cents)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="More">
            <div className="flex flex-col items-start gap-1 px-2 py-2">
              {invoice.status !== "draft" ? (
                <a href={link} target="_blank" rel="noreferrer" className="w-full rounded-[8px] px-2 py-2 text-sm text-muted hover:bg-raised hover:text-fg">
                  Open client page (Save as PDF there)
                </a>
              ) : (
                <a href={link} target="_blank" rel="noreferrer" className="w-full rounded-[8px] px-2 py-2 text-sm text-muted hover:bg-raised hover:text-fg">
                  Preview client page
                </a>
              )}
              {invoice.status === "sent" && invoice.paid_cents === 0 ? (
                <button type="button" disabled={busy} onClick={() => void setStatus("draft", "Back to draft.")} className="w-full rounded-[8px] px-2 py-2 text-left text-sm text-muted hover:bg-raised hover:text-fg">
                  Move back to draft
                </button>
              ) : null}
              {invoice.status === "void" ? (
                <button type="button" disabled={busy} onClick={() => void setStatus("sent", "Invoice restored.")} className="w-full rounded-[8px] px-2 py-2 text-left text-sm text-muted hover:bg-raised hover:text-fg">
                  Restore invoice
                </button>
              ) : invoice.state !== "paid" ? (
                <ConfirmButton size="sm" onConfirm={() => setStatus("void", "Invoice voided.")}>
                  Void invoice
                </ConfirmButton>
              ) : null}
              <ConfirmButton
                size="sm"
                onConfirm={async () => {
                  await studio("deleteInvoice", { id: invoice.id });
                  toast.success("Invoice deleted.");
                  await navigate({ to: "/studio", search: { view: "invoices" } });
                }}
              >
                Delete invoice
              </ConfirmButton>
            </div>
          </Panel>
        </div>
      </div>

      <InvoiceSheet open={editing} detail={data} onClose={() => setEditing(false)} onSaved={() => reload()} />
      <PaymentSheet
        open={paying}
        invoice={{ id: invoice.id, number: invoice.number, balance_cents: invoice.balance_cents, kind }}
        onClose={() => setPaying(false)}
        onSaved={reload}
      />
      <PaymentSheet
        open={Boolean(editPayment)}
        record={editPayment}
        invoice={editPayment ? { id: invoice.id, number: invoice.number, balance_cents: invoice.balance_cents, kind } : null}
        onClose={() => setEditPayment(null)}
        onSaved={reload}
      />
    </div>
  );
}

/* --------------------------------------------------------------- editor */

type Line = { key: number; description: string; details: string; quantity: string; unitPrice: string };

let lineKey = 0;
function toLine(item?: InvoiceItem): Line {
  lineKey += 1;
  return {
    key: lineKey,
    description: item?.description ?? "",
    details: item?.details ?? "",
    quantity: item ? String(Number(item.quantity)) : "1",
    unitPrice: item ? centsToInput(item.unit_cents) : "",
  };
}

export function InvoiceSheet({
  open,
  onClose,
  onSaved,
  detail,
  clientId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (newId?: number) => void;
  detail?: InvoiceDetail | null;
  clientId?: number;
}) {
  const invoice = detail?.invoice;
  const [lines, setLines] = useState<Line[]>([toLine()]);
  const [clients, setClients] = useState<ClientListRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLines(detail?.items.length ? detail.items.map((item) => toLine(item)) : [toLine()]);
    setSelectedClient(String(invoice?.client_id ?? clientId ?? ""));
    void Promise.all([studio<ClientListRow[]>("listClients"), studio<Project[]>("listProjects")]).then(
      ([c, p]) => {
        setClients(c);
        setProjects(p);
      },
      () => undefined,
    );
  }, [open, detail, invoice?.client_id, clientId]);

  const total = lines.reduce((s, l) => s + Math.round((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * 100), 0);

  function update(key: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      const result = await studio<{ id: number }>("saveInvoice", {
        id: invoice?.id,
        clientId: form.get("clientId"),
        projectId: form.get("projectId"),
        issuedOn: form.get("issuedOn"),
        dueOn: form.get("dueOn"),
        notes: form.get("notes"),
        items: lines.map((l) => ({
          description: l.description,
          details: l.details,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      toast.success(invoice ? "Invoice saved." : `Invoice created as a draft.`);
      onClose();
      onSaved(invoice ? undefined : result.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  const issuedDefault = invoice?.issued_on ?? todayIso();

  return (
    <Sheet open={open} title={invoice ? `Edit ${invoice.number}` : "New invoice"} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Client"
            name="clientId"
            required
            placeholder="Choose a client"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            options={clients.map((c) => ({ value: String(c.id), label: c.company ? `${c.company} (${c.name})` : c.name }))}
            className="sm:col-span-2"
          />
          <SelectField
            key={`p-${selectedClient}-${projects.length}`}
            label="Project"
            name="projectId"
            placeholder="Not tied to a project"
            defaultValue={invoice?.project_id ?? ""}
            options={projects
              .filter((p) => String(p.client_id) === selectedClient)
              .map((p) => ({ value: String(p.id), label: p.name }))}
            className="sm:col-span-2"
          />
          <TextField label="Issued" name="issuedOn" type="date" required defaultValue={issuedDefault} />
          <TextField
            label="Due"
            name="dueOn"
            type="date"
            defaultValue={invoice ? invoice.due_on : addDays(issuedDefault, 14)}
            hint="Leave empty for “upon receipt”."
          />
        </div>

        <fieldset className="mt-6">
          <legend className="text-xs font-medium text-muted">Line items</legend>
          <div className="mt-2 space-y-3">
            {lines.map((line, index) => (
              <div key={line.key} className="rounded-[12px] border border-line bg-surface p-3">
                <div className="flex items-start gap-2">
                  <div className="grid flex-1 gap-2">
                    <label className="sr-only" htmlFor={`d-${line.key}`}>Item {index + 1} description</label>
                    <input
                      id={`d-${line.key}`}
                      value={line.description}
                      onChange={(e) => update(line.key, { description: e.target.value })}
                      placeholder="What it’s for, e.g. Stripe integration"
                      required={index === 0}
                      className={controlClass}
                    />
                    <label className="sr-only" htmlFor={`x-${line.key}`}>Item {index + 1} details</label>
                    <textarea
                      id={`x-${line.key}`}
                      value={line.details}
                      onChange={(e) => update(line.key, { details: e.target.value })}
                      placeholder="Details (optional)"
                      rows={2}
                      className={cn(controlClass, "h-auto py-2 leading-relaxed")}
                    />
                    <div className="grid grid-cols-[5rem_1fr_auto] items-center gap-2">
                      <label className="sr-only" htmlFor={`q-${line.key}`}>Quantity</label>
                      <input
                        id={`q-${line.key}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(e) => update(line.key, { quantity: e.target.value })}
                        className={cn(controlClass, "tabular-nums")}
                        title="Quantity"
                      />
                      <label className="sr-only" htmlFor={`u-${line.key}`}>Price in dollars</label>
                      <input
                        id={`u-${line.key}`}
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={line.unitPrice}
                        onChange={(e) => update(line.key, { unitPrice: e.target.value })}
                        placeholder="Price ($)"
                        className={cn(controlClass, "tabular-nums")}
                      />
                      <span className="w-24 text-right text-sm font-semibold tabular-nums">
                        {formatMoney(Math.round((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0) * 100))}
                      </span>
                    </div>
                  </div>
                  {lines.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setLines((ls) => ls.filter((l) => l.key !== line.key))}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-[8px] text-muted hover:bg-raised hover:text-fg"
                      aria-label={`Remove item ${index + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Button type="button" size="sm" variant="ghost" onClick={() => setLines((ls) => [...ls, toLine()])}>
              <Plus className="size-4" /> Add a line
            </Button>
            <p className="text-sm">
              Total <span className="ml-2 text-base font-semibold tabular-nums">{formatMoney(total)}</span>
            </p>
          </div>
          <p className="mt-1 text-xs text-subtle">A negative price works as a discount line.</p>
        </fieldset>

        <AreaField
          label="Note to the client (optional)"
          name="notes"
          rows={2}
          defaultValue={invoice?.notes}
          className="mt-4"
        />

        <FormActions pending={pending} label={invoice ? "Save invoice" : "Create draft"} />
      </form>
    </Sheet>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Mail, Phone, Plus, Globe, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CarePlanSheet,
  ClientSheet,
  PaymentSheet,
  ProjectSheet,
  TaskSheet,
} from "@/components/studio/forms";
import { TaskRow } from "@/components/studio/views/tasks";
import { InvoiceBadge, InvoiceSheet } from "@/components/studio/views/invoices";
import {
  Badge,
  ConfirmButton,
  controlClass,
  Empty,
  LoadState,
  PageHeader,
  Panel,
  Stat,
  useStudioData,
} from "@/components/studio/ui";
import { studio } from "@/lib/studio-api";
import { formatDate, formatDay, formatMoney, todayIso } from "@/lib/money";
import {
  CLIENT_STATUSES,
  label,
  paymentKindLabel,
  type CarePlan,
  type ClientDetail,
  type ClientListRow,
  type Payment,
  type Project,
  type Task,
} from "@/lib/studio-types";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------- list */

export function ClientsView() {
  const { value: clients, error, reload } = useStudioData<ClientListRow[]>("listClients");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("current");
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (clients ?? []).filter((c) => {
      if (status === "current" && ["completed", "archived"].includes(c.status)) return false;
      if (status !== "current" && status !== "all" && c.status !== status) return false;
      if (!needle) return true;
      return [c.name, c.company, c.email, c.phone, c.website]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [clients, query, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Everyone you’ve worked with or are talking to."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Client
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="client-search">Search clients</label>
        <input
          id="client-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, business, email, phone"
          className={cn(controlClass, "sm:max-w-sm")}
        />
        <label className="sr-only" htmlFor="client-status">Filter by status</label>
        <select
          id="client-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={cn(controlClass, "sm:w-48")}
        >
          <option value="current">Current clients</option>
          <option value="all">Everyone</option>
          {CLIENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>

      {!clients ? (
        <LoadState error={error} />
      ) : clients.length === 0 ? (
        <Panel>
          <Empty
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                Add your first client
              </Button>
            }
          >
            Clients also appear here on their own when someone fills out the onboarding brief or signs the rates page.
          </Empty>
        </Panel>
      ) : rows.length === 0 ? (
        <Panel>
          <Empty>No clients match that search.</Empty>
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-bg/60 text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="hidden px-4 py-2.5 text-right font-medium md:table-cell">Projects</th>
                <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Paid</th>
                <th className="hidden px-4 py-2.5 text-right font-medium lg:table-cell">Care / mo</th>
                <th className="hidden px-4 py-2.5 text-right font-medium md:table-cell">Open tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr key={c.id} className="group relative transition-colors hover:bg-bg">
                  <td className="px-4 py-3">
                    <Link
                      to="/studio"
                      search={{ view: "clients", id: c.id }}
                      className="font-medium after:absolute after:inset-0 group-hover:text-accent"
                    >
                      {c.company || c.name}
                    </Link>
                    <p className="text-xs text-muted">{c.company ? c.name : c.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={c.status}>{label(c.status)}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums md:table-cell">{c.project_count}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{formatMoney(c.paid_cents)}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums lg:table-cell">
                    {c.mrr_cents ? formatMoney(c.mrr_cents) : <span className="text-subtle">None</span>}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums md:table-cell">{c.open_tasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <ClientSheet open={creating} onClose={() => setCreating(false)} onSaved={reload} />
    </div>
  );
}

/* --------------------------------------------------------------- detail */

type SheetState =
  | { kind: "client" }
  | { kind: "project"; record?: Project }
  | { kind: "payment"; record?: Payment; projectId?: number }
  | { kind: "task"; record?: Task; projectId?: number }
  | { kind: "care"; record?: CarePlan }
  | { kind: "invoice" }
  | null;

export function ClientDetailView({ id }: { id: number }) {
  const { value: data, error, reload } = useStudioData<ClientDetail>("getClient", { id });
  const [sheet, setSheet] = useState<SheetState>(null);
  const navigate = useNavigate();
  const close = () => setSheet(null);

  if (!data) {
    return (
      <div className="space-y-6">
        <BackLink />
        <LoadState error={error} rows={6} />
      </div>
    );
  }

  const { client, projects, payments, tasks, notes, carePlans, onboardings, agreements, invoices } = data;
  const paid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount_cents, 0);
  const pending = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount_cents, 0);
  const owed = projects
    .filter((p) => p.status !== "cancelled")
    .reduce((sum, p) => sum + p.balance_cents, 0);
  const today = todayIso();
  const liveCare = carePlans.filter((c) => !c.ended_on || c.ended_on > today);
  const mrr = liveCare.reduce((sum, c) => sum + c.amount_cents, 0);

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{client.company || client.name}</h1>
            <Badge tone={client.status}>{label(client.status)}</Badge>
          </div>
          {client.company ? <p className="mt-1 text-sm text-muted">{client.name}</p> : null}
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {client.email ? (
              <li>
                <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 text-muted hover:text-accent">
                  <Mail className="size-4" strokeWidth={1.75} /> {client.email}
                </a>
              </li>
            ) : null}
            {client.phone ? (
              <li>
                <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 text-muted hover:text-accent">
                  <Phone className="size-4" strokeWidth={1.75} /> {client.phone}
                </a>
              </li>
            ) : null}
            {client.website ? (
              <li>
                <a
                  href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted hover:text-accent"
                >
                  <Globe className="size-4" strokeWidth={1.75} /> {client.website.replace(/^https?:\/\//, "")}
                </a>
              </li>
            ) : null}
            {client.address ? (
              <li className="inline-flex items-center gap-1.5 text-muted">
                <MapPin className="size-4" strokeWidth={1.75} /> {client.address}
              </li>
            ) : null}
          </ul>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setSheet({ kind: "client" })}>
            Edit client
          </Button>
          <Button size="sm" onClick={() => setSheet({ kind: "payment" })}>
            <Plus className="size-4" /> Payment
          </Button>
        </div>
      </div>

      <Panel className="grid grid-cols-2 gap-px overflow-hidden bg-line sm:grid-cols-4 [&>*]:bg-surface">
        <Stat label="Paid to date" value={formatMoney(paid)} />
        <Stat label="Owed on projects" value={formatMoney(owed)} />
        <Stat label="Pending" value={formatMoney(pending)} />
        <Stat label="Care plan / mo" value={mrr ? formatMoney(mrr) : "None"} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel
            title="Projects"
            action={
              <Button size="sm" variant="ghost" onClick={() => setSheet({ kind: "project" })}>
                <Plus className="size-4" /> Project
              </Button>
            }
          >
            {projects.length === 0 ? (
              <Empty>Add the project with its price and full scope. Payments tied to it count toward what’s owed.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {projects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    onEdit={() => setSheet({ kind: "project", record: project })}
                    onPay={() => setSheet({ kind: "payment", projectId: project.id })}
                    onInvoice={async () => {
                      try {
                        const { id: invoiceId } = await studio<{ id: number }>("invoiceFromProject", { projectId: project.id });
                        toast.success("Draft invoice created from the project.");
                        await navigate({ to: "/studio", search: { view: "invoices", id: invoiceId } });
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Could not create the invoice.");
                      }
                    }}
                  />
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Payments"
            action={
              <Button size="sm" variant="ghost" onClick={() => setSheet({ kind: "payment" })}>
                <Plus className="size-4" /> Payment
              </Button>
            }
          >
            {payments.length === 0 ? (
              <Empty>No payments yet. Onboarding is paid first: $100 with their own domain, $250 if you find one.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {payments.map((payment) => (
                  <li key={payment.id}>
                    <button
                      type="button"
                      onClick={() => setSheet({ kind: "payment", record: payment })}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-bg"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {paymentKindLabel(payment.kind)}
                          {payment.project_name ? <span className="font-normal text-muted"> · {payment.project_name}</span> : null}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {formatDate(payment.paid_on)} · {label(payment.method)}
                          {payment.notes ? ` · ${payment.notes}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {payment.status === "pending" ? <Badge tone="pending">Pending</Badge> : null}
                        <span className="text-sm font-semibold tabular-nums">{formatMoney(payment.amount_cents)}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Invoices"
            action={
              <Button size="sm" variant="ghost" onClick={() => setSheet({ kind: "invoice" })}>
                <Plus className="size-4" /> Invoice
              </Button>
            }
          >
            {invoices.length === 0 ? (
              <Empty>No invoices yet. Create one here or from a project above.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {invoices.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      to="/studio"
                      search={{ view: "invoices", id: inv.id }}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-bg"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium tabular-nums">{inv.number}</p>
                        <p className="truncate text-xs text-muted">
                          {inv.care_plan_id ? "Monthly care" : inv.project_name ?? "Invoice"} · {formatDate(inv.issued_on)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <InvoiceBadge state={inv.state} />
                        <span className="text-sm font-semibold tabular-nums">{formatMoney(inv.total_cents)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <NotesPanel clientId={client.id} notes={notes} onChanged={reload} />
        </div>

        <div className="space-y-6">
          <Panel
            title="Tasks"
            action={
              <Button size="sm" variant="ghost" onClick={() => setSheet({ kind: "task" })}>
                <Plus className="size-4" /> Task
              </Button>
            }
          >
            {tasks.length === 0 ? (
              <Empty>Add to-dos for this client, or monthly care jobs that repeat.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {tasks.map((task) => (
                  <TaskRow
                    key={`${task.id}-${task.done}`}
                    task={task}
                    today={today}
                    onChanged={reload}
                    onEdit={(t) => setSheet({ kind: "task", record: t })}
                  />
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Care plan"
            action={
              <Button size="sm" variant="ghost" onClick={() => setSheet({ kind: "care" })}>
                <Plus className="size-4" /> Plan
              </Button>
            }
          >
            {carePlans.length === 0 ? (
              <Empty>No monthly care. Basic starts at $100, backend at $250.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {carePlans.map((plan) => {
                  const live = !plan.ended_on || plan.ended_on > today;
                  return (
                    <li key={plan.id}>
                      <button
                        type="button"
                        onClick={() => setSheet({ kind: "care", record: plan })}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-bg"
                      >
                        <div>
                          <p className="text-sm font-medium">{label(plan.plan)}</p>
                          <p className="text-xs text-muted">
                            {live
                              ? `Bills on the ${formatDay(plan.billing_day)} · since ${formatDate(plan.started_on)}`
                              : `Ended ${formatDate(plan.ended_on)}`}
                          </p>
                        </div>
                        <span className={cn("text-sm font-semibold tabular-nums", !live && "text-subtle")}>
                          {formatMoney(plan.amount_cents)}/mo
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {onboardings.length > 0 ? (
            <Panel title="Onboarding brief">
              {onboardings.map((brief) => (
                <dl key={brief.id} className="space-y-3 px-4 py-4 text-sm">
                  <BriefLine term="Submitted" value={formatDate(brief.created_at)} />
                  <BriefLine term="Project" value={brief.project_type} />
                  <BriefLine term="Goals" value={brief.goals} />
                  <BriefLine term="Audience" value={brief.audience} />
                  <BriefLine term="Timeline" value={brief.timeline} />
                  <BriefLine term="Budget" value={brief.budget} />
                  <BriefLine term="Current site" value={brief.website} />
                  <BriefLine term="Anything else" value={brief.extra} />
                </dl>
              ))}
            </Panel>
          ) : null}

          {agreements.length > 0 ? (
            <Panel title="Signed agreements">
              <ul className="divide-y divide-line">
                {agreements.map((a) => (
                  <li key={a.id} className="px-4 py-3 text-sm">
                    <p className="font-medium">{a.project}</p>
                    <p className="text-xs text-muted">
                      Signed “{a.signature}” on {formatDate(a.signed_at)}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {client.notes || client.source ? (
            <Panel title="About">
              <div className="space-y-2 px-4 py-4 text-sm">
                {client.source ? <p className="text-muted">Found you through: {client.source}</p> : null}
                {client.notes ? <p className="whitespace-pre-wrap">{client.notes}</p> : null}
              </div>
            </Panel>
          ) : null}
        </div>
      </div>

      <ClientSheet open={sheet?.kind === "client"} record={client} onClose={close} onSaved={reload} />
      <ProjectSheet
        open={sheet?.kind === "project"}
        record={sheet?.kind === "project" ? sheet.record : null}
        clientId={client.id}
        onClose={close}
        onSaved={reload}
      />
      <PaymentSheet
        open={sheet?.kind === "payment"}
        record={sheet?.kind === "payment" ? sheet.record : null}
        projectId={sheet?.kind === "payment" ? sheet.projectId : undefined}
        clientId={client.id}
        onClose={close}
        onSaved={reload}
      />
      <TaskSheet
        open={sheet?.kind === "task"}
        record={sheet?.kind === "task" ? sheet.record : null}
        clientId={client.id}
        onClose={close}
        onSaved={reload}
      />
      <InvoiceSheet
        open={sheet?.kind === "invoice"}
        clientId={client.id}
        onClose={close}
        onSaved={(newId) => {
          reload();
          if (newId) void navigate({ to: "/studio", search: { view: "invoices", id: newId } });
        }}
      />
      <CarePlanSheet
        open={sheet?.kind === "care"}
        record={sheet?.kind === "care" ? sheet.record : null}
        clientId={client.id}
        onClose={close}
        onSaved={reload}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/studio"
      search={{ view: "clients" }}
      className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
    >
      <ArrowLeft className="size-4" /> Clients
    </Link>
  );
}

function BriefLine({ term, value }: { term: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{term}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function ProjectItem({
  project,
  onEdit,
  onPay,
  onInvoice,
}: {
  project: Project;
  onEdit: () => void;
  onPay: () => void;
  onInvoice: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pct = project.price_cents ? Math.min(100, Math.round((project.paid_cents / project.price_cents) * 100)) : 0;
  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 text-left" aria-expanded={open}>
          <p className="text-sm font-medium hover:text-accent">{project.name}</p>
          <p className="text-xs text-muted">
            {label(project.kind)}
            {project.due_on ? ` · due ${formatDate(project.due_on)}` : ""}
            {project.launched_on ? ` · launched ${formatDate(project.launched_on)}` : ""}
          </p>
        </button>
        <Badge tone={project.status}>{label(project.status)}</Badge>
      </div>
      {project.price_cents > 0 ? (
        <div className="mt-3">
          <div className="flex justify-between text-xs tabular-nums text-muted">
            <span>
              {formatMoney(project.paid_cents)} of {formatMoney(project.price_cents)} paid
            </span>
            {project.balance_cents > 0 ? <span>{formatMoney(project.balance_cents)} owed</span> : <span>Paid in full</span>}
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : null}
      {open ? (
        <div className="mt-3 space-y-3 rounded-[10px] bg-bg px-3 py-3 text-sm">
          {project.scope ? (
            <div>
              <p className="text-xs font-medium text-muted">Scope</p>
              <p className="mt-0.5 whitespace-pre-wrap">{project.scope}</p>
            </div>
          ) : (
            <p className="text-muted">No scope written yet.</p>
          )}
          {project.domain || project.site_url ? (
            <p className="text-muted">
              {project.domain ? `Domain: ${project.domain}` : ""}
              {project.domain && project.site_url ? " · " : ""}
              {project.site_url ? (
                <a href={project.site_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  Live site
                </a>
              ) : null}
            </p>
          ) : null}
          {project.links ? (
            <div>
              <p className="text-xs font-medium text-muted">Links</p>
              <p className="mt-0.5 whitespace-pre-wrap break-words">{project.links}</p>
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit project
            </Button>
            {project.balance_cents > 0 ? (
              <>
                <Button size="sm" variant="outline" onClick={() => void onInvoice()}>
                  Create invoice
                </Button>
                <Button size="sm" variant="outline" onClick={onPay}>
                  Record payment
                </Button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function NotesPanel({
  clientId,
  notes,
  onChanged,
}: {
  clientId: number;
  notes: ClientDetail["notes"];
  onChanged: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) return;
    setPending(true);
    try {
      await studio("addNote", { clientId, body });
      form.reset();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the note.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel title="Notes">
      <form onSubmit={onSubmit} className="border-b border-line p-4">
        <label htmlFor="note-body" className="sr-only">
          New note
        </label>
        <textarea
          id="note-body"
          name="body"
          rows={3}
          placeholder="Call notes, decisions, what they asked for…"
          className={cn(controlClass, "h-auto py-2 leading-relaxed")}
        />
        <div className="mt-2 flex justify-end">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Add note"}
          </Button>
        </div>
      </form>
      {notes.length === 0 ? null : (
        <ul className="divide-y divide-line">
          {notes.map((note) => (
            <li key={note.id} className="group px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-muted">
                  {new Date(note.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <ConfirmButton
                  size="sm"
                  onConfirm={async () => {
                    await studio("deleteNote", { id: note.id });
                    onChanged();
                  }}
                >
                  Delete
                </ConfirmButton>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}


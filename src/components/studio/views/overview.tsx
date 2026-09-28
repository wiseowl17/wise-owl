import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClientSheet, PaymentSheet, TaskSheet } from "@/components/studio/forms";
import { TaskRow } from "@/components/studio/views/tasks";
import { Badge, Empty, LoadState, PageHeader, Panel, Stat, useStudioData } from "@/components/studio/ui";
import { studio } from "@/lib/studio-api";
import { archiveLocalBook, readLocalBook } from "@/lib/studio-local";
import { formatDate, formatMoney, formatMonth } from "@/lib/money";
import { label, paymentKindLabel, type Dashboard } from "@/lib/studio-types";

export function OverviewView() {
  const { value: data, error, reload } = useStudioData<Dashboard>("dashboard");
  const [sheet, setSheet] = useState<"client" | "payment" | "task" | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={data ? formatDate(data.today) : undefined}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setSheet("task")}>
              <Plus className="size-4" /> Task
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSheet("client")}>
              <Plus className="size-4" /> Client
            </Button>
            <Button size="sm" onClick={() => setSheet("payment")}>
              <Plus className="size-4" /> Payment
            </Button>
          </>
        }
      />

      <ImportBanner onDone={reload} />

      {data && data.invoices.draft_count > 0 ? (
        <Link
          to="/studio"
          search={{ view: "invoices" }}
          className="flex items-center justify-between gap-3 rounded-[14px] border border-accent/30 bg-accent/5 px-4 py-3 text-sm transition-colors hover:bg-accent/10"
        >
          <span>
            {data.invoices.draft_count} draft invoice{data.invoices.draft_count === 1 ? "" : "s"} ready to send
            (monthly care drafts itself on each plan’s billing day).
          </span>
          <span className="shrink-0 font-medium text-accent">Review</span>
        </Link>
      ) : null}

      {!data ? (
        <LoadState error={error} rows={6} />
      ) : (
        <>
          <Panel className="grid grid-cols-2 gap-px overflow-hidden bg-line sm:grid-cols-3 lg:grid-cols-6 [&>*]:bg-surface">
            <Stat label="This month" value={formatMoney(data.money.month_cents)} />
            <Stat label="This year" value={formatMoney(data.money.year_cents)} />
            <Stat
              label="Profit this year"
              value={formatMoney(data.money.year_cents - data.money.year_expense_cents)}
              hint={`${formatMoney(data.money.year_expense_cents)} expenses`}
            />
            <Stat label="Care plans / mo" value={formatMoney(data.money.mrr_cents)} />
            <Stat label="Owed on projects" value={formatMoney(data.money.outstanding_cents)} />
            <Stat
              label="Invoices unpaid"
              value={formatMoney(data.invoices.outstanding_cents)}
              hint={
                data.invoices.overdue_count
                  ? `${formatMoney(data.invoices.overdue_cents)} overdue`
                  : undefined
              }
            />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Panel title="Income, last 12 months">
              <IncomeChart monthly={data.monthly} current={data.month} />
            </Panel>

            <Panel title="Clients">
              <dl className="grid grid-cols-3 divide-x divide-line">
                <Stat label="Active" value={String(data.counts.active_clients)} />
                <Stat label="Leads & onboarding" value={String(data.counts.pipeline_clients)} />
                <Stat label="Projects in work" value={String(data.counts.active_projects)} />
              </dl>
              <div className="border-t border-line px-4 py-3">
                <InboxLine inbox={data.inbox} />
              </div>
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Due this week"
              action={
                <Link to="/studio" search={{ view: "tasks" }} className="text-sm text-accent hover:underline">
                  All tasks
                </Link>
              }
            >
              {data.dueTasks.length === 0 ? (
                <Empty>Nothing due in the next 7 days. Monthly care tasks show up here when their day comes around.</Empty>
              ) : (
                <ul className="divide-y divide-line">
                  {data.dueTasks.map((task) => (
                    <TaskRow key={task.id} task={task} today={data.today} onChanged={reload} showClient />
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Projects in motion"
              action={
                <Link to="/studio" search={{ view: "projects" }} className="text-sm text-accent hover:underline">
                  All projects
                </Link>
              }
            >
              {data.openProjects.length === 0 ? (
                <Empty>No open projects. Add one from a client’s page.</Empty>
              ) : (
                <ul className="divide-y divide-line">
                  {data.openProjects.map((project) => (
                    <li key={project.id}>
                      <Link
                        to="/studio"
                        search={{ view: "clients", id: project.client_id }}
                        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-bg"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{project.name}</p>
                          <p className="truncate text-xs text-muted">
                            {project.client_company || project.client_name}
                            {project.due_on ? ` · due ${formatDate(project.due_on, false)}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {project.balance_cents > 0 ? (
                            <span className="text-xs tabular-nums text-muted">
                              {formatMoney(project.balance_cents)} owed
                            </span>
                          ) : null}
                          <Badge tone={project.status}>{label(project.status)}</Badge>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel
            title="Recent payments"
            action={
              <Link to="/studio" search={{ view: "payments" }} className="text-sm text-accent hover:underline">
                All payments
              </Link>
            }
          >
            {data.recentPayments.length === 0 ? (
              <Empty>No payments yet. Record the first onboarding fee when it comes in.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {data.recentPayments.map((payment) => (
                  <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {payment.client_company || payment.client_name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {paymentKindLabel(payment.kind)} · {label(payment.method)} · {formatDate(payment.paid_on)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {payment.status === "pending" ? <Badge tone="pending">Pending</Badge> : null}
                      <span className="text-sm font-semibold tabular-nums">{formatMoney(payment.amount_cents)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="flex justify-end">
            <Button size="sm" variant="ghost" className="text-muted" onClick={() => void exportBackup()}>
              <Download className="size-4" /> Download a backup
            </Button>
          </div>
        </>
      )}

      <ClientSheet open={sheet === "client"} onClose={() => setSheet(null)} onSaved={reload} />
      <PaymentSheet open={sheet === "payment"} onClose={() => setSheet(null)} onSaved={reload} />
      <TaskSheet open={sheet === "task"} onClose={() => setSheet(null)} onSaved={reload} />
    </div>
  );
}

function IncomeChart({ monthly, current }: { monthly: Dashboard["monthly"]; current: string }) {
  const max = Math.max(1, ...monthly.map((m) => Math.max(m.income_cents, m.expense_cents)));
  const hasData = monthly.some((m) => m.income_cents > 0 || m.expense_cents > 0);
  if (!hasData) {
    return <Empty>Income and expenses by month appear here once payments are recorded.</Empty>;
  }
  return (
    <div className="px-4 pb-4 pt-5">
      <div className="flex h-40 items-end gap-1.5 sm:gap-2" role="img" aria-label="Monthly income for the last 12 months">
        {monthly.map((m) => (
          <div
            key={m.month}
            className="group relative flex h-full flex-1 flex-col justify-end"
            title={`${formatMonth(m.month)}: ${formatMoney(m.income_cents)} in, ${formatMoney(m.expense_cents)} out`}
          >
            <div
              className={
                m.month === current
                  ? "rounded-t-[4px] bg-accent"
                  : "rounded-t-[4px] bg-accent/35 transition-colors group-hover:bg-accent/60"
              }
              style={{ height: `${Math.max((m.income_cents / max) * 100, m.income_cents > 0 ? 2 : 0)}%` }}
            />
            {m.expense_cents > 0 ? (
              <div
                className="absolute inset-x-0 h-0.5 bg-fg/50"
                style={{ bottom: `${(m.expense_cents / max) * 100}%` }}
              />
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {monthly.map((m) => (
          <span key={m.month} className="flex-1 text-center text-[11px] text-subtle">
            {formatMonth(m.month).slice(0, 1)}
            <span className="max-sm:hidden">{formatMonth(m.month).slice(1)}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px] bg-accent" /> Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-fg/50" /> Expenses
        </span>
      </p>
    </div>
  );
}

function InboxLine({ inbox }: { inbox: Dashboard["inbox"] }) {
  const total = inbox.inquiries + inbox.onboardings + inbox.agreements;
  return (
    <Link to="/studio" search={{ view: "inbox" }} className="flex items-center justify-between text-sm">
      <span className="text-muted">
        {total === 0
          ? "Inbox is clear."
          : [
              inbox.inquiries ? `${inbox.inquiries} new inquir${inbox.inquiries === 1 ? "y" : "ies"}` : "",
              inbox.onboardings ? `${inbox.onboardings} brief${inbox.onboardings === 1 ? "" : "s"}` : "",
              inbox.agreements ? `${inbox.agreements} signed` : "",
            ]
              .filter(Boolean)
              .join(", ")}
      </span>
      <span className="text-accent">Open inbox</span>
    </Link>
  );
}

function ImportBanner({ onDone }: { onDone: () => void }) {
  const [book, setBook] = useState(() => readLocalBook());
  const [busy, setBusy] = useState(false);
  if (!book) return null;
  const clients = book.clients?.length ?? 0;
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-accent/30 bg-accent/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">
        This browser still has the old studio book ({clients} client{clients === 1 ? "" : "s"}). Move it into the
        database so it’s saved everywhere.
      </p>
      <Button
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const result = await studio<{ clients: number; payments: number }>("importLocalBook", { book });
            archiveLocalBook();
            setBook(null);
            toast.success(`Moved ${result.clients} clients and ${result.payments} payments.`);
            onDone();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not import.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Moving…" : "Move it now"}
      </Button>
    </div>
  );
}

async function exportBackup() {
  try {
    const data = await studio("exportAll");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wise-owl-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Could not export.");
  }
}

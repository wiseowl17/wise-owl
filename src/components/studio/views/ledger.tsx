/** Projects, Payments, and Expenses: the three table views. */
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseSheet, PaymentSheet, ProjectSheet } from "@/components/studio/forms";
import { ClientLink } from "@/components/studio/views/tasks";
import { Badge, controlClass, Empty, LoadState, PageHeader, Panel, Stat, useStudioData } from "@/components/studio/ui";
import { formatDate, formatMoney, todayIso } from "@/lib/money";
import {
  label,
  paymentKindLabel,
  PROJECT_STATUSES,
  type Expense,
  type Payment,
  type Project,
} from "@/lib/studio-types";
import { cn } from "@/lib/utils";

const th = "px-4 py-2.5 font-medium";
const td = "px-4 py-3";

/* ------------------------------------------------------------- projects */

export function ProjectsView() {
  const { value: projects, error, reload } = useStudioData<Project[]>("listProjects");
  const [status, setStatus] = useState("open");
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const today = todayIso();

  const rows = useMemo(
    () =>
      (projects ?? []).filter((p) => {
        if (status === "open") return !["launched", "cancelled"].includes(p.status);
        if (status === "all") return true;
        return p.status === status;
      }),
    [projects, status],
  );
  const owed = rows.reduce((sum, p) => sum + (p.status === "cancelled" ? 0 : p.balance_cents), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Every build, what it costs, and what’s still owed."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Project
          </Button>
        }
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="sr-only" htmlFor="project-status">Filter by status</label>
        <select
          id="project-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={cn(controlClass, "sm:w-52")}
        >
          <option value="open">Open projects</option>
          <option value="all">All projects</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        {rows.length ? (
          <p className="text-sm text-muted">
            {formatMoney(owed)} still owed across {rows.length} project{rows.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      {!projects ? (
        <LoadState error={error} />
      ) : rows.length === 0 ? (
        <Panel>
          <Empty
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                Add a project
              </Button>
            }
          >
            {projects.length ? "No projects match that filter." : "No projects yet. Each one holds the price, full scope, dates, and domain."}
          </Empty>
        </Panel>
      ) : (
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line bg-bg/60 text-left text-xs text-muted">
              <tr>
                <th className={th}>Project</th>
                <th className={th}>Status</th>
                <th className={th}>Due</th>
                <th className={cn(th, "text-right")}>Price</th>
                <th className={cn(th, "text-right")}>Owed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => {
                const late = p.due_on && p.due_on < today && !["launched", "cancelled"].includes(p.status);
                return (
                  <tr key={p.id} className="transition-colors hover:bg-bg">
                    <td className={td}>
                      <button type="button" onClick={() => setEditing(p)} className="font-medium hover:text-accent">
                        {p.name}
                      </button>
                      <p className="text-xs text-muted">
                        <ClientLink id={p.client_id}>{p.client_company || p.client_name}</ClientLink> · {label(p.kind)}
                      </p>
                    </td>
                    <td className={td}>
                      <Badge tone={p.status}>{label(p.status)}</Badge>
                    </td>
                    <td className={cn(td, "whitespace-nowrap", late ? "text-[#9b1c1c]" : "text-muted")}>
                      {p.due_on ? formatDate(p.due_on) : "None"}
                    </td>
                    <td className={cn(td, "text-right tabular-nums")}>{formatMoney(p.price_cents)}</td>
                    <td className={cn(td, "text-right font-medium tabular-nums", p.balance_cents === 0 && "text-subtle")}>
                      {formatMoney(p.balance_cents)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}
      <ProjectSheet open={creating} onClose={() => setCreating(false)} onSaved={reload} />
      <ProjectSheet open={Boolean(editing)} record={editing} onClose={() => setEditing(null)} onSaved={reload} />
    </div>
  );
}

/* ------------------------------------------------------------- payments */

function yearsOf(dates: string[]) {
  const years = new Set(dates.map((d) => d.slice(0, 4)));
  years.add(todayIso().slice(0, 4));
  return [...years].sort().reverse();
}

export function PaymentsView() {
  const { value: payments, error, reload } = useStudioData<Payment[]>("listPayments");
  const [year, setYear] = useState(todayIso().slice(0, 4));
  const [editing, setEditing] = useState<Payment | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = (payments ?? []).filter((p) => year === "all" || p.paid_on.startsWith(year));
  const paid = rows.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount_cents, 0);
  const pending = rows.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount_cents, 0);
  const care = rows
    .filter((p) => p.status === "paid" && p.kind === "care")
    .reduce((s, p) => s + p.amount_cents, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Every dollar in: onboarding fees, deposits, final payments, care plans."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Payment
          </Button>
        }
      />
      <YearSelect id="payments-year" value={year} onChange={setYear} years={yearsOf((payments ?? []).map((p) => p.paid_on))} />

      {!payments ? (
        <LoadState error={error} />
      ) : (
        <>
          <Panel className="grid grid-cols-3 gap-px overflow-hidden bg-line [&>*]:bg-surface">
            <Stat label="Received" value={formatMoney(paid)} />
            <Stat label="From care plans" value={formatMoney(care)} />
            <Stat label="Pending" value={formatMoney(pending)} />
          </Panel>
          {rows.length === 0 ? (
            <Panel>
              <Empty>No payments {year === "all" ? "yet" : `in ${year}`}.</Empty>
            </Panel>
          ) : (
            <Panel className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-line bg-bg/60 text-left text-xs text-muted">
                  <tr>
                    <th className={th}>Date</th>
                    <th className={th}>Client</th>
                    <th className={th}>For</th>
                    <th className={th}>Method</th>
                    <th className={cn(th, "text-right")}>Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-bg">
                      <td className={cn(td, "whitespace-nowrap text-muted")}>{formatDate(p.paid_on)}</td>
                      <td className={td}>
                        <ClientLink id={p.client_id}>{p.client_company || p.client_name}</ClientLink>
                        {p.project_name ? <p className="text-xs text-muted">{p.project_name}</p> : null}
                      </td>
                      <td className={td}>
                        <button type="button" onClick={() => setEditing(p)} className="hover:text-accent">
                          {paymentKindLabel(p.kind)}
                        </button>
                        {p.status === "pending" ? <span className="ml-2 align-middle"><Badge tone="pending">Pending</Badge></span> : null}
                      </td>
                      <td className={cn(td, "text-muted")}>{label(p.method)}</td>
                      <td className={cn(td, "text-right font-medium tabular-nums")}>{formatMoney(p.amount_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </>
      )}
      <PaymentSheet open={creating} onClose={() => setCreating(false)} onSaved={reload} />
      <PaymentSheet open={Boolean(editing)} record={editing} onClose={() => setEditing(null)} onSaved={reload} />
    </div>
  );
}

/* ------------------------------------------------------------- expenses */

export function ExpensesView() {
  const { value: expenses, error, reload } = useStudioData<Expense[]>("listExpenses");
  const [year, setYear] = useState(todayIso().slice(0, 4));
  const [editing, setEditing] = useState<Expense | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = (expenses ?? []).filter((e) => year === "all" || e.spent_on.startsWith(year));
  const total = rows.reduce((s, e) => s + e.amount_cents, 0);
  const byCategory = Object.entries(
    rows.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount_cents;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Hosting, domains, software, contractors. Keeps profit honest and tax time easy."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Expense
          </Button>
        }
      />
      <YearSelect id="expenses-year" value={year} onChange={setYear} years={yearsOf((expenses ?? []).map((e) => e.spent_on))} />

      {!expenses ? (
        <LoadState error={error} />
      ) : rows.length === 0 ? (
        <Panel>
          <Empty
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                Log an expense
              </Button>
            }
          >
            No expenses {year === "all" ? "yet" : `in ${year}`}.
          </Empty>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-line bg-bg/60 text-left text-xs text-muted">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Paid to</th>
                  <th className={th}>Category</th>
                  <th className={cn(th, "text-right")}>Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-bg">
                    <td className={cn(td, "whitespace-nowrap text-muted")}>{formatDate(e.spent_on)}</td>
                    <td className={td}>
                      <button type="button" onClick={() => setEditing(e)} className="font-medium hover:text-accent">
                        {e.vendor}
                      </button>
                      {e.client_name && e.client_id ? (
                        <p className="text-xs text-muted">
                          for <ClientLink id={e.client_id}>{e.client_name}</ClientLink>
                        </p>
                      ) : null}
                    </td>
                    <td className={cn(td, "text-muted")}>{label(e.category)}</td>
                    <td className={cn(td, "text-right font-medium tabular-nums")}>{formatMoney(e.amount_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title={`Total ${formatMoney(total)}`}>
            <ul className="divide-y divide-line">
              {byCategory.map(([category, cents]) => (
                <li key={category} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted">{label(category)}</span>
                  <span className="tabular-nums">{formatMoney(cents)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
      <ExpenseSheet open={creating} onClose={() => setCreating(false)} onSaved={reload} />
      <ExpenseSheet open={Boolean(editing)} record={editing} onClose={() => setEditing(null)} onSaved={reload} />
    </div>
  );
}

function YearSelect({
  id,
  value,
  onChange,
  years,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  years: string[];
}) {
  return (
    <div>
      <label className="sr-only" htmlFor={id}>Year</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn(controlClass, "w-40")}>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
        <option value="all">All time</option>
      </select>
    </div>
  );
}

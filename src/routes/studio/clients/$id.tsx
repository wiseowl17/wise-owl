import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Circle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { fieldClass, StatusBadge } from "@/components/studio/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDay, formatMoney, formatSoldOn } from "@/lib/money";
import {
  addSale,
  addTodo,
  deleteClient,
  getClient,
  setClientStatus,
  toggleTodo,
  updateClient,
  type ClientDetail,
  type ClientStatus,
} from "@/lib/studio-client";

export const Route = createFileRoute("/studio/clients/$id")({
  component: ClientPage,
});

function ClientPage() {
  const { id } = Route.useParams();
  const clientId = Number(id);
  const [data, setData] = useState<ClientDetail | null>(null);
  const [error, setError] = useState("");
  const [salePending, setSalePending] = useState(false);
  const [todoPending, setTodoPending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [amount, setAmount] = useState("");

  async function load() {
    try {
      const next = await getClient({ data: clientId });
      setData(next);
      setError("");
      if (!amount) {
        setAmount(String((next.products[0]?.price_cents ?? 0) / 100));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load.";
      setError(message);
    }
  }

  useEffect(() => {
    void load();
  }, [clientId]);

  if (!data && !error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="h-10 w-48 animate-pulse rounded-full bg-raised" />
        <div className="h-6 w-64 animate-pulse rounded-full bg-raised" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">{error || "Missing client."}</p>
        <Link to="/studio" className="mt-4 inline-block text-sm text-accent">
          Back to the book
        </Link>
      </div>
    );
  }

  const { client, sales, todos, products, onboarding } = data;
  const bought = [...new Map(sales.map((s) => [s.product_id, s])).values()];
  const today = new Date().toISOString().slice(0, 10);

  async function onSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = new FormData(form);
    setSalePending(true);
    try {
      await addSale({
        data: {
          clientId: client.id,
          productId: Number(payload.get("productId")),
          amountDollars: Number(payload.get("amount")),
          soldOn: String(payload.get("soldOn") ?? ""),
          notes: String(payload.get("notes") ?? ""),
        },
      });
      form.reset();
      toast.success("Sale recorded.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSalePending(false);
    }
  }

  async function onTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = new FormData(form);
    setTodoPending(true);
    try {
      await addTodo({
        data: {
          clientId: client.id,
          title: String(payload.get("title") ?? ""),
          dueDay: Number(payload.get("dueDay")),
        },
      });
      form.reset();
      toast.success("Task added.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setTodoPending(false);
    }
  }

  async function onToggle(todoId: number) {
    try {
      await toggleTodo({ data: { id: todoId, clientId: client.id } });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    }
  }

  async function onStatus(status: ClientStatus) {
    try {
      await setClientStatus({ data: { clientId: client.id, status } });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    }
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = new FormData(form);
    setEditPending(true);
    try {
      await updateClient({
        data: {
          clientId: client.id,
          name: String(payload.get("name") ?? ""),
          email: String(payload.get("email") ?? ""),
          company: String(payload.get("company") ?? ""),
          website: String(payload.get("website") ?? ""),
          notes: String(payload.get("profileNotes") ?? ""),
        },
      });
      setEditOpen(false);
      toast.success("Profile updated.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setEditPending(false);
    }
  }

  async function onDelete() {
    try {
      await deleteClient({ data: client.id });
      toast.success("Client removed.");
      window.location.assign("/studio.html");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Link
        to="/studio"
        className="text-sm text-muted transition-colors hover:text-fg"
      >
        ← All clients
      </Link>

      <div className="mt-6 flex flex-col items-center text-center">
        <StatusBadge status={client.status} />
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          {client.company || client.name}
        </h1>
        <p className="mt-2 text-muted">{client.name}</p>
        <p className="mt-1 text-sm text-subtle">{client.email}</p>
        {client.website ? (
          <a
            href={client.website}
            className="mt-2 text-sm text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {client.website.replace(/^https?:\/\//, "")}
          </a>
        ) : null}
        {client.notes ? (
          <p className="mt-3 max-w-md text-sm text-muted">{client.notes}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="outline" onClick={() => setEditOpen((v) => !v)}>
            {editOpen ? "Close" : "Edit profile"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmDelete((v) => !v)}
          >
            Delete client
          </Button>
        </div>
      </div>

      {editOpen ? (
        <form
          onSubmit={onEdit}
          className="mt-6 grid w-full max-w-xl gap-4 rounded-[24px] bg-surface p-5 text-left sm:grid-cols-2 sm:p-7"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={client.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={client.email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              name="company"
              defaultValue={client.company ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Site</Label>
            <Input
              id="website"
              name="website"
              defaultValue={client.website ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profileNotes">Notes</Label>
            <Textarea
              id="profileNotes"
              name="profileNotes"
              defaultValue={client.notes ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={editPending}>
              {editPending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      ) : null}

      {confirmDelete ? (
        <div className="mt-6 w-full max-w-md rounded-[24px] bg-surface p-6 text-center">
          <p className="text-sm text-muted">
            Remove {client.company || client.name} and every sale and task with
            them?
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button type="button" onClick={() => void onDelete()}>
              Yes, delete
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(false)}
            >
              Keep
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid w-full gap-4 sm:grid-cols-3">
        <Stat label="Sales" value={formatMoney(client.total_cents)} />
        <Stat label="Products" value={String(bought.length)} />
        <Stat
          label="Open this month"
          value={`${todos.filter((t) => !t.done).length}`}
        />
      </div>

      <label className="mt-6 flex w-full max-w-xs flex-col items-center gap-2 text-sm">
        <span className="text-xs uppercase tracking-[0.16em] text-subtle">
          Status
        </span>
        <select
          className={fieldClass}
          value={client.status}
          onChange={(event) => onStatus(event.target.value as ClientStatus)}
        >
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </label>

      {onboarding ? (
        <section className="mt-12 w-full rounded-[24px] bg-surface p-6 text-left sm:p-8">
          <h2 className="text-center font-display text-3xl tracking-tight">
            Onboarding brief
          </h2>
          <dl className="mx-auto mt-6 grid max-w-2xl gap-5 sm:grid-cols-2">
            <Fact label="Project" value={onboarding.project_type} />
            <Fact label="Timeline" value={onboarding.timeline} />
            <Fact label="Budget" value={onboarding.budget} />
            <Fact label="Audience" value={onboarding.audience} />
            <Fact label="Goals" value={onboarding.goals} wide />
            <Fact label="Notes" value={onboarding.extra} wide />
          </dl>
        </section>
      ) : null}

      <section className="mt-12 w-full">
        <h2 className="text-center font-display text-3xl tracking-tight">
          Products & sales
        </h2>
        {bought.length ? (
          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {bought.map((item) => (
              <li
                key={item.product_id}
                className="rounded-full bg-raised px-3 py-1.5 text-sm"
              >
                {item.product_name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-center text-sm text-muted">
            No products yet.
          </p>
        )}

        <div className="mt-6 overflow-x-auto rounded-[24px] border border-line bg-surface">
          {sales.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              No sales recorded.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-raised text-xs uppercase tracking-[0.16em] text-subtle">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-t border-line">
                    <td className="px-4 py-3">{formatSoldOn(sale.sold_on)}</td>
                    <td className="px-4 py-3">{sale.product_name}</td>
                    <td className="px-4 py-3 text-muted">{sale.notes || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatMoney(sale.amount_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form
          onSubmit={onSale}
          className="mt-5 grid gap-4 rounded-[24px] bg-surface p-5 text-left sm:grid-cols-2 sm:p-7 lg:grid-cols-4"
        >
          <div className="space-y-2">
            <Label htmlFor="productId">Product</Label>
            <select
              id="productId"
              name="productId"
              required
              className={fieldClass}
              onChange={(event) => {
                const product = products.find(
                  (item) => item.id === Number(event.target.value),
                );
                if (product) setAmount(String(product.price_cents / 100));
              }}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={0}
              step={1}
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="soldOn">Date</Label>
            <Input
              id="soldOn"
              name="soldOn"
              type="date"
              required
              defaultValue={today}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Input id="notes" name="notes" placeholder="Optional" />
          </div>
          <div className="lg:col-span-4">
            <Button type="submit" disabled={salePending}>
              {salePending ? "Saving…" : "Add sale"}
            </Button>
          </div>
        </form>
      </section>

      <section className="mt-12 w-full">
        <h2 className="text-center font-display text-3xl tracking-tight">
          Monthly maintenance
        </h2>
        <p className="mt-2 text-center text-sm text-muted">
          Checks reset each month. Mark them when they’re done.
        </p>

        <ul className="mx-auto mt-6 max-w-2xl divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-surface text-left">
          {todos.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-muted">
              No monthly tasks yet.
            </li>
          ) : (
            todos.map((todo) => (
              <li key={todo.id}>
                <button
                  type="button"
                  onClick={() => onToggle(todo.id)}
                  className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left hover:bg-raised"
                >
                  {todo.done ? (
                    <Check className="size-5 shrink-0 text-accent" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-subtle" />
                  )}
                  <span className={todo.done ? "text-muted line-through" : ""}>
                    {todo.title}
                  </span>
                  <span className="ml-auto text-xs text-subtle">
                    Due {formatDay(todo.due_day)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <form
          onSubmit={onTodo}
          className="mx-auto mt-5 grid max-w-2xl gap-4 rounded-[24px] bg-surface p-5 text-left sm:grid-cols-[1fr_7rem_auto] sm:items-end sm:p-7"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Task</Label>
            <Input id="title" name="title" required placeholder="Apply updates" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDay">Day</Label>
            <Input
              id="dueDay"
              name="dueDay"
              type="number"
              min={1}
              max={28}
              required
              defaultValue={1}
            />
          </div>
          <Button type="submit" disabled={todoPending}>
            {todoPending ? "Saving…" : "Add task"}
          </Button>
        </form>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-surface px-5 py-6 text-center">
      <p className="text-xs uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="mt-2 font-display text-3xl tracking-tight">{value}</p>
    </div>
  );
}

function Fact({
  label,
  value,
  wide,
}: {
  label: string;
  value: string | null;
  wide?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs uppercase tracking-[0.16em] text-subtle">{label}</dt>
      <dd className="mt-1 leading-relaxed">{value}</dd>
    </div>
  );
}

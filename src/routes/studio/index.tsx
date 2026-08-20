import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/studio/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/money";
import { RATES_PATH } from "@/lib/rates";
import {
  addClient,
  deleteAgreement,
  getStudio,
  listAgreements,
  type AgreementRow,
  type StudioOverview,
} from "@/lib/studio-client";

export const Route = createFileRoute("/studio/")({
  component: StudioHome,
});

export function StudioHome() {
  const [data, setData] = useState<StudioOverview | null>(null);
  const [agreements, setAgreements] = useState<AgreementRow[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirmAgreement, setConfirmAgreement] = useState<number | null>(null);
  const shareUrl =
    typeof window === "undefined"
      ? RATES_PATH
      : `${window.location.origin}${RATES_PATH}`;

  async function load() {
    try {
      const [studio, signed] = await Promise.all([
        getStudio(),
        listAgreements(),
      ]);
      setData(studio);
      setAgreements(Array.isArray(signed) ? signed : []);
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load.";
      setError(message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = new FormData(form);
    setPending(true);
    try {
      await addClient({
        data: {
          name: String(payload.get("name") ?? ""),
          email: String(payload.get("email") ?? ""),
          company: String(payload.get("company") ?? ""),
          website: String(payload.get("website") ?? ""),
          notes: String(payload.get("notes") ?? ""),
        },
      });
      form.reset();
      setOpen(false);
      toast.success("Client added.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add.");
    } finally {
      setPending(false);
    }
  }

  async function onDeleteAgreement(id: number) {
    try {
      await deleteAgreement({ data: id });
      setConfirmAgreement(null);
      toast.success("Agreement removed.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  if (!data && !error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="h-10 w-40 animate-pulse rounded-full bg-raised" />
        <div className="h-6 w-64 animate-pulse rounded-full bg-raised" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const totals = data.totals ?? {
    client_count: 0,
    revenue_cents: 0,
    open_todos: 0,
  };
  const clients = Array.isArray(data.clients) ? data.clients : [];

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
        Client portfolio
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        The book.
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted">
        Every client, what they bought, and what’s due this month.
      </p>

      <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
        <Stat label="Clients" value={String(totals.client_count)} />
        <Stat label="Sales" value={formatMoney(totals.revenue_cents)} />
        <Stat
          label="Open this month"
          value={`${totals.open_todos} tasks`}
        />
      </div>

      <div className="mt-4 w-full rounded-[24px] bg-surface px-6 py-6">
        <p className="text-xs uppercase tracking-[0.16em] text-subtle">
          Client rates link
        </p>
        <p className="mt-2 text-sm text-muted">
          Not on the public site. Copy and send this only to a client.
        </p>
        <p className="mt-3 break-all text-sm font-medium">{shareUrl}</p>
        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(shareUrl).then(
                () => toast.success("Link copied."),
                () => toast.error("Could not copy."),
              );
            }}
          >
            Copy link
          </Button>
          <Button asChild variant="outline">
            <Link to={RATES_PATH}>Open the page</Link>
          </Button>
        </div>
      </div>

      <div className="mt-10 w-full">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={() => setOpen((v) => !v)}>
            {open ? "Close" : "Add a client"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/onboard">Client onboarding</Link>
          </Button>
        </div>

        {open ? (
          <form
            onSubmit={onAdd}
            className="mx-auto mt-6 grid max-w-xl gap-4 rounded-[24px] bg-surface p-5 text-left sm:grid-cols-2 sm:p-7"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Site</Label>
              <Input id="website" name="website" placeholder="https://" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Saving…" : "Save client"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      <ul className="mt-10 grid w-full gap-4 md:grid-cols-2">
        {clients.map((client) => (
          <li key={client.id}>
            <Link
              to="/studio/clients/$id"
              params={{ id: String(client.id) }}
              className="flex h-full flex-col rounded-[24px] border border-line bg-surface p-6 text-left transition-colors hover:border-line-strong"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl tracking-tight">
                    {client.company || client.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">{client.name}</p>
                </div>
                <StatusBadge status={client.status} />
              </div>
              <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-subtle">
                    Sales
                  </dt>
                  <dd className="mt-1 font-medium">
                    {formatMoney(client.total_cents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-subtle">
                    Products
                  </dt>
                  <dd className="mt-1 font-medium">{client.product_count}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-subtle">
                    Open
                  </dt>
                  <dd className="mt-1 font-medium">{client.open_todos}</dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>

      {clients.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          No clients yet. Add one, or send someone to onboarding.
        </p>
      ) : null}

      <section className="mt-16 w-full">
        <h2 className="font-display text-3xl tracking-tight">
          Signed agreements
        </h2>
        {agreements.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            None yet. They appear here when a client signs the rates page.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-surface text-left">
            {agreements.map((row) => (
              <li key={row.id} className="px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {row.company ? `${row.company} · ` : ""}
                      {row.email}
                    </p>
                    <p className="mt-1 text-sm text-subtle">
                      {row.project} · {formatSigned(row.signed_at)}
                    </p>
                  </div>
                  {confirmAgreement === row.id ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void onDeleteAgreement(row.id)}
                      >
                        Yes, delete
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmAgreement(null)}
                      >
                        Keep
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmAgreement(row.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatSigned(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-surface px-5 py-6">
      <p className="text-xs uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="mt-2 font-display text-3xl tracking-tight">{value}</p>
    </div>
  );
}

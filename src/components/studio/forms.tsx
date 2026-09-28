import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { studio } from "@/lib/studio-api";
import { centsToInput, formatMoney, todayIso } from "@/lib/money";
import {
  CARE_PLANS,
  CLIENT_STATUSES,
  EXPENSE_CATEGORIES,
  label,
  PAYMENT_KINDS,
  PAYMENT_METHODS,
  paymentKindLabel,
  PRIORITIES,
  PROJECT_KINDS,
  PROJECT_STATUSES,
  type CarePlan,
  type Client,
  type ClientListRow,
  type Expense,
  type Payment,
  type Project,
  type Task,
} from "@/lib/studio-types";
import {
  AreaField,
  FormActions,
  formValues,
  SelectField,
  Sheet,
  TextField,
} from "@/components/studio/ui";

/* -------------------------------------------------------------- lookups */

type Lookups = { clients: ClientListRow[]; projects: Project[] };

function useLookups(enabled: boolean) {
  const [lookups, setLookups] = useState<Lookups>({ clients: [], projects: [] });
  useEffect(() => {
    if (!enabled) return;
    void Promise.all([
      studio<ClientListRow[]>("listClients"),
      studio<Project[]>("listProjects"),
    ]).then(
      ([clients, projects]) => setLookups({ clients, projects }),
      () => undefined,
    );
  }, [enabled]);
  return lookups;
}

function clientOptions(clients: ClientListRow[]) {
  return clients.map((c) => ({
    value: String(c.id),
    label: c.company ? `${c.company} (${c.name})` : c.name,
  }));
}

function projectOptions(projects: Project[], clientId: string) {
  return projects
    .filter((p) => !clientId || String(p.client_id) === clientId)
    .map((p) => ({ value: String(p.id), label: p.name }));
}

const opts = (values: readonly string[], fn: (v: string) => string = label) =>
  values.map((value) => ({ value, label: fn(value) }));

/* ---------------------------------------------------------- shared shell */

function RecordSheet({
  open,
  title,
  onClose,
  onSubmit,
  pending,
  submitLabel,
  onDelete,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  pending: boolean;
  submitLabel: string;
  onDelete?: () => Promise<void>;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} title={title} onClose={onClose}>
      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void onSubmit(formValues(event.currentTarget));
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">{children}</div>
        <FormActions pending={pending} label={submitLabel} onDelete={onDelete} />
      </form>
    </Sheet>
  );
}

/** Save/delete plumbing shared by every record sheet. */
function useRecord(onDone: () => void) {
  const [pending, setPending] = useState(false);
  async function run(action: string, data: Record<string, unknown>, message: string) {
    setPending(true);
    try {
      await studio(action, data);
      toast.success(message);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }
  return { pending, run };
}

type SheetProps<T> = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  record?: T | null;
  clientId?: number;
  projectId?: number;
};

/* --------------------------------------------------------------- client */

export function ClientSheet({ open, onClose, onSaved, record }: SheetProps<Client>) {
  const { pending, run } = useRecord(() => {
    onClose();
    onSaved();
  });
  return (
    <RecordSheet
      open={open}
      title={record ? "Edit client" : "New client"}
      onClose={onClose}
      pending={pending}
      submitLabel={record ? "Save changes" : "Add client"}
      onSubmit={(v) => run("saveClient", { ...v, id: record?.id }, record ? "Client saved." : "Client added.")}
      onDelete={
        record
          ? () =>
              run("deleteClient", { id: record.id }, "Client deleted.").then(() => {
                window.location.assign("/studio?view=clients");
              })
          : undefined
      }
    >
      <TextField label="Name" name="name" defaultValue={record?.name} required autoFocus className="sm:col-span-2" />
      <TextField label="Business" name="company" defaultValue={record?.company} />
      <SelectField label="Status" name="status" defaultValue={record?.status ?? "lead"} options={opts(CLIENT_STATUSES)} />
      <TextField label="Email" name="email" type="email" defaultValue={record?.email} />
      <TextField label="Phone" name="phone" type="tel" defaultValue={record?.phone} />
      <TextField label="Website" name="website" defaultValue={record?.website} placeholder="https://" className="sm:col-span-2" />
      <TextField label="Address" name="address" defaultValue={record?.address} className="sm:col-span-2" />
      <TextField label="How they found you" name="source" defaultValue={record?.source} placeholder="Referral, Instagram, walk-in…" className="sm:col-span-2" />
      <AreaField label="Notes" name="notes" defaultValue={record?.notes} className="sm:col-span-2" />
    </RecordSheet>
  );
}

/* -------------------------------------------------------------- project */

export function ProjectSheet({ open, onClose, onSaved, record, clientId }: SheetProps<Project>) {
  const lookups = useLookups(open && !clientId && !record);
  const { pending, run } = useRecord(() => {
    onClose();
    onSaved();
  });
  const fixedClient = record?.client_id ?? clientId;
  return (
    <RecordSheet
      open={open}
      title={record ? "Edit project" : "New project"}
      onClose={onClose}
      pending={pending}
      submitLabel={record ? "Save changes" : "Add project"}
      onSubmit={(v) =>
        run("saveProject", { ...v, id: record?.id, clientId: fixedClient ?? v.clientId }, record ? "Project saved." : "Project added.")
      }
      onDelete={record ? () => run("deleteProject", { id: record.id }, "Project deleted.") : undefined}
    >
      {fixedClient ? null : (
        <SelectField label="Client" name="clientId" required placeholder="Choose a client" options={clientOptions(lookups.clients)} className="sm:col-span-2" />
      )}
      <TextField label="Project name" name="name" defaultValue={record?.name} required autoFocus placeholder="Barkly’s booking site" className="sm:col-span-2" />
      <SelectField label="Type" name="kind" defaultValue={record?.kind ?? "site"} options={opts(PROJECT_KINDS)} />
      <SelectField label="Status" name="status" defaultValue={record?.status ?? "proposal"} options={opts(PROJECT_STATUSES)} />
      <TextField label="Price ($)" name="price" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={centsToInput(record?.price_cents)} hint="Landing $400 · 3–5 pages $750 · 5+ pages from $1,200" className="sm:col-span-2" />
      <TextField label="Start" name="startOn" type="date" defaultValue={record?.start_on} />
      <TextField label="Due" name="dueOn" type="date" defaultValue={record?.due_on} />
      <TextField label="Domain" name="domain" defaultValue={record?.domain} placeholder="example.com" />
      <TextField label="Launched" name="launchedOn" type="date" defaultValue={record?.launched_on} />
      <TextField label="Live site" name="siteUrl" defaultValue={record?.site_url} placeholder="https://" className="sm:col-span-2" />
      <AreaField label="Full scope" name="scope" rows={7} defaultValue={record?.scope} placeholder={"Pages, features, integrations, content they’re sending, what’s out of scope…"} className="sm:col-span-2" />
      <AreaField label="Links and logins location" name="links" rows={3} defaultValue={record?.links} placeholder="Drive folder, Figma, repo, hosting dashboard. Keep passwords in a password manager, not here." className="sm:col-span-2" />
    </RecordSheet>
  );
}

/* -------------------------------------------------------------- payment */

/** A payment against an invoice: the invoice fixes the client and project. */
export type PaymentInvoice = { id: number; number: string; balance_cents: number; kind: string };

export function PaymentSheet({
  open,
  onClose,
  onSaved,
  record,
  clientId,
  projectId,
  invoice,
}: SheetProps<Payment> & { invoice?: PaymentInvoice | null }) {
  const lookups = useLookups(open && !invoice && !record?.invoice_id);
  const invoiceId = invoice?.id ?? record?.invoice_id ?? null;
  const initialClient = String(record?.client_id ?? clientId ?? "");
  const [selectedClient, setSelectedClient] = useState(initialClient);
  useEffect(() => {
    if (open) setSelectedClient(initialClient);
  }, [open, initialClient]);
  const { pending, run } = useRecord(() => {
    onClose();
    onSaved();
  });
  return (
    <RecordSheet
      open={open}
      title={record ? "Edit payment" : "Record a payment"}
      onClose={onClose}
      pending={pending}
      submitLabel={record ? "Save changes" : "Record payment"}
      onSubmit={(v) => run("savePayment", { ...v, id: record?.id }, record ? "Payment saved." : "Payment recorded.")}
      onDelete={record ? () => run("deletePayment", { id: record.id }, "Payment deleted.") : undefined}
    >
      {invoiceId ? (
        <div className="rounded-[10px] bg-raised px-3 py-2.5 text-sm sm:col-span-2">
          <input type="hidden" name="invoiceId" value={invoiceId} />
          Toward invoice <b>{invoice?.number ?? `#${invoiceId}`}</b>
          {invoice ? <span className="text-muted">, {formatMoney(invoice.balance_cents)} left to pay</span> : null}
        </div>
      ) : (
        <>
          <SelectField
            label="Client"
            name="clientId"
            required
            placeholder="Choose a client"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            options={clientOptions(lookups.clients)}
            className="sm:col-span-2"
          />
          <SelectField
            key={`p-${selectedClient}-${lookups.projects.length}`}
            label="Project"
            name="projectId"
            placeholder="Not tied to a project"
            defaultValue={record?.project_id ?? projectId ?? ""}
            options={projectOptions(lookups.projects, selectedClient)}
            className="sm:col-span-2"
          />
        </>
      )}
      <TextField label="Amount ($)" name="amount" type="number" step="0.01" inputMode="decimal" required autoFocus defaultValue={centsToInput(record ? Math.abs(record.amount_cents) : invoice ? invoice.balance_cents : null)} />
      <TextField label="Date" name="paidOn" type="date" required defaultValue={record?.paid_on ?? todayIso()} />
      <SelectField label="For" name="kind" defaultValue={record?.kind ?? invoice?.kind ?? "project"} options={opts(PAYMENT_KINDS, paymentKindLabel)} />
      <SelectField label="Method" name="method" defaultValue={record?.method ?? "card"} options={opts(PAYMENT_METHODS)} />
      <SelectField label="Status" name="status" defaultValue={record?.status ?? "paid"} options={opts(["paid", "pending"])} className="sm:col-span-2" />
      <AreaField label="Notes" name="notes" rows={2} defaultValue={record?.notes} className="sm:col-span-2" />
    </RecordSheet>
  );
}

/* ----------------------------------------------------------------- task */

export function TaskSheet({ open, onClose, onSaved, record, clientId, projectId }: SheetProps<Task>) {
  const lookups = useLookups(open);
  const [repeat, setRepeat] = useState<string>(record?.repeat ?? "none");
  const initialClient = String(record?.client_id ?? clientId ?? "");
  const [selectedClient, setSelectedClient] = useState(initialClient);
  useEffect(() => {
    if (!open) return;
    setRepeat(record?.repeat ?? "none");
    setSelectedClient(initialClient);
  }, [open, record, initialClient]);
  const { pending, run } = useRecord(() => {
    onClose();
    onSaved();
  });
  return (
    <RecordSheet
      open={open}
      title={record ? "Edit task" : "New task"}
      onClose={onClose}
      pending={pending}
      submitLabel={record ? "Save changes" : "Add task"}
      onSubmit={(v) => run("saveTask", { ...v, id: record?.id }, record ? "Task saved." : "Task added.")}
      onDelete={record ? () => run("deleteTask", { id: record.id }, "Task deleted.") : undefined}
    >
      <TextField label="Task" name="title" defaultValue={record?.title} required autoFocus className="sm:col-span-2" />
      <SelectField
        label="Client"
        name="clientId"
        placeholder="No client (studio task)"
        value={selectedClient}
        onChange={(e) => setSelectedClient(e.target.value)}
        options={clientOptions(lookups.clients)}
      />
      <SelectField
        key={`p-${selectedClient}-${lookups.projects.length}`}
        label="Project"
        name="projectId"
        placeholder="No project"
        defaultValue={record?.project_id ?? projectId ?? ""}
        options={projectOptions(lookups.projects, selectedClient)}
      />
      <SelectField
        label="Repeats"
        name="repeat"
        value={repeat}
        onChange={(e) => setRepeat(e.target.value)}
        options={[
          { value: "none", label: "Once" },
          { value: "monthly", label: "Every month" },
        ]}
      />
      {repeat === "monthly" ? (
        <TextField label="Day of the month" name="dueDay" type="number" min="1" max="31" required defaultValue={record?.due_day ?? 1} />
      ) : (
        <TextField label="Due" name="dueOn" type="date" defaultValue={record?.due_on} />
      )}
      <SelectField label="Priority" name="priority" defaultValue={record?.priority ?? "normal"} options={opts(PRIORITIES)} className="sm:col-span-2" />
      <AreaField label="Notes" name="notes" rows={3} defaultValue={record?.notes} className="sm:col-span-2" />
    </RecordSheet>
  );
}

/* ------------------------------------------------------------ care plan */

export function CarePlanSheet({ open, onClose, onSaved, record, clientId }: SheetProps<CarePlan>) {
  const { pending, run } = useRecord(() => {
    onClose();
    onSaved();
  });
  return (
    <RecordSheet
      open={open}
      title={record ? "Edit care plan" : "Start a care plan"}
      onClose={onClose}
      pending={pending}
      submitLabel={record ? "Save changes" : "Start plan"}
      onSubmit={(v) => run("saveCarePlan", { ...v, id: record?.id, clientId: record?.client_id ?? clientId }, "Care plan saved.")}
      onDelete={record ? () => run("deleteCarePlan", { id: record.id }, "Care plan deleted.") : undefined}
    >
      <SelectField label="Plan" name="plan" defaultValue={record?.plan ?? "basic"} options={opts(CARE_PLANS)} />
      <TextField label="Monthly amount ($)" name="amount" type="number" min="0" step="0.01" required defaultValue={centsToInput(record?.amount_cents ?? 10000)} hint="Basic from $100 · Backend from $250" />
      <TextField label="Bills on day" name="billingDay" type="number" min="1" max="28" required defaultValue={record?.billing_day ?? 1} />
      <TextField label="Started" name="startedOn" type="date" required defaultValue={record?.started_on ?? todayIso()} />
      <TextField label="Ended" name="endedOn" type="date" defaultValue={record?.ended_on} hint="Leave empty while the plan is running." className="sm:col-span-2" />
      <AreaField label="What’s included" name="notes" rows={3} defaultValue={record?.notes} className="sm:col-span-2" />
    </RecordSheet>
  );
}

/* -------------------------------------------------------------- expense */

export function ExpenseSheet({ open, onClose, onSaved, record, clientId }: SheetProps<Expense>) {
  const lookups = useLookups(open);
  const { pending, run } = useRecord(() => {
    onClose();
    onSaved();
  });
  return (
    <RecordSheet
      open={open}
      title={record ? "Edit expense" : "Log an expense"}
      onClose={onClose}
      pending={pending}
      submitLabel={record ? "Save changes" : "Log expense"}
      onSubmit={(v) => run("saveExpense", { ...v, id: record?.id }, record ? "Expense saved." : "Expense logged.")}
      onDelete={record ? () => run("deleteExpense", { id: record.id }, "Expense deleted.") : undefined}
    >
      <TextField label="Paid to" name="vendor" defaultValue={record?.vendor} required autoFocus placeholder="Vercel, GoDaddy, Adobe…" className="sm:col-span-2" />
      <TextField label="Amount ($)" name="amount" type="number" min="0" step="0.01" required defaultValue={centsToInput(record?.amount_cents)} />
      <TextField label="Date" name="spentOn" type="date" required defaultValue={record?.spent_on ?? todayIso()} />
      <SelectField label="Category" name="category" defaultValue={record?.category ?? "software"} options={opts(EXPENSE_CATEGORIES)} />
      <SelectField label="For client" name="clientId" placeholder="General business" defaultValue={record?.client_id ?? clientId ?? ""} options={clientOptions(lookups.clients)} />
      <AreaField label="Notes" name="notes" rows={2} defaultValue={record?.notes} className="sm:col-span-2" />
    </RecordSheet>
  );
}

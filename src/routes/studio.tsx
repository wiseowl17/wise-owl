import { createFileRoute } from "@tanstack/react-router";
import { StudioGate } from "@/components/studio-gate";
import { StudioChrome, type StudioView } from "@/components/studio/chrome";
import { ClientDetailView, ClientsView } from "@/components/studio/views/clients";
import { InboxView } from "@/components/studio/views/inbox";
import { InvoiceDetailView, InvoicesView } from "@/components/studio/views/invoices";
import { ExpensesView, PaymentsView, ProjectsView } from "@/components/studio/views/ledger";
import { OverviewView } from "@/components/studio/views/overview";
import { TasksView } from "@/components/studio/views/tasks";

const VIEWS: StudioView[] = ["overview", "clients", "projects", "invoices", "payments", "tasks", "expenses", "inbox"];

type StudioSearch = { view?: StudioView; id?: number };

/**
 * The whole Studio is one route, with the view in the query string
 * (`/studio?view=clients&id=3`). The deployed site is static, so every
 * Studio URL loads the same prerendered page and the data comes from /api/studio.
 */
export const Route = createFileRoute("/studio")({
  validateSearch: (search: Record<string, unknown>): StudioSearch => {
    const view = VIEWS.includes(search.view as StudioView) ? (search.view as StudioView) : undefined;
    const id = Number(search.id);
    return {
      ...(view && view !== "overview" ? { view } : {}),
      ...(Number.isInteger(id) && id > 0 ? { id } : {}),
    };
  },
  component: StudioPage,
  head: () => ({
    meta: [
      { title: "Studio · Wise Owl" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function StudioPage() {
  const { view = "overview", id } = Route.useSearch();
  return (
    <StudioGate>
      <StudioChrome view={view}>
        <StudioBody view={view} id={id} />
      </StudioChrome>
    </StudioGate>
  );
}

function StudioBody({ view, id }: { view: StudioView; id?: number }) {
  switch (view) {
    case "clients":
      return id ? <ClientDetailView key={id} id={id} /> : <ClientsView />;
    case "projects":
      return <ProjectsView />;
    case "invoices":
      return id ? <InvoiceDetailView key={id} id={id} /> : <InvoicesView />;
    case "payments":
      return <PaymentsView />;
    case "tasks":
      return <TasksView />;
    case "expenses":
      return <ExpensesView />;
    case "inbox":
      return <InboxView />;
    default:
      return <OverviewView />;
  }
}

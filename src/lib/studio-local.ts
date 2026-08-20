import { currentMonth } from "@/lib/money";
import type {
  AddClientInput,
  AddSaleInput,
  AddTodoInput,
  ClientDetail,
  ClientStatus,
  ClientSummary,
  OnboardInput,
  Product,
  SetStatusInput,
  StudioOverview,
  UpdateClientInput,
} from "@/lib/studio";
import type { AgreementRow, SignAgreementInput } from "@/lib/agreements";

const KEY = "wise-owl-studio-v1";

export const CATALOG: Product[] = [
  {
    id: 1,
    name: "Onboarding, domain you own",
    kind: "setup",
    price_cents: 10000,
    description: "Paid first. Connect a domain you already own.",
  },
  {
    id: 2,
    name: "Onboarding, we find the domain",
    kind: "setup",
    price_cents: 25000,
    description: "Paid first. Shop for and connect a domain.",
  },
  {
    id: 3,
    name: "Landing page",
    kind: "landing",
    price_cents: 40000,
    description: "One simple page: contact, location, services.",
  },
  {
    id: 4,
    name: "Site, 3–5 pages",
    kind: "website",
    price_cents: 75000,
    description: "Booking, payments, and calendar sync.",
  },
  {
    id: 5,
    name: "Larger site, 5+ pages",
    kind: "website",
    price_cents: 120000,
    description: "Starting point. Final price depends on the project.",
  },
  {
    id: 6,
    name: "Monthly care, basic",
    kind: "maintenance",
    price_cents: 10000,
    description: "Edits, photos, and light upkeep.",
  },
  {
    id: 7,
    name: "Monthly care, backend",
    kind: "maintenance",
    price_cents: 25000,
    description: "Files, inventory, and backend upkeep.",
  },
];

type StoredClient = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  website: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
};

type StoredSale = {
  id: number;
  client_id: number;
  product_id: number;
  amount_cents: number;
  sold_on: string;
  notes: string | null;
};

type StoredTodo = {
  id: number;
  client_id: number;
  title: string;
  due_day: number;
  done_for_month: string | null;
};

type StoredOnboarding = {
  client_id: number;
  project_type: string;
  goals: string;
  audience: string | null;
  timeline: string | null;
  budget: string | null;
  extra: string | null;
};

type Book = {
  nextId: number;
  clients: StoredClient[];
  sales: StoredSale[];
  todos: StoredTodo[];
  onboardings: StoredOnboarding[];
  agreements: AgreementRow[];
};

function emptyBook(): Book {
  return {
    nextId: 1,
    clients: [],
    sales: [],
    todos: [],
    onboardings: [],
    agreements: [],
  };
}

function readBook(): Book {
  if (typeof window === "undefined") return emptyBook();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyBook();
    const parsed = JSON.parse(raw) as Book;
    if (!parsed || !Array.isArray(parsed.clients)) return emptyBook();
    return { ...emptyBook(), ...parsed };
  } catch {
    return emptyBook();
  }
}

function writeBook(book: Book) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(book));
}

function summarize(client: StoredClient, book: Book): ClientSummary {
  const month = currentMonth();
  const sales = book.sales.filter((row) => row.client_id === client.id);
  const products = new Set(sales.map((row) => row.product_id));
  const open = book.todos.filter(
    (row) => row.client_id === client.id && row.done_for_month !== month,
  ).length;
  return {
    ...client,
    total_cents: sales.reduce((sum, row) => sum + row.amount_cents, 0),
    product_count: products.size,
    open_todos: open,
  };
}

export function localGetStudio(): StudioOverview {
  const book = readBook();
  const clients = book.clients
    .map((client) => summarize(client, book))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return {
    month: currentMonth(),
    clients,
    products: CATALOG,
    totals: {
      client_count: clients.length,
      revenue_cents: clients.reduce((sum, row) => sum + row.total_cents, 0),
      open_todos: clients.reduce((sum, row) => sum + row.open_todos, 0),
    },
  };
}

export function localGetClient(id: number): ClientDetail {
  const book = readBook();
  const client = book.clients.find((row) => row.id === id);
  if (!client) throw new Error("That client is not in the book.");
  const month = currentMonth();
  const sales = book.sales
    .filter((row) => row.client_id === id)
    .sort((a, b) => b.sold_on.localeCompare(a.sold_on) || b.id - a.id)
    .map((row) => {
      const product = CATALOG.find((item) => item.id === row.product_id);
      return {
        id: row.id,
        product_id: row.product_id,
        product_name: product?.name ?? "Product",
        product_kind: product?.kind ?? "other",
        amount_cents: row.amount_cents,
        sold_on: row.sold_on,
        notes: row.notes,
      };
    });
  const todos = book.todos
    .filter((row) => row.client_id === id)
    .sort((a, b) => a.due_day - b.due_day || a.id - b.id)
    .map((row) => ({
      id: row.id,
      title: row.title,
      due_day: row.due_day,
      done_for_month: row.done_for_month,
      done: row.done_for_month === month,
    }));
  const onboarding =
    [...book.onboardings].reverse().find((row) => row.client_id === id) ?? null;
  return {
    client: summarize(client, book),
    sales,
    todos,
    products: CATALOG,
    onboarding,
  };
}

export function localAddClient(input: AddClientInput) {
  const book = readBook();
  const id = book.nextId++;
  book.clients.push({
    id,
    name: input.name,
    email: input.email,
    company: input.company || null,
    website: input.website || null,
    notes: input.notes || null,
    status: "active",
    created_at: new Date().toISOString(),
  });
  writeBook(book);
  return { id };
}

export function localUpdateClient(input: UpdateClientInput) {
  const book = readBook();
  const client = book.clients.find((row) => row.id === input.clientId);
  if (!client) throw new Error("That client is not in the book.");
  client.name = input.name;
  client.email = input.email;
  client.company = input.company || null;
  client.website = input.website || null;
  client.notes = input.notes || null;
  writeBook(book);
  return { ok: true as const };
}

export function localDeleteClient(clientId: number) {
  const book = readBook();
  book.clients = book.clients.filter((row) => row.id !== clientId);
  book.sales = book.sales.filter((row) => row.client_id !== clientId);
  book.todos = book.todos.filter((row) => row.client_id !== clientId);
  book.onboardings = book.onboardings.filter((row) => row.client_id !== clientId);
  writeBook(book);
  return { ok: true as const };
}

export function localAddSale(input: AddSaleInput & { amountCents: number }) {
  const book = readBook();
  if (!book.clients.some((row) => row.id === input.clientId)) {
    throw new Error("That client is not in the book.");
  }
  book.sales.push({
    id: book.nextId++,
    client_id: input.clientId,
    product_id: input.productId,
    amount_cents: input.amountCents,
    sold_on: input.soldOn,
    notes: input.notes || null,
  });
  writeBook(book);
  return { ok: true as const };
}

export function localAddTodo(input: AddTodoInput) {
  const book = readBook();
  if (!book.clients.some((row) => row.id === input.clientId)) {
    throw new Error("That client is not in the book.");
  }
  book.todos.push({
    id: book.nextId++,
    client_id: input.clientId,
    title: input.title,
    due_day: input.dueDay,
    done_for_month: null,
  });
  writeBook(book);
  return { ok: true as const };
}

export function localToggleTodo(input: { id: number; clientId: number }) {
  const book = readBook();
  const todo = book.todos.find(
    (row) => row.id === input.id && row.client_id === input.clientId,
  );
  if (!todo) throw new Error("Missing task.");
  const month = currentMonth();
  todo.done_for_month = todo.done_for_month === month ? null : month;
  writeBook(book);
  return { ok: true as const };
}

export function localSetStatus(input: SetStatusInput) {
  const book = readBook();
  const client = book.clients.find((row) => row.id === input.clientId);
  if (!client) throw new Error("That client is not in the book.");
  client.status = input.status;
  writeBook(book);
  return { ok: true as const };
}

export function localSubmitOnboarding(input: OnboardInput) {
  const created = localAddClient({
    name: input.name,
    email: input.email,
    company: input.company,
    website: input.website,
  });
  const book = readBook();
  const client = book.clients.find((row) => row.id === created.id);
  if (client) client.status = "onboarding";
  book.onboardings.push({
    client_id: created.id,
    project_type: input.projectType,
    goals: input.goals,
    audience: input.audience || null,
    timeline: input.timeline || null,
    budget: input.budget || null,
    extra: input.extra || null,
  });
  if (input.projectType === "Monthly care") {
    book.todos.push(
      {
        id: book.nextId++,
        client_id: created.id,
        title: "Review uptime and SSL",
        due_day: 1,
        done_for_month: null,
      },
      {
        id: book.nextId++,
        client_id: created.id,
        title: "Apply updates",
        due_day: 5,
        done_for_month: null,
      },
      {
        id: book.nextId++,
        client_id: created.id,
        title: "Backup and check forms",
        due_day: 12,
        done_for_month: null,
      },
    );
  }
  writeBook(book);
  return { ok: true as const };
}

export function localListAgreements(): AgreementRow[] {
  return [...readBook().agreements].sort((a, b) =>
    b.signed_at.localeCompare(a.signed_at),
  );
}

export function localSignAgreement(input: SignAgreementInput) {
  const book = readBook();
  book.agreements.unshift({
    id: book.nextId++,
    name: input.name,
    email: input.email,
    company: input.company || null,
    project: input.project,
    signature: input.signature,
    signed_at: new Date().toISOString(),
  });
  writeBook(book);
  return { ok: true as const };
}

export function localDeleteAgreement(id: number) {
  const book = readBook();
  const before = book.agreements.length;
  book.agreements = book.agreements.filter((row) => row.id !== id);
  if (book.agreements.length === before) {
    throw new Error("That agreement is not in the book.");
  }
  writeBook(book);
  return { ok: true as const };
}

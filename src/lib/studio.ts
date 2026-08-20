import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { currentMonth } from "@/lib/money";

export type ClientStatus = "onboarding" | "active" | "paused" | "completed";

export type Product = {
  id: number;
  name: string;
  kind: string;
  price_cents: number;
  description: string | null;
};

export type ClientSummary = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  website: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  total_cents: number;
  product_count: number;
  open_todos: number;
};

export type SaleRow = {
  id: number;
  product_id: number;
  product_name: string;
  product_kind: string;
  amount_cents: number;
  sold_on: string;
  notes: string | null;
};

export type TodoRow = {
  id: number;
  title: string;
  due_day: number;
  done_for_month: string | null;
  done: boolean;
};

export type OnboardingRow = {
  project_type: string;
  goals: string;
  audience: string | null;
  timeline: string | null;
  budget: string | null;
  extra: string | null;
};

export type ClientDetail = {
  client: ClientSummary;
  sales: SaleRow[];
  todos: TodoRow[];
  products: Product[];
  onboarding: OnboardingRow | null;
};

export type StudioOverview = {
  month: string;
  clients: ClientSummary[];
  products: Product[];
  totals: {
    client_count: number;
    revenue_cents: number;
    open_todos: number;
  };
};

export type OnboardInput = {
  name: string;
  email: string;
  company?: string;
  website?: string;
  projectType: string;
  goals: string;
  audience?: string;
  timeline?: string;
  budget?: string;
  extra?: string;
};

export type AddClientInput = {
  name: string;
  email: string;
  company?: string;
  website?: string;
  notes?: string;
};

export type UpdateClientInput = {
  clientId: number;
  name: string;
  email: string;
  company?: string;
  website?: string;
  notes?: string;
};

export type AddSaleInput = {
  clientId: number;
  productId: number;
  amountDollars: number;
  soldOn: string;
  notes?: string;
};

export type AddTodoInput = {
  clientId: number;
  title: string;
  dueDay: number;
};

export type SetStatusInput = {
  clientId: number;
  status: ClientStatus;
};

const STUDIO_USER = "studio";

const STATUSES = new Set<ClientStatus>([
  "onboarding",
  "active",
  "paused",
  "completed",
]);

function asStatus(value: string): ClientStatus {
  return STATUSES.has(value as ClientStatus)
    ? (value as ClientStatus)
    : "onboarding";
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function assertClient(clientId: number) {
  const sql = await getSql();
  const [row] = await sql<{ id: number }>`
    select id from clients where id = ${clientId}
  `;
  if (!row) throw new Error("That client is not in the book.");
}

const clientSelect = `
  c.id,
  c.name,
  c.email,
  c.company,
  c.website,
  c.status,
  c.notes,
  c.created_at::text as created_at,
  coalesce(sum(s.amount_cents), 0)::int as total_cents,
  count(distinct s.product_id)::int as product_count
`;

async function loadClients() {
  const sql = await getSql();
  const month = currentMonth();
  const clients = await sql.query<
    Omit<ClientSummary, "open_todos" | "status"> & {
      status: string;
      open_todos: number;
    }
  >(
    `select
        ${clientSelect},
        (
          select count(*)::int
          from maintenance_todos t
          where t.client_id = c.id
            and t.done_for_month is distinct from $1
        ) as open_todos
      from clients c
      left join sales s on s.client_id = c.id
      group by c.id
      order by c.created_at desc`,
    [month],
  );

  return clients.map((row) => ({
    ...row,
    status: asStatus(row.status),
  }));
}

export const getStudio = createServerFn({ method: "GET" }).handler(
  async (): Promise<StudioOverview> => {
    const sql = await getSql();
    const clients = await loadClients();
    const products = await sql<Product>`
      select id, name, kind, price_cents, description
      from products
      order by price_cents desc
    `;
    return {
      month: currentMonth(),
      clients,
      products,
      totals: {
        client_count: clients.length,
        revenue_cents: clients.reduce((sum, c) => sum + c.total_cents, 0),
        open_todos: clients.reduce((sum, c) => sum + c.open_todos, 0),
      },
    };
  },
);

export const getClient = createServerFn({ method: "GET" })
  .validator((id: number) => {
    if (!Number.isFinite(id) || id < 1) throw new Error("Missing client.");
    return id;
  })
  .handler(async ({ data: id }): Promise<ClientDetail> => {
    const sql = await getSql();
    const month = currentMonth();
    const clients = await loadClients();
    const client = clients.find((row) => row.id === id);
    if (!client) throw new Error("That client is not in the book.");

    const sales = await sql<SaleRow>`
      select
        s.id,
        s.product_id,
        p.name as product_name,
        p.kind as product_kind,
        s.amount_cents,
        s.sold_on::text as sold_on,
        s.notes
      from sales s
      join products p on p.id = s.product_id
      where s.client_id = ${id}
      order by s.sold_on desc, s.id desc
    `;

    const todos = await sql<Omit<TodoRow, "done">>`
      select id, title, due_day, done_for_month
      from maintenance_todos
      where client_id = ${id}
      order by due_day, id
    `;

    const products = await sql<Product>`
      select id, name, kind, price_cents, description
      from products
      order by price_cents desc
    `;

    const [onboarding] = await sql<OnboardingRow>`
      select project_type, goals, audience, timeline, budget, extra
      from onboardings
      where client_id = ${id}
      order by id desc
      limit 1
    `;

    return {
      client,
      sales,
      products,
      onboarding: onboarding ?? null,
      todos: todos.map((todo) => ({
        ...todo,
        done: todo.done_for_month === month,
      })),
    };
  });

export const submitOnboarding = createServerFn({ method: "POST" })
  .validator((input: OnboardInput) => {
    const name = cleanText(input.name);
    const email = cleanText(input.email).toLowerCase();
    const company = cleanText(input.company);
    const website = cleanText(input.website);
    const projectType = cleanText(input.projectType);
    const goals = cleanText(input.goals);
    const audience = cleanText(input.audience);
    const timeline = cleanText(input.timeline);
    const budget = cleanText(input.budget);
    const extra = cleanText(input.extra);

    if (name.length < 2) throw new Error("Please add your name.");
    if (!validEmail(email)) throw new Error("Please add a valid email.");
    if (!projectType) throw new Error("Choose a project type.");
    if (goals.length < 12) {
      throw new Error("Tell me a little more about the goal.");
    }

    return {
      name,
      email,
      company,
      website,
      projectType,
      goals,
      audience,
      timeline,
      budget,
      extra,
    };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const [client] = await sql<{ id: number }>`
      insert into clients (name, email, company, website, status, user_id)
      values (
        ${data.name},
        ${data.email},
        ${data.company || null},
        ${data.website || null},
        'onboarding',
        ${STUDIO_USER}
      )
      returning id
    `;
    if (!client) throw new Error("Could not save the brief.");

    await sql`
      insert into onboardings (
        client_id, project_type, goals, audience, timeline, budget, extra
      )
      values (
        ${client.id},
        ${data.projectType},
        ${data.goals},
        ${data.audience || null},
        ${data.timeline || null},
        ${data.budget || null},
        ${data.extra || null}
      )
    `;

    if (data.projectType === "Monthly care") {
      await sql`
        insert into maintenance_todos (client_id, title, due_day)
        values
          (${client.id}, 'Review uptime and SSL', 1),
          (${client.id}, 'Apply updates', 5),
          (${client.id}, 'Backup and check forms', 12)
      `;
    }

    return { ok: true as const };
  });

export const addClient = createServerFn({ method: "POST" })
  .validator((input: AddClientInput) => {
    const name = cleanText(input.name);
    const email = cleanText(input.email).toLowerCase();
    const company = cleanText(input.company);
    const website = cleanText(input.website);
    const notes = cleanText(input.notes);
    if (name.length < 2) throw new Error("Add a name.");
    if (!validEmail(email)) throw new Error("Add a valid email.");
    return { name, email, company, website, notes };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const [row] = await sql<{ id: number }>`
      insert into clients (name, email, company, website, notes, status, user_id)
      values (
        ${data.name},
        ${data.email},
        ${data.company || null},
        ${data.website || null},
        ${data.notes || null},
        'active',
        ${STUDIO_USER}
      )
      returning id
    `;
    if (!row) throw new Error("Could not add the client.");
    return { id: row.id };
  });

export const updateClient = createServerFn({ method: "POST" })
  .validator((input: UpdateClientInput) => {
    const name = cleanText(input.name);
    const email = cleanText(input.email).toLowerCase();
    const company = cleanText(input.company);
    const website = cleanText(input.website);
    const notes = cleanText(input.notes);
    if (!Number.isFinite(input.clientId)) throw new Error("Missing client.");
    if (name.length < 2) throw new Error("Add a name.");
    if (!validEmail(email)) throw new Error("Add a valid email.");
    return {
      clientId: input.clientId,
      name,
      email,
      company,
      website,
      notes,
    };
  })
  .handler(async ({ data }) => {
    await assertClient(data.clientId);
    const sql = await getSql();
    await sql`
      update clients
      set
        name = ${data.name},
        email = ${data.email},
        company = ${data.company || null},
        website = ${data.website || null},
        notes = ${data.notes || null}
      where id = ${data.clientId}
    `;
    return { ok: true as const };
  });

export const deleteClient = createServerFn({ method: "POST" })
  .validator((clientId: number) => {
    if (!Number.isFinite(clientId)) throw new Error("Missing client.");
    return clientId;
  })
  .handler(async ({ data: clientId }) => {
    await assertClient(clientId);
    const sql = await getSql();
    await sql`delete from clients where id = ${clientId}`;
    return { ok: true as const };
  });

export const addSale = createServerFn({ method: "POST" })
  .validator((input: AddSaleInput) => {
    if (!Number.isFinite(input.clientId)) throw new Error("Missing client.");
    if (!Number.isFinite(input.productId)) throw new Error("Choose a product.");
    if (!Number.isFinite(input.amountDollars) || input.amountDollars < 0) {
      throw new Error("Add a sale amount.");
    }
    const soldOn = cleanText(input.soldOn);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(soldOn)) {
      throw new Error("Add a sale date.");
    }
    return {
      clientId: input.clientId,
      productId: input.productId,
      amountCents: Math.round(input.amountDollars * 100),
      soldOn,
      notes: cleanText(input.notes),
    };
  })
  .handler(async ({ data }) => {
    await assertClient(data.clientId);
    const sql = await getSql();
    await sql`
      insert into sales (client_id, product_id, amount_cents, sold_on, notes)
      values (
        ${data.clientId},
        ${data.productId},
        ${data.amountCents},
        ${data.soldOn}::date,
        ${data.notes || null}
      )
    `;
    return { ok: true as const };
  });

export const addTodo = createServerFn({ method: "POST" })
  .validator((input: AddTodoInput) => {
    const title = cleanText(input.title);
    const dueDay = Number(input.dueDay);
    if (!Number.isFinite(input.clientId)) throw new Error("Missing client.");
    if (title.length < 2) throw new Error("Add a task.");
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
      throw new Error("Due day must be between 1 and 28.");
    }
    return { clientId: input.clientId, title, dueDay };
  })
  .handler(async ({ data }) => {
    await assertClient(data.clientId);
    const sql = await getSql();
    await sql`
      insert into maintenance_todos (client_id, title, due_day)
      values (${data.clientId}, ${data.title}, ${data.dueDay})
    `;
    return { ok: true as const };
  });

export const toggleTodo = createServerFn({ method: "POST" })
  .validator((input: { id: number; clientId: number }) => {
    if (!Number.isFinite(input.id) || !Number.isFinite(input.clientId)) {
      throw new Error("Missing task.");
    }
    return input;
  })
  .handler(async ({ data }) => {
    await assertClient(data.clientId);
    const sql = await getSql();
    const month = currentMonth();
    await sql`
      update maintenance_todos
      set done_for_month = case
        when done_for_month is not distinct from ${month} then null
        else ${month}
      end
      where id = ${data.id} and client_id = ${data.clientId}
    `;
    return { ok: true as const };
  });

export const setClientStatus = createServerFn({ method: "POST" })
  .validator((input: SetStatusInput) => {
    if (!Number.isFinite(input.clientId)) throw new Error("Missing client.");
    if (!STATUSES.has(input.status)) throw new Error("Pick a status.");
    return input;
  })
  .handler(async ({ data }) => {
    await assertClient(data.clientId);
    const sql = await getSql();
    await sql`
      update clients
      set status = ${data.status}
      where id = ${data.clientId}
    `;
    return { ok: true as const };
  });

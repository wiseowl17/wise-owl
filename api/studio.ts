/**
 * Wise Owl studio API. One Vercel function: POST /api/studio { action, data }.
 *
 * Public actions: session, login, logout, submitInquiry, submitOnboarding,
 * signAgreement. Everything else needs the signed, HttpOnly session cookie.
 *
 * Env: DATABASE_URL (Neon), SESSION_SECRET (random, 32+ chars),
 * optional STUDIO_EMAIL / STUDIO_PASSWORD_HASH (sha256 hex of `email\npassword`).
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import pg from "pg";

const TZ = "America/New_York";
const COOKIE = "wo_session";
const SESSION_DAYS = 30;
const MAX_FAILS = 8;
const FAIL_WINDOW_MIN = 15;
const DEFAULT_EMAIL = "mlcruz9804@gmail.com";
const DEFAULT_HASH =
  "393b176d93f2254c596c6d855cdf3c07a75d5a04dcccb3144099ec3d58e36aae";

/* ------------------------------------------------------------------ db */

pg.types.setTypeParser(20, Number); // int8 ids and counts
pg.types.setTypeParser(1700, Number); // numeric sums
pg.types.setTypeParser(1082, (v: string) => v); // date stays YYYY-MM-DD

const globalRef = globalThis as typeof globalThis & { __woPool?: pg.Pool };

function pool() {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new HttpError(503, "The studio database is not connected.");
  globalRef.__woPool ??= new pg.Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10_000,
  });
  return globalRef.__woPool;
}

async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []) {
  const result = await pool().query(text, params);
  return result.rows as T[];
}

async function one<T = Record<string, unknown>>(text: string, params: unknown[] = []) {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

/* -------------------------------------------------------------- errors */

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function fail(message: string, status = 400): never {
  throw new HttpError(status, message);
}

/* ------------------------------------------------------------- session */

function secret() {
  const value = process.env["SESSION_SECRET"];
  if (!value || value.length < 32) {
    throw new HttpError(503, "SESSION_SECRET is missing or too short.");
  }
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

function sessionEmail(request: Request) {
  const raw = readCookie(request, COOKIE);
  if (!raw) return null;
  const [body, mac] = raw.split(".");
  if (!body || !mac || !safeEqual(sign(body), mac)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      e: string;
      x: number;
    };
    if (typeof payload.x !== "number" || payload.x < Date.now()) return null;
    return payload.e;
  } catch {
    return null;
  }
}

function isSecure(request: Request) {
  const proto = request.headers.get("x-forwarded-proto");
  return proto ? proto === "https" : new URL(request.url).protocol === "https:";
}

function sessionCookie(request: Request, email: string) {
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  const body = Buffer.from(JSON.stringify({ e: email, x: expires })).toString(
    "base64url",
  );
  return [
    `${COOKIE}=${body}.${sign(body)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_DAYS * 86_400}`,
    isSecure(request) ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function clearCookie(request: Request) {
  return [
    `${COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    isSecure(request) ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function clientIp(request: Request) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

async function login(request: Request, data: Record<string, unknown>) {
  const ip = clientIp(request);
  const recent = await one<{ n: number }>(
    `select count(*)::int as n from login_attempts
     where ip = $1 and created_at > now() - make_interval(mins => $2::int)`,
    [ip, FAIL_WINDOW_MIN],
  );
  if ((recent?.n ?? 0) >= MAX_FAILS) {
    fail("Too many tries. Wait 15 minutes and try again.", 429);
  }

  const ownerEmail = (process.env["STUDIO_EMAIL"] || DEFAULT_EMAIL).toLowerCase();
  const ownerHash = (process.env["STUDIO_PASSWORD_HASH"] || DEFAULT_HASH).toLowerCase();
  const email = str(data.email).toLowerCase();
  const password = String(data.password ?? "");
  const hash = createHash("sha256").update(`${email}\n${password}`).digest("hex");

  if (email !== ownerEmail || !safeEqual(hash, ownerHash)) {
    await q("insert into login_attempts (ip) values ($1)", [ip]);
    await q("delete from login_attempts where created_at < now() - interval '1 day'");
    fail("Email or password is wrong.", 401);
  }
  await q("delete from login_attempts where ip = $1", [ip]);
  return { email: ownerEmail, cookie: sessionCookie(request, ownerEmail) };
}

/* ---------------------------------------------------------- validation */

function str(value: unknown, max = 5000) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function opt(value: unknown, max = 5000) {
  const text = str(value, max);
  return text === "" ? null : text;
}

function need(value: unknown, label: string, max = 5000) {
  const text = str(value, max);
  if (!text) fail(`${label} is required.`);
  return text;
}

function id(value: unknown, label = "id") {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) fail(`Missing ${label}.`);
  return n;
}

function optId(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return id(value);
}

function cents(value: unknown, label: string, allowNegative = false) {
  const n = Math.round(Number(value) * 100);
  if (!Number.isFinite(n)) fail(`${label} must be a number.`);
  if (!allowNegative && n < 0) fail(`${label} can't be negative.`);
  return n;
}

function date(value: unknown) {
  const text = str(value, 10);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) fail("Dates must look like 2026-09-22.");
  return text;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  const text = str(value) as T;
  return allowed.includes(text) ? text : fallback;
}

function day(value: unknown) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 31) fail("Day must be 1 to 31.");
  return n;
}

const CLIENT_STATUS = ["lead", "onboarding", "active", "paused", "completed", "archived"] as const;
const PROJECT_KIND = ["landing", "site", "large_site", "redesign", "care", "other"] as const;
const PROJECT_STATUS = ["proposal", "in_progress", "review", "launched", "on_hold", "cancelled"] as const;
const CARE_PLAN = ["basic", "backend", "custom"] as const;
const PAY_KIND = ["onboarding", "deposit", "project", "final", "care", "refund", "other"] as const;
const PAY_METHOD = ["card", "cash", "check", "zelle", "venmo", "cashapp", "paypal", "bank", "other"] as const;
const PAY_STATUS = ["paid", "pending"] as const;
const PRIORITY = ["low", "normal", "high"] as const;
const EXPENSE_CAT = ["hosting", "domain", "software", "contractor", "equipment", "marketing", "other"] as const;

/* --------------------------------------------------------- generic CRUD */

type Row = Record<string, unknown>;

async function save(table: string, values: Row, rowId: number | null) {
  const keys = Object.keys(values);
  const params = keys.map((key) => values[key]);
  if (rowId) {
    const sets = keys.map((key, i) => `${key} = $${i + 1}`);
    if (["clients", "projects"].includes(table)) sets.push("updated_at = now()");
    const row = await one(
      `update ${table} set ${sets.join(", ")} where id = $${keys.length + 1} returning *`,
      [...params, rowId],
    );
    if (!row) fail("That record no longer exists.", 404);
    return row;
  }
  const marks = keys.map((_, i) => `$${i + 1}`);
  return one(
    `insert into ${table} (${keys.join(", ")}) values (${marks.join(", ")}) returning *`,
    params,
  );
}

async function remove(table: string, rowId: number) {
  await q(`delete from ${table} where id = $1`, [rowId]);
  return { ok: true };
}

/* -------------------------------------------------------------- reads */

const MONTH_SQL = `to_char(now() at time zone '${TZ}', 'YYYY-MM')`;
const TODAY_SQL = `(now() at time zone '${TZ}')::date`;

const PROJECT_SELECT = `
  select p.*, c.name as client_name, c.company as client_company,
    coalesce(pay.paid_cents, 0) as paid_cents,
    greatest(p.price_cents - coalesce(pay.paid_cents, 0), 0) as balance_cents,
    coalesce(t.open_tasks, 0) as open_tasks
  from projects p
  join clients c on c.id = p.client_id
  left join (
    select project_id, sum(amount_cents) as paid_cents
    from payments where status = 'paid' and kind not in ('care', 'onboarding') group by project_id
  ) pay on pay.project_id = p.id
  left join (
    select project_id, count(*) as open_tasks from tasks
    where done_at is null and repeat = 'none' group by project_id
  ) t on t.project_id = p.id`;

const TASK_SELECT = `
  select t.*, c.name as client_name, c.company as client_company, p.name as project_name,
    case when t.repeat = 'monthly' then t.done_for_month = ${MONTH_SQL}
         else t.done_at is not null end as done,
    case when t.repeat = 'monthly'
         then make_date(extract(year from ${TODAY_SQL})::int, extract(month from ${TODAY_SQL})::int,
              least(t.due_day, extract(day from (date_trunc('month', ${TODAY_SQL}) + interval '1 month - 1 day'))::int))
         else t.due_on end as next_due
  from tasks t
  left join clients c on c.id = t.client_id
  left join projects p on p.id = t.project_id`;

const PAYMENT_SELECT = `
  select pay.*, c.name as client_name, c.company as client_company, p.name as project_name
  from payments pay
  join clients c on c.id = pay.client_id
  left join projects p on p.id = pay.project_id`;

async function dashboard() {
  const [money, counts, monthly, dueTasks, recentPayments, openProjects, inbox] =
    await Promise.all([
      one(`
        select
          coalesce(sum(amount_cents) filter (where status = 'paid'
            and to_char(paid_on, 'YYYY-MM') = ${MONTH_SQL}), 0) as month_cents,
          coalesce(sum(amount_cents) filter (where status = 'paid'
            and extract(year from paid_on) = extract(year from ${TODAY_SQL})), 0) as year_cents,
          coalesce(sum(amount_cents) filter (where status = 'pending'), 0) as pending_cents,
          (select coalesce(sum(amount_cents), 0) from expenses
            where extract(year from spent_on) = extract(year from ${TODAY_SQL})) as year_expense_cents,
          (select coalesce(sum(amount_cents), 0) from care_plans
            where ended_on is null or ended_on > ${TODAY_SQL}) as mrr_cents,
          (select coalesce(sum(greatest(p.price_cents - coalesce(x.paid, 0), 0)), 0)
            from projects p left join (
              select project_id, sum(amount_cents) as paid from payments
              where status = 'paid' and kind not in ('care', 'onboarding') group by project_id
            ) x on x.project_id = p.id
            where p.status not in ('cancelled')) as outstanding_cents
        from payments`),
      one(`
        select
          count(*) filter (where status = 'active') as active_clients,
          count(*) filter (where status in ('lead', 'onboarding')) as pipeline_clients,
          count(*) filter (where status <> 'archived') as total_clients,
          (select count(*) from projects where status in ('in_progress', 'review')) as active_projects
        from clients`),
      q(`
        select to_char(m, 'YYYY-MM') as month,
          coalesce((select sum(amount_cents) from payments
            where status = 'paid' and date_trunc('month', paid_on) = m), 0) as income_cents,
          coalesce((select sum(amount_cents) from expenses
            where date_trunc('month', spent_on) = m), 0) as expense_cents
        from generate_series(date_trunc('month', ${TODAY_SQL}) - interval '11 months',
                             date_trunc('month', ${TODAY_SQL}), interval '1 month') as m
        order by m`),
      q(`select * from (${TASK_SELECT}) x
         where not done and (next_due is null or next_due <= ${TODAY_SQL} + 7)
         order by next_due nulls last, case priority when 'high' then 0 when 'normal' then 1 else 2 end, id limit 12`),
      q(`${PAYMENT_SELECT} order by pay.paid_on desc, pay.id desc limit 6`),
      q(`${PROJECT_SELECT} where p.status in ('proposal', 'in_progress', 'review', 'on_hold')
         order by p.due_on nulls last, p.id desc limit 8`),
      one(`
        select
          (select count(*) from inquiries where not handled) as inquiries,
          (select count(*) from onboardings where created_at > now() - interval '30 days') as onboardings,
          (select count(*) from agreements where signed_at > now() - interval '30 days') as agreements`),
    ]);
  const today = await one<{ today: string; month: string }>(
    `select ${TODAY_SQL}::text as today, ${MONTH_SQL} as month`,
  );
  return {
    ...today,
    money,
    counts,
    monthly,
    dueTasks,
    recentPayments,
    openProjects,
    inbox,
  };
}

async function listClients() {
  return q(`
    select c.*,
      coalesce(pay.paid_cents, 0) as paid_cents,
      coalesce(pr.project_count, 0) as project_count,
      coalesce(t.open_tasks, 0) as open_tasks,
      coalesce(cp.mrr_cents, 0) as mrr_cents
    from clients c
    left join (select client_id, sum(amount_cents) as paid_cents from payments
               where status = 'paid' group by client_id) pay on pay.client_id = c.id
    left join (select client_id, count(*) as project_count from projects
               group by client_id) pr on pr.client_id = c.id
    left join (select client_id, count(*) as open_tasks from (${TASK_SELECT}) x
               where not done group by client_id) t on t.client_id = c.id
    left join (select client_id, sum(amount_cents) as mrr_cents from care_plans
               where ended_on is null or ended_on > ${TODAY_SQL}
               group by client_id) cp on cp.client_id = c.id
    order by case c.status when 'active' then 0 when 'onboarding' then 1 when 'lead' then 2
      when 'paused' then 3 when 'completed' then 4 else 5 end, lower(coalesce(c.company, c.name))`);
}

async function getClient(clientId: number) {
  const client = await one("select * from clients where id = $1", [clientId]);
  if (!client) fail("That client is not in the book.", 404);
  const [projects, payments, tasks, notes, carePlans, onboardings, agreements, expenses] =
    await Promise.all([
      q(`${PROJECT_SELECT} where p.client_id = $1 order by p.created_at desc`, [clientId]),
      q(`${PAYMENT_SELECT} where pay.client_id = $1 order by pay.paid_on desc, pay.id desc`, [clientId]),
      q(`${TASK_SELECT} where t.client_id = $1 order by done, next_due nulls last, t.id`, [clientId]),
      q("select * from notes where client_id = $1 order by created_at desc", [clientId]),
      q("select * from care_plans where client_id = $1 order by started_on desc", [clientId]),
      q("select * from onboardings where client_id = $1 order by created_at desc", [clientId]),
      q("select * from agreements where client_id = $1 order by signed_at desc", [clientId]),
      q("select * from expenses where client_id = $1 order by spent_on desc", [clientId]),
    ]);
  return { client, projects, payments, tasks, notes, carePlans, onboardings, agreements, expenses };
}

async function inbox() {
  const [inquiries, onboardings, agreements] = await Promise.all([
    q("select * from inquiries order by handled, created_at desc limit 200"),
    q(`select o.*, c.name as client_name from onboardings o
       left join clients c on c.id = o.client_id order by o.created_at desc limit 200`),
    q(`select a.*, c.name as client_name from agreements a
       left join clients c on c.id = a.client_id order by a.signed_at desc limit 200`),
  ]);
  return { inquiries, onboardings, agreements };
}

/* ---------------------------------------------------- public submissions */

/** Find a client by email, or create one at the given status. Leads move up to onboarding. */
async function upsertClientByEmail(
  input: { name: string; email: string; company: string | null; website?: string | null },
  status: "lead" | "onboarding",
  source: string,
) {
  const existing = await one<{ id: number; status: string }>(
    "select id, status from clients where lower(email) = lower($1) order by id limit 1",
    [input.email],
  );
  if (existing) {
    if (existing.status === "lead" && status === "onboarding") {
      await q("update clients set status = 'onboarding', updated_at = now() where id = $1", [existing.id]);
    }
    return existing.id;
  }
  const row = await one<{ id: number }>(
    `insert into clients (name, email, company, website, status, source)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [input.name, input.email, input.company, input.website ?? null, status, source],
  );
  return row!.id;
}

function email(value: unknown) {
  const text = need(value, "Email", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) fail("That email doesn't look right.");
  return text;
}

function spam(data: Row) {
  // Hidden honeypot field. People never fill it; bots usually do.
  return str(data.fax) !== "";
}

async function submitInquiry(data: Row) {
  if (spam(data)) return { ok: true };
  await q(
    `insert into inquiries (name, email, company, project_type, message)
     values ($1, $2, $3, $4, $5)`,
    [need(data.name, "Name", 200), email(data.email), opt(data.company, 200),
     opt(data.projectType, 100), need(data.message, "Message", 5000)],
  );
  return { ok: true };
}

async function submitOnboarding(data: Row) {
  if (spam(data)) return { ok: true };
  const name = need(data.name, "Name", 200);
  const mail = email(data.email);
  const company = opt(data.company, 200);
  const website = opt(data.website, 500);
  const clientId = await upsertClientByEmail({ name, email: mail, company, website }, "onboarding", "onboarding brief");
  await q(
    `insert into onboardings (client_id, name, email, company, website, project_type,
       goals, audience, timeline, budget, extra)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [clientId, name, mail, company, website, need(data.projectType, "Project type", 200),
     need(data.goals, "Goals", 5000), opt(data.audience), opt(data.timeline, 500),
     opt(data.budget, 200), opt(data.extra)],
  );
  return { ok: true };
}

async function signAgreement(data: Row) {
  if (spam(data)) return { ok: true };
  const name = need(data.name, "Name", 200);
  const mail = email(data.email);
  const company = opt(data.company, 200);
  const signature = need(data.signature, "Signature", 200);
  if (signature.toLowerCase().replace(/\s+/g, " ") !== name.toLowerCase().replace(/\s+/g, " ")) {
    fail("Type your full name exactly as above to sign.");
  }
  const clientId = await upsertClientByEmail({ name, email: mail, company }, "onboarding", "rates agreement");
  const row = await one(
    `insert into agreements (client_id, name, email, company, project, signature)
     values ($1, $2, $3, $4, $5, $6) returning *`,
    [clientId, name, mail, company, need(data.project, "Project", 300), signature],
  );
  return row;
}

/* ------------------------------------------------------ private actions */

type Handler = (data: Row) => Promise<unknown>;

const privateActions: Record<string, Handler> = {
  dashboard: () => dashboard(),

  listClients: () => listClients(),
  getClient: (d) => getClient(id(d.id)),
  saveClient: (d) =>
    save("clients", {
      name: need(d.name, "Name", 200),
      email: opt(d.email, 320),
      phone: opt(d.phone, 50),
      company: opt(d.company, 200),
      website: opt(d.website, 500),
      address: opt(d.address, 500),
      status: oneOf(d.status, CLIENT_STATUS, "lead"),
      source: opt(d.source, 200),
      notes: opt(d.notes),
    }, optId(d.id)),
  deleteClient: (d) => remove("clients", id(d.id)),

  listProjects: () => q(`${PROJECT_SELECT} order by
    case p.status when 'in_progress' then 0 when 'review' then 1 when 'proposal' then 2
      when 'on_hold' then 3 when 'launched' then 4 else 5 end, p.due_on nulls last, p.id desc`),
  saveProject: (d) =>
    save("projects", {
      client_id: id(d.clientId, "client"),
      name: need(d.name, "Project name", 200),
      kind: oneOf(d.kind, PROJECT_KIND, "site"),
      status: oneOf(d.status, PROJECT_STATUS, "proposal"),
      scope: opt(d.scope, 20000),
      price_cents: cents(d.price ?? 0, "Price"),
      domain: opt(d.domain, 300),
      site_url: opt(d.siteUrl, 500),
      links: opt(d.links, 5000),
      start_on: date(d.startOn),
      due_on: date(d.dueOn),
      launched_on: date(d.launchedOn),
    }, optId(d.id)),
  deleteProject: (d) => remove("projects", id(d.id)),

  listPayments: () => q(`${PAYMENT_SELECT} order by pay.paid_on desc, pay.id desc limit 500`),
  savePayment: (d) => {
    const kind = oneOf(d.kind, PAY_KIND, "project");
    let amount = cents(d.amount, "Amount", true);
    if (kind === "refund" && amount > 0) amount = -amount;
    return save("payments", {
      client_id: id(d.clientId, "client"),
      project_id: optId(d.projectId),
      amount_cents: amount,
      kind,
      method: oneOf(d.method, PAY_METHOD, "card"),
      status: oneOf(d.status, PAY_STATUS, "paid"),
      paid_on: date(d.paidOn) ?? new Date().toISOString().slice(0, 10),
      notes: opt(d.notes),
    }, optId(d.id));
  },
  deletePayment: (d) => remove("payments", id(d.id)),

  listTasks: () => q(`select * from (${TASK_SELECT}) x order by done, next_due nulls last,
    case priority when 'high' then 0 when 'normal' then 1 else 2 end, id`),
  saveTask: (d) => {
    const repeat = oneOf(d.repeat, ["none", "monthly"] as const, "none");
    return save("tasks", {
      client_id: optId(d.clientId),
      project_id: optId(d.projectId),
      title: need(d.title, "Task", 300),
      notes: opt(d.notes),
      priority: oneOf(d.priority, PRIORITY, "normal"),
      repeat,
      due_on: repeat === "none" ? date(d.dueOn) : null,
      due_day: repeat === "monthly" ? day(d.dueDay ?? 1) : null,
    }, optId(d.id));
  },
  toggleTask: async (d) => {
    const task = await one<{ id: number; repeat: string }>("select id, repeat from tasks where id = $1", [id(d.id)]);
    if (!task) fail("That task no longer exists.", 404);
    if (task.repeat === "monthly") {
      return one(
        `update tasks set done_for_month = case when done_for_month = ${MONTH_SQL}
           then null else ${MONTH_SQL} end where id = $1 returning *`,
        [task.id],
      );
    }
    return one(
      "update tasks set done_at = case when done_at is null then now() else null end where id = $1 returning *",
      [task.id],
    );
  },
  deleteTask: (d) => remove("tasks", id(d.id)),

  addNote: (d) =>
    save("notes", { client_id: id(d.clientId, "client"), body: need(d.body, "Note", 20000) }, null),
  deleteNote: (d) => remove("notes", id(d.id)),

  saveCarePlan: (d) =>
    save("care_plans", {
      client_id: id(d.clientId, "client"),
      plan: oneOf(d.plan, CARE_PLAN, "basic"),
      amount_cents: cents(d.amount, "Monthly amount"),
      billing_day: Math.min(day(d.billingDay ?? 1), 28),
      started_on: date(d.startedOn) ?? new Date().toISOString().slice(0, 10),
      ended_on: date(d.endedOn),
      notes: opt(d.notes),
    }, optId(d.id)),
  deleteCarePlan: (d) => remove("care_plans", id(d.id)),

  listExpenses: () => q(`select e.*, c.name as client_name from expenses e
    left join clients c on c.id = e.client_id order by e.spent_on desc, e.id desc limit 500`),
  saveExpense: (d) =>
    save("expenses", {
      client_id: optId(d.clientId),
      vendor: need(d.vendor, "Vendor", 200),
      category: oneOf(d.category, EXPENSE_CAT, "software"),
      amount_cents: cents(d.amount, "Amount"),
      spent_on: date(d.spentOn) ?? new Date().toISOString().slice(0, 10),
      notes: opt(d.notes),
    }, optId(d.id)),
  deleteExpense: (d) => remove("expenses", id(d.id)),

  inbox: () => inbox(),
  setInquiryHandled: (d) =>
    one("update inquiries set handled = $2 where id = $1 returning *", [id(d.id), Boolean(d.handled)]),
  inquiryToClient: async (d) => {
    const row = await one<{ id: number; name: string; email: string; company: string | null; message: string }>(
      "select * from inquiries where id = $1", [id(d.id)],
    );
    if (!row) fail("That inquiry no longer exists.", 404);
    const clientId = await upsertClientByEmail(row, "lead", "contact form");
    await q("insert into notes (client_id, body) values ($1, $2)", [clientId, `From the contact form:\n\n${row.message}`]);
    await q("update inquiries set handled = true where id = $1", [row.id]);
    return { clientId };
  },
  deleteInquiry: (d) => remove("inquiries", id(d.id)),
  deleteOnboarding: (d) => remove("onboardings", id(d.id)),
  deleteAgreement: (d) => remove("agreements", id(d.id)),

  exportAll: async () => {
    const tables = ["clients", "projects", "payments", "care_plans", "tasks", "notes",
      "expenses", "inquiries", "onboardings", "agreements"];
    const out: Record<string, unknown[]> = {};
    for (const table of tables) out[table] = await q(`select * from ${table} order by id`);
    return { exported_at: new Date().toISOString(), ...out };
  },

  /** One-time move of the old browser-only book (localStorage `wise-owl-studio-v1`). */
  importLocalBook: async (d) => importLocalBook(d),
};

type LocalBook = {
  clients?: Array<{ id: number; name: string; email: string; company: string | null; website: string | null; status: string; notes: string | null; created_at: string }>;
  sales?: Array<{ client_id: number; product_id: number; amount_cents: number; sold_on: string; notes: string | null }>;
  todos?: Array<{ client_id: number; title: string; due_day: number; done_for_month: string | null }>;
  onboardings?: Array<{ client_id: number; project_type: string; goals: string; audience: string | null; timeline: string | null; budget: string | null; extra: string | null }>;
  agreements?: Array<{ name: string; email: string; company: string | null; project: string; signature: string; signed_at: string }>;
};

async function importLocalBook(data: Row) {
  const book = (data.book ?? {}) as LocalBook;
  const db = await pool().connect();
  const idMap = new Map<number, number>();
  let clients = 0;
  let payments = 0;
  try {
    await db.query("begin");
    for (const c of book.clients ?? []) {
      const found = c.email
        ? await db.query("select id from clients where lower(email) = lower($1) limit 1", [c.email])
        : { rows: [] };
      if (found.rows[0]) {
        idMap.set(c.id, Number(found.rows[0].id));
        continue;
      }
      const status = CLIENT_STATUS.includes(c.status as never) ? c.status : "active";
      const res = await db.query(
        `insert into clients (name, email, company, website, status, notes, source, created_at)
         values ($1, $2, $3, $4, $5, $6, 'imported', coalesce($7::timestamptz, now())) returning id`,
        [str(c.name, 200) || "Client", opt(c.email, 320), opt(c.company, 200), opt(c.website, 500),
         status, opt(c.notes), c.created_at || null],
      );
      idMap.set(c.id, Number(res.rows[0].id));
      clients += 1;
    }
    for (const s of book.sales ?? []) {
      const clientId = idMap.get(s.client_id);
      if (!clientId) continue;
      const kind = s.product_id <= 2 ? "onboarding" : s.product_id >= 6 ? "care" : "project";
      await db.query(
        `insert into payments (client_id, amount_cents, kind, method, paid_on, notes)
         values ($1, $2, $3, 'other', $4, $5)`,
        [clientId, Math.round(Number(s.amount_cents) || 0), kind, date(s.sold_on) ?? new Date().toISOString().slice(0, 10),
         opt(s.notes) ?? "Imported from the old studio book"],
      );
      payments += 1;
    }
    for (const t of book.todos ?? []) {
      const clientId = idMap.get(t.client_id);
      if (!clientId) continue;
      await db.query(
        `insert into tasks (client_id, title, repeat, due_day, done_for_month)
         values ($1, $2, 'monthly', $3, $4)`,
        [clientId, str(t.title, 300) || "Task", Math.min(Math.max(Number(t.due_day) || 1, 1), 31), t.done_for_month || null],
      );
    }
    for (const o of book.onboardings ?? []) {
      const clientId = idMap.get(o.client_id);
      if (!clientId) continue;
      const client = (book.clients ?? []).find((c) => c.id === o.client_id);
      await db.query(
        `insert into onboardings (client_id, name, email, company, project_type, goals, audience, timeline, budget, extra)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [clientId, client?.name ?? "Client", client?.email ?? "", client?.company ?? null,
         o.project_type || "Website", o.goals || "", o.audience, o.timeline, o.budget, o.extra],
      );
    }
    for (const a of book.agreements ?? []) {
      const found = await db.query("select id from clients where lower(email) = lower($1) limit 1", [a.email]);
      await db.query(
        `insert into agreements (client_id, name, email, company, project, signature, signed_at)
         values ($1, $2, $3, $4, $5, $6, coalesce($7::timestamptz, now()))`,
        [found.rows[0]?.id ?? null, a.name, a.email, a.company, a.project, a.signature, a.signed_at || null],
      );
    }
    await db.query("commit");
  } catch (err) {
    await db.query("rollback");
    throw err;
  } finally {
    db.release();
  }
  return { clients, payments };
}

/* ------------------------------------------------------------- handler */

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export async function POST(request: Request) {
  // Custom header + JSON body: plain cross-site form posts can't produce either.
  if (request.headers.get("x-studio") !== "1") return json({ error: "Bad request." }, 400);

  let body: { action?: string; data?: Row };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  const action = String(body.action ?? "");
  const data = (body.data && typeof body.data === "object" ? body.data : {}) as Row;

  try {
    switch (action) {
      case "session":
        return json({ email: sessionEmail(request) });
      case "login": {
        const result = await login(request, data);
        return json({ email: result.email }, 200, { "set-cookie": result.cookie });
      }
      case "logout":
        return json({ ok: true }, 200, { "set-cookie": clearCookie(request) });
      case "submitInquiry":
        return json(await submitInquiry(data));
      case "submitOnboarding":
        return json(await submitOnboarding(data));
      case "signAgreement":
        return json(await signAgreement(data));
    }

    const handler = privateActions[action];
    if (!handler) return json({ error: "Unknown action." }, 404);
    if (!sessionEmail(request)) return json({ error: "Sign in again." }, 401);
    return json(await handler(data));
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    const code = (err as { code?: string }).code;
    if (code === "23503") return json({ error: "That linked record doesn't exist." }, 400);
    if (code === "23514") return json({ error: "One of those values isn't allowed." }, 400);
    console.error("[studio api]", action, err);
    return json({ error: "Something went wrong on the server." }, 500);
  }
}

export function GET() {
  return json({ error: "Use POST." }, 405);
}

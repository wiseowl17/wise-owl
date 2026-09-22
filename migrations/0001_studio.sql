-- Wise Owl studio: the business database.
-- Money is stored in cents. Dates without a time of day use `date`.

create table clients (
  id           bigint generated always as identity primary key,
  name         text not null,
  email        text,
  phone        text,
  company      text,
  website      text,
  address      text,
  status       text not null default 'lead'
               check (status in ('lead', 'onboarding', 'active', 'paused', 'completed', 'archived')),
  source       text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index clients_status_idx on clients (status);

create table projects (
  id           bigint generated always as identity primary key,
  client_id    bigint not null references clients(id) on delete cascade,
  name         text not null,
  kind         text not null default 'site'
               check (kind in ('landing', 'site', 'large_site', 'redesign', 'care', 'other')),
  status       text not null default 'proposal'
               check (status in ('proposal', 'in_progress', 'review', 'launched', 'on_hold', 'cancelled')),
  scope        text,
  price_cents  integer not null default 0 check (price_cents >= 0),
  domain       text,
  site_url     text,
  links        text,
  start_on     date,
  due_on       date,
  launched_on  date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index projects_client_idx on projects (client_id);
create index projects_status_idx on projects (status);

create table care_plans (
  id           bigint generated always as identity primary key,
  client_id    bigint not null references clients(id) on delete cascade,
  plan         text not null default 'basic' check (plan in ('basic', 'backend', 'custom')),
  amount_cents integer not null check (amount_cents >= 0),
  billing_day  smallint not null default 1 check (billing_day between 1 and 28),
  started_on   date not null default current_date,
  ended_on     date,
  notes        text,
  created_at   timestamptz not null default now()
);
create index care_plans_client_idx on care_plans (client_id);

create table payments (
  id           bigint generated always as identity primary key,
  client_id    bigint not null references clients(id) on delete cascade,
  project_id   bigint references projects(id) on delete set null,
  amount_cents integer not null,
  kind         text not null default 'project'
               check (kind in ('onboarding', 'deposit', 'project', 'final', 'care', 'refund', 'other')),
  method       text not null default 'card'
               check (method in ('card', 'cash', 'check', 'zelle', 'venmo', 'cashapp', 'paypal', 'bank', 'other')),
  status       text not null default 'paid' check (status in ('paid', 'pending')),
  paid_on      date not null default current_date,
  notes        text,
  created_at   timestamptz not null default now()
);
create index payments_client_idx on payments (client_id);
create index payments_project_idx on payments (project_id);
create index payments_paid_on_idx on payments (paid_on);

create table tasks (
  id              bigint generated always as identity primary key,
  client_id       bigint references clients(id) on delete cascade,
  project_id      bigint references projects(id) on delete cascade,
  title           text not null,
  notes           text,
  priority        text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  -- One-off tasks use due_on/done_at. Monthly tasks use due_day/done_for_month.
  repeat          text not null default 'none' check (repeat in ('none', 'monthly')),
  due_on          date,
  due_day         smallint check (due_day between 1 and 31),
  done_at         timestamptz,
  done_for_month  text,
  created_at      timestamptz not null default now()
);
create index tasks_client_idx on tasks (client_id);
create index tasks_project_idx on tasks (project_id);

create table notes (
  id          bigint generated always as identity primary key,
  client_id   bigint not null references clients(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index notes_client_idx on notes (client_id);

create table expenses (
  id           bigint generated always as identity primary key,
  client_id    bigint references clients(id) on delete set null,
  vendor       text not null,
  category     text not null default 'software'
               check (category in ('hosting', 'domain', 'software', 'contractor', 'equipment', 'marketing', 'other')),
  amount_cents integer not null check (amount_cents >= 0),
  spent_on     date not null default current_date,
  notes        text,
  created_at   timestamptz not null default now()
);
create index expenses_spent_on_idx on expenses (spent_on);

-- Public submissions. Stored even when the email copy fails.
create table inquiries (
  id            bigint generated always as identity primary key,
  name          text not null,
  email         text not null,
  company       text,
  project_type  text,
  message       text not null,
  handled       boolean not null default false,
  created_at    timestamptz not null default now()
);

create table onboardings (
  id            bigint generated always as identity primary key,
  client_id     bigint references clients(id) on delete set null,
  name          text not null,
  email         text not null,
  company       text,
  website       text,
  project_type  text not null,
  goals         text not null,
  audience      text,
  timeline      text,
  budget        text,
  extra         text,
  created_at    timestamptz not null default now()
);

create table agreements (
  id          bigint generated always as identity primary key,
  client_id   bigint references clients(id) on delete set null,
  name        text not null,
  email       text not null,
  company     text,
  project     text not null,
  signature   text not null,
  signed_at   timestamptz not null default now()
);

-- Failed sign-in attempts, for throttling.
create table login_attempts (
  id          bigint generated always as identity primary key,
  ip          text not null,
  created_at  timestamptz not null default now()
);
create index login_attempts_ip_idx on login_attempts (ip, created_at);

-- Invoices: numbered WO-0002 onward (WO-0001 was issued by hand before this feature).
create sequence invoice_number_seq start 2;

create table invoices (
  id             bigint generated always as identity primary key,
  number         text not null unique,
  client_id      bigint not null references clients(id) on delete cascade,
  project_id     bigint references projects(id) on delete set null,
  care_plan_id   bigint references care_plans(id) on delete set null,
  -- Care invoices cover one month (YYYY-MM) so a plan is never billed twice.
  period         text,
  status         text not null default 'draft' check (status in ('draft', 'sent', 'void')),
  issued_on      date not null default current_date,
  due_on         date,
  notes          text,
  -- Unguessable id for the client's invoice page.
  public_token   text not null unique,
  stripe_session_id text,
  sent_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (care_plan_id, period)
);
create index invoices_client_idx on invoices (client_id);
create index invoices_project_idx on invoices (project_id);

create table invoice_items (
  id           bigint generated always as identity primary key,
  invoice_id   bigint not null references invoices(id) on delete cascade,
  position     smallint not null default 0,
  description  text not null,
  details      text,
  quantity     numeric(10, 2) not null default 1 check (quantity > 0),
  unit_cents   integer not null
);
create index invoice_items_invoice_idx on invoice_items (invoice_id);

-- Payments can settle an invoice, in full or in parts.
alter table payments add column invoice_id bigint references invoices(id) on delete set null;
-- Stripe Checkout session id, so a card payment is only ever recorded once.
alter table payments add column stripe_ref text unique;
create index payments_invoice_idx on payments (invoice_id);

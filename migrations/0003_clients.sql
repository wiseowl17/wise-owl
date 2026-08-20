create table if not exists clients (
  id          serial primary key,
  name        text not null,
  email       text not null,
  company     text,
  website     text,
  status      text not null default 'onboarding',
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists products (
  id            serial primary key,
  name          text not null,
  kind          text not null,
  price_cents   integer not null default 0,
  description   text
);

create table if not exists sales (
  id            serial primary key,
  client_id     integer not null references clients(id) on delete cascade,
  product_id    integer not null references products(id),
  amount_cents  integer not null,
  sold_on       date not null default current_date,
  notes         text
);

create table if not exists maintenance_todos (
  id              serial primary key,
  client_id       integer not null references clients(id) on delete cascade,
  title           text not null,
  due_day         integer not null default 1,
  done_for_month  text,
  created_at      timestamptz not null default now()
);

create table if not exists onboardings (
  id            serial primary key,
  client_id     integer not null references clients(id) on delete cascade,
  project_type  text not null,
  goals         text not null,
  audience      text,
  timeline      text,
  budget        text,
  extra         text,
  created_at    timestamptz not null default now()
);

create index if not exists sales_client_id_idx on sales (client_id);
create index if not exists todos_client_id_idx on maintenance_todos (client_id);

insert into products (name, kind, price_cents, description) values
  ('Custom website', 'website', 650000, 'A full custom marketing or product site.'),
  ('Site redesign', 'redesign', 420000, 'Visual and structural rebuild of an existing site.'),
  ('Landing page', 'landing', 180000, 'A single focused page for a launch or offer.'),
  ('Monthly care', 'maintenance', 25000, 'Updates, backups, and a monthly pass.'),
  ('Extra page', 'other', 45000, 'An additional page on an existing site.');

insert into clients (name, email, company, website, status, notes) values
  ('Elena Ward', 'elena@northlinegoods.com', 'Northline Goods', 'https://northlinegoods.com', 'active', 'Retail brand. Care plan on the 1st.'),
  ('James Okoye', 'james@harborandco.com', 'Harbor & Co.', 'https://harborandco.com', 'active', 'Architecture studio. Redesign plus two landings.'),
  ('Mira Paloma', 'mira@palomastudio.co', 'Paloma Studio', 'https://palomastudio.co', 'onboarding', 'Just sent the brief. No sale yet.'),
  ('Chris Bell', 'chris@fieldhouse.ath', 'Fieldhouse Athletics', 'https://fieldhouse.ath', 'active', 'Gym group. Site plus monthly care.');

insert into sales (client_id, product_id, amount_cents, sold_on, notes)
select c.id, p.id, 650000, '2025-11-04', 'Launch site'
from clients c, products p
where c.email = 'elena@northlinegoods.com' and p.name = 'Custom website';

insert into sales (client_id, product_id, amount_cents, sold_on, notes)
select c.id, p.id, 25000, '2025-12-01', 'Care — Dec'
from clients c, products p
where c.email = 'elena@northlinegoods.com' and p.name = 'Monthly care';

insert into sales (client_id, product_id, amount_cents, sold_on, notes)
select c.id, p.id, 25000, '2026-01-01', 'Care — Jan'
from clients c, products p
where c.email = 'elena@northlinegoods.com' and p.name = 'Monthly care';

insert into sales (client_id, product_id, amount_cents, sold_on, notes)
select c.id, p.id, 420000, '2025-09-18', 'Full redesign'
from clients c, products p
where c.email = 'james@harborandco.com' and p.name = 'Site redesign';

insert into sales (client_id, product_id, amount_cents, sold_on, notes)
select c.id, p.id, 180000, '2026-02-10', 'Spring offer page'
from clients c, products p
where c.email = 'james@harborandco.com' and p.name = 'Landing page';

insert into sales (client_id, product_id, amount_cents, sold_on, notes)
select c.id, p.id, 180000, '2026-05-22', 'Hiring page'
from clients c, products p
where c.email = 'james@harborandco.com' and p.name = 'Landing page';

insert into sales (client_id, product_id, amount_cents, sold_on, notes)
select c.id, p.id, 650000, '2026-03-12', 'New site'
from clients c, products p
where c.email = 'chris@fieldhouse.ath' and p.name = 'Custom website';

insert into sales (client_id, product_id, amount_cents, sold_on, notes)
select c.id, p.id, 25000, '2026-04-01', 'Care — Apr'
from clients c, products p
where c.email = 'chris@fieldhouse.ath' and p.name = 'Monthly care';

insert into sales (client_id, product_id, amount_cents, sold_on, notes)
select c.id, p.id, 25000, '2026-05-01', 'Care — May'
from clients c, products p
where c.email = 'chris@fieldhouse.ath' and p.name = 'Monthly care';

insert into maintenance_todos (client_id, title, due_day, done_for_month)
select c.id, v.title, v.due_day, v.done_for_month
from clients c
join (values
  ('Review uptime and SSL', 1, '2026-08'),
  ('Apply updates', 5, null),
  ('Backup and check forms', 12, null)
) as v(title, due_day, done_for_month) on true
where c.email = 'elena@northlinegoods.com';

insert into maintenance_todos (client_id, title, due_day, done_for_month)
select c.id, v.title, v.due_day, v.done_for_month
from clients c
join (values
  ('Renew CDN cert', 3, null),
  ('Swap seasonal images', 8, '2026-08'),
  ('Check contact form spam', 15, null)
) as v(title, due_day, done_for_month) on true
where c.email = 'james@harborandco.com';

insert into maintenance_todos (client_id, title, due_day, done_for_month)
select c.id, v.title, v.due_day, v.done_for_month
from clients c
join (values
  ('Class schedule update', 1, null),
  ('Apply updates', 7, null),
  ('Backup and check forms', 20, null)
) as v(title, due_day, done_for_month) on true
where c.email = 'chris@fieldhouse.ath';

insert into onboardings (client_id, project_type, goals, audience, timeline, budget, extra)
select c.id, 'Custom website',
  'A site that matches the studio — calm, photographic, easy to update.',
  'Interior clients in the southeast.',
  'This quarter',
  '$6k–$8k',
  'Has a Squarespace site now. Wants to leave it.'
from clients c
where c.email = 'mira@palomastudio.co';

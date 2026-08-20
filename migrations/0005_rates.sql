create table if not exists agreements (
  id           serial primary key,
  name         text not null,
  email        text not null,
  company      text,
  project      text not null,
  signature    text not null,
  signed_at    timestamptz not null default now()
);

delete from sales;
delete from products;

insert into products (name, kind, price_cents, description) values
  ('Onboarding fee', 'setup', 25000, 'Paid first. Opens the project and books the work.'),
  ('Connect existing domain', 'setup', 10000, 'Point a domain you already own at the new site.'),
  ('Find and connect domain', 'setup', 25000, 'Shop for the domain together, then connect it.'),
  ('Landing page', 'landing', 40000, 'One simple page: contact, location, services.'),
  ('Site, 3–5 pages', 'website', 75000, 'Booking, payments, and calendar sync.'),
  ('Larger site, 5+ pages', 'website', 120000, 'Starting point. Final price depends on the project.'),
  ('Monthly care, basic', 'maintenance', 10000, 'Edits, photos, and light upkeep. Starts at $100.'),
  ('Monthly care, backend', 'maintenance', 25000, 'Files, inventory, and backend upkeep. Starts at $250.');

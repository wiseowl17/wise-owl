delete from products
where name in (
  'Onboarding fee',
  'Connect existing domain',
  'Find and connect domain'
);

insert into products (name, kind, price_cents, description)
select v.name, v.kind, v.price_cents, v.description
from (values
  ('Onboarding, domain you own', 'setup', 10000, 'One onboarding fee. Connect a domain you already own.'),
  ('Onboarding, we find the domain', 'setup', 25000, 'One onboarding fee. Shop for and connect a domain.')
) as v(name, kind, price_cents, description)
where not exists (select 1 from products p where p.name = v.name);

create table if not exists studio_owner (
  user_id     text primary key,
  created_at  timestamptz not null default now()
);

alter table clients add column if not exists user_id text;

delete from onboardings;
delete from maintenance_todos;
delete from sales;
delete from clients;

create index if not exists clients_user_id_idx on clients (user_id);

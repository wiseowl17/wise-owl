create table if not exists inquiries (
  id          serial primary key,
  name        text not null,
  email       text not null,
  company     text,
  project_type text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

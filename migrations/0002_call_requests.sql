-- Call requests from the landing page: phone and a preferred time, email optional.
alter table inquiries add column phone text;
alter table inquiries add column best_time text;
alter table inquiries alter column email drop not null;
alter table inquiries alter column message drop not null;

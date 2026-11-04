-- Urëza demo table (synthetic data only). Run in Supabase: SQL Editor > New query > Run.
create table if not exists public.tasks (
  id text primary key,
  title text not null,
  location text not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default clock_timestamp()
);

insert into public.tasks (id, title, location, status) values
  ('shtepia-1', 'Kontrolli i shtëpisë', 'Mitrovicë, Kosovë', 'pending'),
  ('toka-2', 'Kontrolli i tokës', 'Vushtrri, Kosovë', 'pending'),
  ('oborri-3', 'Mirëmbajtja e oborrit', 'Pejë, Kosovë', 'pending'),
  ('banesa-4', 'Kontrolli i banesës', 'Prizren, Kosovë', 'pending'),
  ('prona-5', 'Kontrolli i pronës', 'Gjakovë, Kosovë', 'pending')
on conflict (id) do nothing;

-- Read-only for the public (anon) role here. Insert and status updates are added in tasks_insert.sql and tasks_update.sql. No delete policy on purpose.
grant select on public.tasks to anon;
alter table public.tasks enable row level security;

drop policy if exists "public can read tasks" on public.tasks;
create policy "public can read tasks"
  on public.tasks
  for select to anon
  using (true);

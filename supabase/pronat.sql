-- Urëza: the properties table (pronat). Not part of a course week.
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Same idea as week 6: every row has an owner (pronari_id = the signed-in user),
-- and Row Level Security lets each user read and add only their own rows.

create table if not exists public.pronat (
  id uuid primary key default gen_random_uuid(),
  pronari_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  emri text not null check (char_length(emri) between 2 and 80),
  vendi text not null check (char_length(vendi) between 2 and 80),
  lloji text not null default 'shtepi' check (lloji in ('shtepi', 'prindert', 'toke')),
  created_at timestamptz not null default now()
);

alter table public.pronat enable row level security;

-- Signed-out visitors (anon) get nothing; signed-in users only what the policies allow.
revoke all on public.pronat from anon;
grant select, insert on public.pronat to authenticated;

drop policy if exists "owner reads pronat" on public.pronat;
create policy "owner reads pronat"
  on public.pronat for select to authenticated
  using (pronari_id = (select auth.uid()));

drop policy if exists "owner adds pronat" on public.pronat;
create policy "owner adds pronat"
  on public.pronat for insert to authenticated
  with check (pronari_id = (select auth.uid()));

-- Optional: the two example properties from the design, for the account below.
-- Change the email, or skip this block and add the properties from the app.
insert into public.pronat (pronari_id, emri, vendi, lloji)
select u.id, v.emri, v.vendi, v.lloji
from auth.users u
cross join (values
  ('Shtëpia në Ferizaj', 'Ferizaj', 'shtepi'),
  ('Prindërit në Mitrovicë', 'Mitrovicë', 'prindert')
) as v (emri, vendi, lloji)
where u.email = 'klienti@example.com'
  and not exists (
    select 1 from public.pronat p where p.pronari_id = u.id and p.emri = v.emri
  );

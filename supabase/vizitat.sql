-- Urëza: the visits table (vizitat). Not part of a course week.
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Run supabase/pronat.sql first: every visit belongs to one of the user's properties.
-- Same idea as week 6: every row has an owner (pronari_id = the signed-in user),
-- and Row Level Security lets each user read and add only their own rows.

create table if not exists public.vizitat (
  id uuid primary key default gen_random_uuid(),
  pronari_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prona_id uuid not null references public.pronat (id) on delete cascade,
  lloji text not null check (lloji in ('inspektim', 'kujdes')),
  data_vizites date not null,
  udhezime text not null check (char_length(udhezime) between 10 and 500),
  statusi text not null default 'kerkuar'
    check (statusi in ('kerkuar', 'pranuar', 'vizita', 'raporti_gati', 'miratuar', 'kundershtuar')),
  created_at timestamptz not null default now()
);

create index if not exists vizitat_pronari_data_idx on public.vizitat (pronari_id, data_vizites desc);

alter table public.vizitat enable row level security;

-- Signed-out visitors (anon) get nothing; signed-in users only what the policies allow.
revoke all on public.vizitat from anon;
grant select, insert, delete on public.vizitat to authenticated;

drop policy if exists "owner reads vizitat" on public.vizitat;
create policy "owner reads vizitat"
  on public.vizitat for select to authenticated
  using (pronari_id = (select auth.uid()));

-- A client can only request a visit (status 'kerkuar') for one of their own properties.
-- Later steps (the Miku accepting, the report) will change the status with their own policies.
drop policy if exists "owner requests vizitat" on public.vizitat;
create policy "owner requests vizitat"
  on public.vizitat for insert to authenticated
  with check (
    pronari_id = (select auth.uid())
    and statusi = 'kerkuar'
    and exists (
      select 1 from public.pronat p
      where p.id = prona_id and p.pronari_id = (select auth.uid())
    )
  );

-- A client can cancel a request only while it is still 'kerkuar' (no Miku has accepted it yet).
drop policy if exists "owner cancels requested vizitat" on public.vizitat;
create policy "owner cancels requested vizitat"
  on public.vizitat for delete to authenticated
  using (pronari_id = (select auth.uid()) and statusi = 'kerkuar');

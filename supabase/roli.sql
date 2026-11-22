-- Urëza: roles (Klient, Miku, Admin) and the Miku accepting a visit. Not part of a course week.
-- Run once in Supabase: SQL Editor > New query > paste > Run. It is safe to run again.
-- Run supabase/pronat.sql and supabase/vizitat.sql first.
--
-- Same idea as week 6 (Row Level Security by owner), now also by role:
--   * every user has one profile row (name + role); only 'klient' and 'miku' can be chosen
--     in the app, 'admin' is given by the team (see the last block of this file);
--   * a Miku can read the open requests (status 'kerkuar') and the visits they accepted,
--     and can accept an open request, nothing else.

-- 1 · Profiles -------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  emri text not null check (char_length(emri) between 2 and 40),
  roli text not null default 'klient' check (roli in ('klient', 'miku', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant insert (id, emri, roli) on public.profiles to authenticated;
grant update (emri, roli) on public.profiles to authenticated;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

-- A new profile can only be 'klient' or 'miku'.
drop policy if exists "own profile create" on public.profiles;
create policy "own profile create"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()) and roli in ('klient', 'miku'));

-- The name can be changed, and the role switched between 'klient' and 'miku' (for the
-- prototype, to try both sides with one account). An admin profile cannot be changed here.
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) and roli <> 'admin')
  with check (id = (select auth.uid()) and roli in ('klient', 'miku'));

-- The role of the signed-in user, for the policies below (security definer: it reads
-- the profiles table without going through the policies again).
create or replace function public.roli_im()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select roli from public.profiles where id = (select auth.uid())
$$;

revoke all on function public.roli_im() from public, anon;
grant execute on function public.roli_im() to authenticated;

-- 2 · The Miku and the visits ----------------------------------------------------------
alter table public.vizitat add column if not exists miku_id uuid references auth.users (id) on delete set null;
alter table public.vizitat add column if not exists miku_emri text;
alter table public.vizitat add column if not exists pranuar_at timestamptz;

-- A client can only send the four fields of a request; the status, the owner and the Miku
-- are set by the database defaults and the policies, never by the client.
revoke insert on public.vizitat from authenticated;
grant insert (prona_id, lloji, data_vizites, udhezime) on public.vizitat to authenticated;

-- A Miku reads the open requests and the visits they accepted.
drop policy if exists "miku reads open and own vizitat" on public.vizitat;
create policy "miku reads open and own vizitat"
  on public.vizitat for select to authenticated
  using (
    (select public.roli_im()) = 'miku'
    and (statusi = 'kerkuar' or miku_id = (select auth.uid()))
  );

-- A Miku can only turn an open request into an accepted one, for themselves.
grant update (statusi, miku_id, miku_emri, pranuar_at) on public.vizitat to authenticated;

drop policy if exists "miku accepts vizitat" on public.vizitat;
create policy "miku accepts vizitat"
  on public.vizitat for update to authenticated
  using ((select public.roli_im()) = 'miku' and statusi = 'kerkuar')
  with check (statusi = 'pranuar' and miku_id = (select auth.uid()));

-- A Miku sees the property (name, place) of the visits they can see.
-- The check lives in a security definer function on purpose: the policy of "vizitat" (a client
-- may only request a visit for their own property) reads "pronat", so a policy of "pronat" that
-- reads "vizitat" directly makes Postgres report "infinite recursion detected in policy".
-- The function reads "vizitat" without going through its policies again, which breaks the loop.
create or replace function public.miku_sheh_pronen(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.roli_im() = 'miku'
    and exists (
      select 1 from public.vizitat v
      where v.prona_id = pid
        and (v.statusi = 'kerkuar' or v.miku_id = (select auth.uid()))
    )
$$;

revoke all on function public.miku_sheh_pronen(uuid) from public, anon;
grant execute on function public.miku_sheh_pronen(uuid) to authenticated;

drop policy if exists "miku reads pronat of vizitat" on public.pronat;
create policy "miku reads pronat of vizitat"
  on public.pronat for select to authenticated
  using (public.miku_sheh_pronen(id));

-- 3 · Admin ----------------------------------------------------------------------------
-- The admin role is given by hand (not from the app). Change the email, then run these
-- two lines once the account has chosen a role in the app:
--
-- update public.profiles set roli = 'admin'
--   where id = (select id from auth.users where email = 'admini@example.com');

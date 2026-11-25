-- Urëza · Besimi (trust): who does the visit and what the client agreed to.
--
-- The market card of November 19 asked "who does the visit, who is responsible if something goes
-- wrong?" and asked for written consent before entering a property and taking photos. This file:
--   1. lets only a Miku verified by the admin see open requests and accept them
--      (a Miku keeps seeing the visits they already accepted);
--   2. records the client's written consent and the version of the terms on every new request,
--      and refuses a request without them;
--   3. lets a client see which Mikus of their own visits are verified.
--
-- Run it after admini.sql (it needs profiles.verifikuar_at). Run it last: it replaces two
-- policies of roli.sql, so after running roli.sql again, run this file again too.
-- Safe to run again.

-- 1 · Only verified Mikus take requests ---------------------------------------------------

-- Is the signed-in user a Miku verified by the admin? (security definer: it reads profiles
-- without going through the policies again)
create or replace function public.miku_i_verifikuar()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.roli = 'miku' and p.verifikuar_at is not null
  )
$$;

revoke all on function public.miku_i_verifikuar() from public, anon;
grant execute on function public.miku_i_verifikuar() to authenticated;

-- A verified Miku reads the open requests; every Miku reads the visits they accepted.
drop policy if exists "miku reads open and own vizitat" on public.vizitat;
create policy "miku reads open and own vizitat"
  on public.vizitat for select to authenticated
  using (
    (select public.roli_im()) = 'miku'
    and (
      (statusi = 'kerkuar' and (select public.miku_i_verifikuar()))
      or miku_id = (select auth.uid())
    )
  );

-- Only a verified Miku can turn an open request into an accepted one, for themselves.
drop policy if exists "miku accepts vizitat" on public.vizitat;
create policy "miku accepts vizitat"
  on public.vizitat for update to authenticated
  using (
    (select public.roli_im()) = 'miku'
    and statusi = 'kerkuar'
    and (select public.miku_i_verifikuar())
  )
  with check (statusi = 'pranuar' and miku_id = (select auth.uid()));

-- The property (name, place) of an open request is shown only to verified Mikus as well.
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
        and (
          (v.statusi = 'kerkuar' and public.miku_i_verifikuar())
          or v.miku_id = (select auth.uid())
        )
    )
$$;

revoke all on function public.miku_sheh_pronen(uuid) from public, anon;
grant execute on function public.miku_sheh_pronen(uuid) to authenticated;

-- 2 · Written consent on every request ------------------------------------------------------

-- When the client agreed, and to which version of the terms (the Kushtet screen of the app).
alter table public.vizitat add column if not exists pelqimi_at timestamptz;
alter table public.vizitat add column if not exists kushtet_versioni text;

-- Same rule as vizitat.sql, plus: a new request must carry the consent and the terms version.
-- (Older rows keep null: they were made before the terms existed.)
drop policy if exists "owner requests vizitat" on public.vizitat;
create policy "owner requests vizitat"
  on public.vizitat for insert to authenticated
  with check (
    pronari_id = (select auth.uid())
    and statusi = 'kerkuar'
    and pelqimi_at is not null
    and kushtet_versioni is not null
    and char_length(kushtet_versioni) between 1 and 20
    and exists (
      select 1 from public.pronat p
      where p.id = prona_id and p.pronari_id = (select auth.uid())
    )
  );

-- 3 · The client sees which of their Mikus are verified ------------------------------------

-- The Mikus of the signed-in client's own visits who are verified (ids only, nothing else
-- of their profile).
create or replace function public.mikut_e_verifikuar_te_mi()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct v.miku_id
  from public.vizitat v
  join public.profiles p on p.id = v.miku_id
  where v.pronari_id = (select auth.uid())
    and p.roli = 'miku'
    and p.verifikuar_at is not null
$$;

revoke all on function public.mikut_e_verifikuar_te_mi() from public, anon;
grant execute on function public.mikut_e_verifikuar_te_mi() to authenticated;

-- Urëza · Besimi (trust): who does the visit and what the client agreed to.
--
-- The market card of November 19 asked "who does the visit, who is responsible if something goes
-- wrong?" and asked for written consent before entering a property and taking photos. This file:
--   1. lets only a Miku verified by the admin see open requests and accept them
--      (a Miku keeps seeing the visits they already accepted);
--   2. records the client's written consent and the version of the terms on every new request,
--      and refuses a request without them;
--   3. lets a client see which Mikus of their own visits are verified;
--   4. records who the Miku is: a company (with its business number), an individual, a student
--      or a craftsman;
--   5. adds the contract between the client and the Miku: the client agrees when sending the
--      request, the Miku before accepting it (the database refuses an acceptance without it),
--      and both read the same contract through kontrata_e_vizites().
--
-- Run it after admini.sql (it needs profiles.verifikuar_at). Run it last: it replaces two
-- policies of roli.sql, so after running roli.sql again, run this file again too.
-- Safe to run again.

-- 0 · New columns (first, because the functions below read them) ---------------------------

-- Who the Miku is. 'kompani': a company registered in Kosovo (name and business number);
-- 'mjeshter': a craftsman without a company (miku_biznesi holds the trade, e.g. "elektricist").
alter table public.profiles add column if not exists miku_lloji text;
alter table public.profiles add column if not exists miku_biznesi text;
alter table public.profiles add column if not exists miku_nrb text;

alter table public.profiles drop constraint if exists profiles_miku_lloji_check;
alter table public.profiles add constraint profiles_miku_lloji_check
  check (miku_lloji is null or miku_lloji in ('kompani', 'individ', 'student', 'mjeshter'));
alter table public.profiles drop constraint if exists profiles_miku_biznesi_check;
alter table public.profiles add constraint profiles_miku_biznesi_check
  check (miku_biznesi is null or char_length(miku_biznesi) between 2 and 80);
alter table public.profiles drop constraint if exists profiles_miku_nrb_check;
alter table public.profiles add constraint profiles_miku_nrb_check
  check (miku_nrb is null or miku_nrb ~ '^[0-9]{6,12}$');

-- Each user changes these on their own profile ("own profile update" in roli.sql).
grant update (miku_lloji, miku_biznesi, miku_nrb) on public.profiles to authenticated;

-- When the client agreed, and to which version of the terms (the Kushtet screen of the app).
alter table public.vizitat add column if not exists pelqimi_at timestamptz;
alter table public.vizitat add column if not exists kushtet_versioni text;
-- roli.sql lets a client insert only some columns of a request; add the two consent columns
-- (never the contract columns below: only the Miku accepts the contract).
grant insert (pelqimi_at, kushtet_versioni) on public.vizitat to authenticated;

-- When the Miku accepted the contract, and which version.
alter table public.vizitat add column if not exists kontrata_versioni text;
alter table public.vizitat add column if not exists kontrata_pranuar_at timestamptz;
grant update (kontrata_versioni, kontrata_pranuar_at) on public.vizitat to authenticated;

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

-- Has the signed-in Miku said who they are (company, individual, student, craftsman)?
create or replace function public.miku_ka_llojin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.miku_lloji is not null
  )
$$;

revoke all on function public.miku_ka_llojin() from public, anon;
grant execute on function public.miku_ka_llojin() to authenticated;

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
  with check (
    statusi = 'pranuar'
    and miku_id = (select auth.uid())
    -- the Miku has said who they are (section 0) and accepted the contract (section 4)
    and (select public.miku_ka_llojin())
    and kontrata_pranuar_at is not null
    and kontrata_versioni is not null
    and char_length(kontrata_versioni) between 1 and 20
  );

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
    -- only the Miku accepts the contract, when accepting the visit
    and kontrata_pranuar_at is null
    and kontrata_versioni is null
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

-- 4 · The contract, as both sides read it ---------------------------------------------------

-- Everything the contract of one visit shows: the visit, the property, the client's name and
-- consent, the Miku (name, kind, company and business number, verification) and when the Miku
-- accepted. Readable by the client of the visit, its Miku, a verified Miku while the request is
-- still open (they read it before accepting; they then appear as the Miku), and the admin for a
-- disputed visit. Anyone else gets null.
create or replace function public.kontrata_e_vizites(vid uuid)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'vizita_id', v.id,
    'lloji', v.lloji,
    'data', v.data_vizites,
    'udhezime', v.udhezime,
    'statusi', v.statusi,
    'prona_emri', p.emri,
    'prona_vendi', p.vendi,
    'klienti_emri', k.emri,
    'pelqimi_at', v.pelqimi_at,
    'kushtet_versioni', v.kushtet_versioni,
    'miku_emri', coalesce(v.miku_emri, m.emri),
    'miku_lloji', m.miku_lloji,
    'miku_biznesi', m.miku_biznesi,
    'miku_nrb', m.miku_nrb,
    'miku_verifikuar_at', m.verifikuar_at,
    'kontrata_versioni', v.kontrata_versioni,
    'kontrata_pranuar_at', v.kontrata_pranuar_at
  )
  from public.vizitat v
  join public.pronat p on p.id = v.prona_id
  left join public.profiles k on k.id = v.pronari_id
  left join public.profiles m on m.id = (
    case
      when v.miku_id is not null then v.miku_id
      when v.statusi = 'kerkuar' and public.miku_i_verifikuar() then (select auth.uid())
    end
  )
  where v.id = vid
    and (
      v.pronari_id = (select auth.uid())
      or v.miku_id = (select auth.uid())
      or (v.statusi = 'kerkuar' and public.miku_i_verifikuar())
      or (public.roli_im() = 'admin' and v.statusi = 'kundershtuar')
    )
$$;

revoke all on function public.kontrata_e_vizites(uuid) from public, anon;
grant execute on function public.kontrata_e_vizites(uuid) to authenticated;

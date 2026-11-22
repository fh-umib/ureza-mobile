-- Urëza: the exact location of a property (for the map and the GPS check). Not part of a course week.
-- Run once in Supabase: SQL Editor > New query > paste > Run. It is safe to run again.
-- Run supabase/pronat.sql, supabase/vizitat.sql and supabase/roli.sql first.
--
-- The exact position of a house is more sensitive than its town, so it lives in its own table,
-- not in a column of "pronat" (a policy cannot hide one column of a row):
--   * the owner (client) reads and sets it;
--   * a Miku reads it only while they hold the visit: from the moment they accept it until the
--     client has decided on the report, never on an open request that nobody accepted yet;
--   * an admin reads it only for a property whose visit report was disputed (for the GPS check
--     of the case, see supabase/admini.sql), never for the others;
--   * nobody writes the table directly: the position is saved through vendos_vendndodhjen().

-- 1 · The table ------------------------------------------------------------------------
create table if not exists public.pronat_vendi (
  prona_id uuid primary key references public.pronat (id) on delete cascade,
  gjeresia double precision not null check (gjeresia between -90 and 90),   -- latitude
  gjatesia double precision not null check (gjatesia between -180 and 180), -- longitude
  updated_at timestamptz not null default now()
);

alter table public.pronat_vendi enable row level security;
revoke all on public.pronat_vendi from anon;
revoke all on public.pronat_vendi from authenticated;
grant select on public.pronat_vendi to authenticated;

-- 2 · Who may read it ------------------------------------------------------------------
-- A security definer function, for the same reason as miku_sheh_pronen() in roli.sql: it reads
-- "pronat" and "vizitat" without going through their policies again.
create or replace function public.mund_ta_shohe_vendin(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (select 1 from public.pronat p where p.id = pid and p.pronari_id = (select auth.uid()))
    or (
      public.roli_im() = 'admin'
      and exists (select 1 from public.vizitat v where v.prona_id = pid and v.statusi = 'kundershtuar')
    )
    or (
      public.roli_im() = 'miku'
      and exists (
        select 1 from public.vizitat v
        where v.prona_id = pid
          and v.miku_id = (select auth.uid())
          and v.statusi in ('pranuar', 'vizita', 'raporti_gati')
      )
    )
$$;

revoke all on function public.mund_ta_shohe_vendin(uuid) from public, anon;
grant execute on function public.mund_ta_shohe_vendin(uuid) to authenticated;

drop policy if exists "read vendi of own, held or any (admin)" on public.pronat_vendi;
drop policy if exists "read vendi of own, held or disputed (admin)" on public.pronat_vendi;
create policy "read vendi of own, held or disputed (admin)"
  on public.pronat_vendi for select to authenticated
  using (public.mund_ta_shohe_vendin(prona_id));

-- 3 · Saving it -----------------------------------------------------------------------
-- Sets the exact position of one of the caller's properties; both numbers null removes it.
-- Errors (the app shows their text):
--   22023  one number is missing, or a number is outside the valid range
--   P0002  the property does not exist, or it is not the caller's
--   28000  nobody is signed in
create or replace function public.vendos_vendndodhjen(pid uuid, lat double precision, lng double precision)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Hyr në llogari për ta ruajtur vendndodhjen.' using errcode = '28000';
  end if;

  if not exists (select 1 from public.pronat p where p.id = pid and p.pronari_id = (select auth.uid())) then
    raise exception 'Kjo pronë nuk ekziston, ose nuk është e jotja.' using errcode = 'P0002';
  end if;

  if lat is null and lng is null then
    delete from public.pronat_vendi where prona_id = pid;
    return;
  end if;

  if lat is null or lng is null
     or lat = 'NaN'::double precision or lng = 'NaN'::double precision
     or lat not between -90 and 90 or lng not between -180 and 180 then
    raise exception 'Koordinatat nuk janë të sakta (gjerësia -90 deri 90, gjatësia -180 deri 180).' using errcode = '22023';
  end if;

  insert into public.pronat_vendi as v (prona_id, gjeresia, gjatesia)
  values (pid, lat, lng)
  on conflict (prona_id) do update
    set gjeresia = excluded.gjeresia, gjatesia = excluded.gjatesia, updated_at = now();
end;
$$;

revoke all on function public.vendos_vendndodhjen(uuid, double precision, double precision) from public, anon;
grant execute on function public.vendos_vendndodhjen(uuid, double precision, double precision) to authenticated;

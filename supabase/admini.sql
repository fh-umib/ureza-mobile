-- Urëza: the Admin panel (disputed reports and Miku verification). Not part of a course week.
-- Run once in Supabase: SQL Editor > New query > paste > Run. It is safe to run again.
-- Run supabase/pronat.sql, vizitat.sql, roli.sql, profili.sql, harta.sql, deshmia.sql and
-- raporti.sql first. The admin role itself is given by hand (see the end of roli.sql).
--
-- What an admin can do, and nothing more:
--   * see how many visits there are in each status (numbers only, through one function);
--   * read a visit only when its client has disputed the report ('kundershtuar'), with the
--     property name, the evidence rows and the evidence files of that visit;
--   * close a disputed case with a decision and a note, through shqyrto_rastin();
--   * see the list of Mikus and verify them, through mikut_per_adminin() and verifiko_mikun().
-- Clients and Mikus keep their own rules. They read the admin's decision on their own visit,
-- because it is stored in columns of that visit row.

-- 1 · New columns ----------------------------------------------------------------------
alter table public.vizitat add column if not exists shqyrtuar_at timestamptz;
alter table public.vizitat add column if not exists vendimi_adminit text;
alter table public.vizitat add column if not exists shenimi_adminit text;

alter table public.vizitat drop constraint if exists vizitat_vendimi_adminit_check;
alter table public.vizitat
  add constraint vizitat_vendimi_adminit_check check (vendimi_adminit is null or vendimi_adminit in ('klienti', 'miku'));

alter table public.vizitat drop constraint if exists vizitat_shenimi_adminit_gjatesia;
alter table public.vizitat
  add constraint vizitat_shenimi_adminit_gjatesia
  check (shenimi_adminit is null or char_length(shenimi_adminit) between 10 and 500);

-- A case is either open (all three empty) or closed (all three set).
alter table public.vizitat drop constraint if exists vizitat_shqyrtimi_i_plote;
alter table public.vizitat
  add constraint vizitat_shqyrtimi_i_plote check (
    (shqyrtuar_at is null) = (vendimi_adminit is null)
    and (shqyrtuar_at is null) = (shenimi_adminit is null)
  );

-- When the Urëza team verified a Miku (null = not verified).
alter table public.profiles add column if not exists verifikuar_at timestamptz;

-- Nobody gets an update grant on these columns: only the functions below write them.

-- 2 · What an admin may read -------------------------------------------------------------
drop policy if exists "admin reads disputed vizitat" on public.vizitat;
create policy "admin reads disputed vizitat"
  on public.vizitat for select to authenticated
  using ((select public.roli_im()) = 'admin' and statusi = 'kundershtuar');

-- The property name of a disputed visit. A security definer function, for the same reason as
-- miku_sheh_pronen() in roli.sql: it reads "vizitat" without going through its policies again.
create or replace function public.admini_sheh_pronen(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.roli_im() = 'admin'
    and exists (select 1 from public.vizitat v where v.prona_id = pid and v.statusi = 'kundershtuar')
$$;

revoke all on function public.admini_sheh_pronen(uuid) from public, anon;
grant execute on function public.admini_sheh_pronen(uuid) to authenticated;

drop policy if exists "admin reads pronat of disputed vizitat" on public.pronat;
create policy "admin reads pronat of disputed vizitat"
  on public.pronat for select to authenticated
  using (public.admini_sheh_pronen(id));

-- The evidence of a disputed visit (rows and files), to judge the case.
drop policy if exists "admin reads deshmite of disputed vizitat" on public.deshmite;
create policy "admin reads deshmite of disputed vizitat"
  on public.deshmite for select to authenticated
  using (
    (select public.roli_im()) = 'admin'
    and exists (select 1 from public.vizitat v where v.id = deshmite.vizita_id and v.statusi = 'kundershtuar')
  );

drop policy if exists "admin reads files of disputed vizitat" on storage.objects;
create policy "admin reads files of disputed vizitat"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'deshmite'
    and (select public.roli_im()) = 'admin'
    and exists (
      select 1 from public.vizitat v
      where v.id::text = (storage.foldername(name))[1]
        and v.statusi = 'kundershtuar'
    )
  );

-- 3 · The overview: how many visits are in each status (numbers only) --------------------
-- Errors: 42501 the caller is not an admin.
create or replace function public.permbledhja_e_vizitave()
returns table (gjendja text, numri bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.roli_im() is distinct from 'admin' then
    raise exception 'Vetëm admini e sheh këtë përmbledhje.' using errcode = '42501';
  end if;
  return query
    select v.statusi, count(*) from public.vizitat v group by v.statusi;
end;
$$;

revoke all on function public.permbledhja_e_vizitave() from public, anon;
grant execute on function public.permbledhja_e_vizitave() to authenticated;

-- 4 · The Mikus ---------------------------------------------------------------------------
-- Every profile with the Miku role, the ones not verified yet first, with the number of visits
-- they have accepted. Errors: 42501 the caller is not an admin.
create or replace function public.mikut_per_adminin()
returns table (
  miku_id uuid,
  emri text,
  telefoni text,
  krijuar_at timestamptz,
  verifikuar_at timestamptz,
  vizita bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if public.roli_im() is distinct from 'admin' then
    raise exception 'Vetëm admini e sheh listën e Mikut.' using errcode = '42501';
  end if;
  return query
    select p.id, p.emri, p.telefoni, p.created_at, p.verifikuar_at,
           (select count(*) from public.vizitat v where v.miku_id = p.id)
    from public.profiles p
    where p.roli = 'miku'
    order by p.verifikuar_at is not null, p.created_at desc;
end;
$$;

revoke all on function public.mikut_per_adminin() from public, anon;
grant execute on function public.mikut_per_adminin() to authenticated;

-- verifikuar = true  : verifies the Miku (keeps the first time if they already are)
-- verifikuar = false : removes the verification
-- Returns the time of the verification, or null when there is none.
-- Errors: 28000 nobody is signed in, 42501 not an admin, P0002 no Miku with this id.
create or replace function public.verifiko_mikun(mid uuid, verifikuar boolean)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  koha timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Hyr në llogari.' using errcode = '28000';
  end if;
  if public.roli_im() is distinct from 'admin' then
    raise exception 'Vetëm admini mund ta verifikojë një Miku.' using errcode = '42501';
  end if;

  update public.profiles p
     set verifikuar_at = case when verifikuar then coalesce(p.verifikuar_at, now()) else null end
   where p.id = mid
     and p.roli = 'miku'
  returning p.verifikuar_at into koha;

  if not found then
    raise exception 'Ky Miku nuk u gjet.' using errcode = 'P0002';
  end if;
  return koha;
end;
$$;

revoke all on function public.verifiko_mikun(uuid, boolean) from public, anon;
grant execute on function public.verifiko_mikun(uuid, boolean) to authenticated;

-- 5 · Closing a disputed case ------------------------------------------------------------
-- ne_favor_te_klientit = true  : the client is right (vendimi_adminit = 'klienti')
-- ne_favor_te_klientit = false : the report stands (vendimi_adminit = 'miku')
-- The note says why, and what happens next; both the client and the Miku read it.
-- The status stays 'kundershtuar', so the history of the visit keeps the dispute.
-- Returns the time of the decision (the server's clock).
-- Errors: 28000 nobody is signed in, 42501 not an admin, 22023 the note is too short or too long,
--         P0002 the visit is not a disputed case that is still open.
create or replace function public.shqyrto_rastin(vid uuid, ne_favor_te_klientit boolean, shenimi text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  shenimi_i_pastruar text := nullif(btrim(shenimi), '');
  koha timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Hyr në llogari.' using errcode = '28000';
  end if;
  if public.roli_im() is distinct from 'admin' then
    raise exception 'Vetëm admini mund ta shqyrtojë një rast.' using errcode = '42501';
  end if;
  if shenimi_i_pastruar is null or char_length(shenimi_i_pastruar) < 10 then
    raise exception 'Shkruaj shënimin e vendimit (të paktën 10 shkronja).' using errcode = '22023';
  end if;
  if char_length(shenimi_i_pastruar) > 500 then
    raise exception 'Shënimi është shumë i gjatë (më së shumti 500 shkronja).' using errcode = '22023';
  end if;

  update public.vizitat v
     set shqyrtuar_at = now(),
         vendimi_adminit = case when ne_favor_te_klientit then 'klienti' else 'miku' end,
         shenimi_adminit = shenimi_i_pastruar
   where v.id = vid
     and v.statusi = 'kundershtuar'
     and v.shqyrtuar_at is null
  returning v.shqyrtuar_at into koha;

  if not found then
    raise exception 'Ky rast nuk pret shqyrtim: ndoshta u shqyrtua tashmë.' using errcode = 'P0002';
  end if;
  return koha;
end;
$$;

revoke all on function public.shqyrto_rastin(uuid, boolean, text) from public, anon;
grant execute on function public.shqyrto_rastin(uuid, boolean, text) to authenticated;

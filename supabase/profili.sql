-- Urëza: the settings of a profile (phone, language of the reports, notification choices) and the
-- request to delete an account. Not part of a course week.
-- Run once in Supabase: SQL Editor > New query > paste > Run. It is safe to run again.
-- Run supabase/roli.sql first.
--
-- All of it lives in the user's own row of "profiles", so the rules that already exist apply:
-- a user reads and changes only their own row, and nobody can make themselves an admin.

-- 1 · New columns ----------------------------------------------------------------------
alter table public.profiles add column if not exists telefoni text;
alter table public.profiles add column if not exists gjuha_raporteve text not null default 'sq';
alter table public.profiles add column if not exists njofto_pranimin boolean not null default true;
alter table public.profiles add column if not exists njofto_raportin boolean not null default true;
alter table public.profiles add column if not exists njofto_kujtesen boolean not null default false;
alter table public.profiles add column if not exists fshirja_kerkuar_at timestamptz;

-- The phone is optional; the app checks the digits, the database only the shape and the length.
alter table public.profiles drop constraint if exists profiles_telefoni_check;
alter table public.profiles
  add constraint profiles_telefoni_check check (telefoni is null or telefoni ~ '^\+?[0-9() -]{6,24}$');

alter table public.profiles drop constraint if exists profiles_gjuha_raporteve_check;
alter table public.profiles
  add constraint profiles_gjuha_raporteve_check check (gjuha_raporteve in ('sq', 'de', 'en'));

-- 2 · What a user may change -------------------------------------------------------------
-- (the deletion request is not here: it is set only by kerko_fshirjen() below, with the server's clock)
grant update (telefoni, gjuha_raporteve, njofto_pranimin, njofto_raportin, njofto_kujtesen)
  on public.profiles to authenticated;

-- roli.sql keeps an admin out of the update policy, so an admin could not even change their own
-- name or phone. This replaces that policy with one that treats both sides in one place:
--   * a Klient or a Miku changes their own row, and the role stays 'klient' or 'miku';
--   * an Admin changes their own row, and the role stays 'admin'.
-- (One policy on purpose: with two policies Postgres accepts a new row that passes the check of
-- either of them, which would let a Klient turn their own row into an admin one.)
-- roli_im() is the role the row has now, before the change.
drop policy if exists "admin updates own profile" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and (
      (roli in ('klient', 'miku') and (select public.roli_im()) <> 'admin')
      or (roli = 'admin' and (select public.roli_im()) = 'admin')
    )
  );

-- 3 · Asking for the account to be deleted -----------------------------------------------
-- The files of a visit (photos, voice notes) live in Storage, where a user cannot remove them,
-- so the app does not delete the account by itself: it records the request and the Urëza team
-- deletes the account and its files. The request can be cancelled until then.
-- kerkuar = true  : records the request (keeps the first time if there already is one)
-- kerkuar = false : cancels it
-- Returns the time of the request, or null when there is none.
-- Errors (the app shows their text):
--   28000  nobody is signed in
--   P0002  the user has no profile yet
create or replace function public.kerko_fshirjen(kerkuar boolean)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  koha timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Hyr në llogari për ta dërguar kërkesën.' using errcode = '28000';
  end if;

  update public.profiles
    set fshirja_kerkuar_at = case when coalesce(kerkuar, false) then coalesce(fshirja_kerkuar_at, now()) else null end
    where id = (select auth.uid())
    returning fshirja_kerkuar_at into koha;

  if not found then
    raise exception 'Profili nuk u gjet.' using errcode = 'P0002';
  end if;

  return koha;
end;
$$;

revoke all on function public.kerko_fshirjen(boolean) from public, anon;
grant execute on function public.kerko_fshirjen(boolean) to authenticated;

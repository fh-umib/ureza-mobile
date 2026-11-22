-- Urëza: the client's decision on a visit report (approve or object). Not part of a course week.
-- Run once in Supabase: SQL Editor > New query > paste > Run. It is safe to run again.
-- Run supabase/pronat.sql, supabase/vizitat.sql, supabase/roli.sql and supabase/deshmia.sql first.
--
-- When the Miku has sent the evidence (status 'raporti_gati') the client who owns the visit
-- decides: 'miratuar' (approved) or 'kundershtuar' (objected, with a reason that an admin reads).
-- The decision goes through one function, vendos_raportin(). A client never updates the visit
-- row directly, so they cannot change anything but the decision (not the Miku, not the times),
-- and the time of the decision comes from the server's clock.

-- 1 · New columns on the visit ---------------------------------------------------------
alter table public.vizitat add column if not exists vendosur_at timestamptz;
alter table public.vizitat add column if not exists arsyeja text;

alter table public.vizitat drop constraint if exists vizitat_arsyeja_gjatesia;
alter table public.vizitat
  add constraint vizitat_arsyeja_gjatesia check (arsyeja is null or char_length(arsyeja) between 10 and 500);

-- 2 · The decision ---------------------------------------------------------------------
-- Returns the new status. Errors (the app shows their text):
--   22023  the reason is missing, too short or too long
--   P0002  the visit is not waiting for a decision, or it is not the caller's
--   28000  nobody is signed in
-- security definer: the function updates the row itself after checking who is calling.
create or replace function public.vendos_raportin(vid uuid, miratuar boolean, arsyeja text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  arsyeja_e_pastruar text := nullif(btrim(arsyeja), '');
  statusi_i_ri text;
begin
  if (select auth.uid()) is null then
    raise exception 'Hyr në llogari për ta vendosur raportin.' using errcode = '28000';
  end if;

  if miratuar then
    statusi_i_ri := 'miratuar';
    arsyeja_e_pastruar := null;
  else
    statusi_i_ri := 'kundershtuar';
    if arsyeja_e_pastruar is null or char_length(arsyeja_e_pastruar) < 10 then
      raise exception 'Shkruaj pse e kundërshton raportin (të paktën 10 shkronja).' using errcode = '22023';
    end if;
    if char_length(arsyeja_e_pastruar) > 500 then
      raise exception 'Arsyeja është shumë e gjatë (më së shumti 500 shkronja).' using errcode = '22023';
    end if;
  end if;

  update public.vizitat v
     set statusi = statusi_i_ri,
         vendosur_at = now(),
         arsyeja = arsyeja_e_pastruar
   where v.id = vid
     and v.pronari_id = (select auth.uid())
     and v.statusi = 'raporti_gati';

  if not found then
    raise exception 'Ky raport nuk është gati për vendim, ose nuk është i yti.' using errcode = 'P0002';
  end if;

  return statusi_i_ri;
end;
$$;

revoke all on function public.vendos_raportin(uuid, boolean, text) from public, anon;
grant execute on function public.vendos_raportin(uuid, boolean, text) to authenticated;

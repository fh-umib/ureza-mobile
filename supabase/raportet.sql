-- Urëza: the Miku's written report of a visit, shown to the client in their language.
-- Run once in Supabase: SQL Editor > New query > paste > Run. It is safe to run again.
-- Run it after supabase/deshmia.sql and supabase/admini.sql. It replaces the policy
-- "miku sends vizita" of deshmia.sql, so after running deshmia.sql again, run this file again too.
--
-- While the visit is going on (status 'vizita') the Miku fills a short checklist: every point is
-- fine, has a problem or was not checked, with an optional comment, and an overall conclusion.
-- The app stores the answers (not sentences) and writes the report in the client's language
-- (Shqip, Deutsch, English) from fixed texts, so the same report reads the same in every language.
-- The Miku's own comments stay as written, in Albanian. (Not the same as supabase/raporti.sql,
-- which records the client's decision on the report.)

-- 1 · The table ------------------------------------------------------------------------
create table if not exists public.raportet (
  vizita_id uuid primary key references public.vizitat (id) on delete cascade,
  -- { "pikat": [{ "id": "cati", "gjendja": "mire", "koment": "" }, ...],
  --   "perfundimi": "mire" | "vemendje" | "urgjent", "shenimi": "" }
  permbajtja jsonb not null,
  versioni smallint not null default 1,
  shkruar_at timestamptz not null default now()  -- the server's clock, not the phone's
);

alter table public.raportet drop constraint if exists raportet_forma;
alter table public.raportet
  add constraint raportet_forma check (
    jsonb_typeof(permbajtja) = 'object'
    and jsonb_typeof(permbajtja -> 'pikat') = 'array'
    and jsonb_array_length(permbajtja -> 'pikat') between 1 and 12
    and permbajtja ->> 'perfundimi' in ('mire', 'vemendje', 'urgjent')
    and octet_length(permbajtja::text) <= 8000
  );

-- Every save moves the time to the server's clock.
create or replace function public.raportet_koha()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.shkruar_at := now();
  return new;
end;
$$;

drop trigger if exists raportet_koha on public.raportet;
create trigger raportet_koha
  before insert or update on public.raportet
  for each row execute function public.raportet_koha();

alter table public.raportet enable row level security;
revoke all on public.raportet from anon;
revoke all on public.raportet from authenticated;
grant select on public.raportet to authenticated;
grant insert (vizita_id, permbajtja, versioni) on public.raportet to authenticated;
grant update (permbajtja, versioni) on public.raportet to authenticated;

-- 2 · Who reads and who writes ---------------------------------------------------------
-- The client who owns the visit and the Miku who did it read the report.
drop policy if exists "owner and miku read raportet" on public.raportet;
create policy "owner and miku read raportet"
  on public.raportet for select to authenticated
  using (
    exists (
      select 1 from public.vizitat v
      where v.id = raportet.vizita_id
        and (v.pronari_id = (select auth.uid()) or v.miku_id = (select auth.uid()))
    )
  );

-- An admin reads it only when the client has disputed the report (like the evidence).
drop policy if exists "admin reads raportet of disputed vizitat" on public.raportet;
create policy "admin reads raportet of disputed vizitat"
  on public.raportet for select to authenticated
  using (
    (select public.roli_im()) = 'admin'
    and exists (select 1 from public.vizitat v where v.id = raportet.vizita_id and v.statusi = 'kundershtuar')
  );

-- Only the Miku of the visit writes it, and only while the visit is going on.
drop policy if exists "miku writes raportet" on public.raportet;
create policy "miku writes raportet"
  on public.raportet for insert to authenticated
  with check (
    exists (
      select 1 from public.vizitat v
      where v.id = raportet.vizita_id
        and v.miku_id = (select auth.uid())
        and v.statusi = 'vizita'
    )
  );

drop policy if exists "miku changes raportet" on public.raportet;
create policy "miku changes raportet"
  on public.raportet for update to authenticated
  using (
    exists (
      select 1 from public.vizitat v
      where v.id = raportet.vizita_id
        and v.miku_id = (select auth.uid())
        and v.statusi = 'vizita'
    )
  )
  with check (
    exists (
      select 1 from public.vizitat v
      where v.id = raportet.vizita_id
        and v.miku_id = (select auth.uid())
        and v.statusi = 'vizita'
    )
  );

-- 3 · A visit is sent only with its report ----------------------------------------------
create or replace function public.raporti_i_shkruar(vid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.raportet where vizita_id = vid)
$$;

revoke all on function public.raporti_i_shkruar(uuid) from public, anon;
grant execute on function public.raporti_i_shkruar(uuid) to authenticated;

-- The same rule as in deshmia.sql, plus the report.
drop policy if exists "miku sends vizita" on public.vizitat;
create policy "miku sends vizita"
  on public.vizitat for update to authenticated
  using (miku_id = (select auth.uid()) and statusi = 'vizita')
  with check (
    miku_id = (select auth.uid())
    and statusi = 'raporti_gati'
    and public.deshmia_e_plote(id)
    and public.raporti_i_shkruar(id)
  );

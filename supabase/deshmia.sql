-- Urëza: the evidence of a visit (GPS, live photos, a voice note). Not part of a course week.
-- Run once in Supabase: SQL Editor > New query > paste > Run. It is safe to run again.
-- Run supabase/pronat.sql, supabase/vizitat.sql and supabase/roli.sql first.
--
-- The Miku starts an accepted visit (status 'pranuar' -> 'vizita'), collects the evidence and
-- sends it (status 'vizita' -> 'raporti_gati'). The database refuses to send a visit that has no
-- GPS position, no photo or no voice note. Photos and the voice note are files in a private
-- Storage bucket ('deshmite'); only the client who owns the visit and the Miku can read them.

-- 1 · New columns on the visit ---------------------------------------------------------
alter table public.vizitat add column if not exists filluar_at timestamptz;
alter table public.vizitat add column if not exists derguar_at timestamptz;

grant update (statusi, miku_id, miku_emri, pranuar_at, filluar_at, derguar_at) on public.vizitat to authenticated;

-- 2 · The evidence table ---------------------------------------------------------------
create table if not exists public.deshmite (
  id uuid primary key default gen_random_uuid(),
  vizita_id uuid not null references public.vizitat (id) on delete cascade,
  lloji text not null check (lloji in ('gps', 'foto', 'zeri')),
  rruga text,                 -- the file in Storage (photo, voice note)
  gjeresia double precision,  -- GPS: latitude
  gjatesia double precision,  -- GPS: longitude
  saktesia double precision,  -- GPS: accuracy in metres
  kohezgjatja integer,        -- voice note: seconds
  regjistruar_at timestamptz not null default now(),  -- the server's clock, not the phone's
  check (lloji <> 'gps' or (gjeresia is not null and gjatesia is not null)),
  check (lloji = 'gps' or rruga is not null)
);

-- One GPS position and one voice note per visit (a new one replaces the old).
create unique index if not exists deshmite_gps_vlera on public.deshmite (vizita_id) where lloji = 'gps';
create unique index if not exists deshmite_zeri_vlera on public.deshmite (vizita_id) where lloji = 'zeri';
create index if not exists deshmite_vizita_idx on public.deshmite (vizita_id, regjistruar_at);

alter table public.deshmite enable row level security;
revoke all on public.deshmite from anon;
revoke all on public.deshmite from authenticated;
grant select, delete on public.deshmite to authenticated;
grant insert (vizita_id, lloji, rruga, gjeresia, gjatesia, saktesia, kohezgjatja) on public.deshmite to authenticated;

-- The client who owns the visit and the Miku who accepted it can read the evidence.
drop policy if exists "owner and miku read deshmite" on public.deshmite;
create policy "owner and miku read deshmite"
  on public.deshmite for select to authenticated
  using (
    exists (
      select 1 from public.vizitat v
      where v.id = deshmite.vizita_id
        and (v.pronari_id = (select auth.uid()) or v.miku_id = (select auth.uid()))
    )
  );

-- Only the Miku of the visit adds or removes evidence, and only while the visit is going on.
drop policy if exists "miku adds deshmite" on public.deshmite;
create policy "miku adds deshmite"
  on public.deshmite for insert to authenticated
  with check (
    exists (
      select 1 from public.vizitat v
      where v.id = deshmite.vizita_id
        and v.miku_id = (select auth.uid())
        and v.statusi = 'vizita'
    )
  );

drop policy if exists "miku removes deshmite" on public.deshmite;
create policy "miku removes deshmite"
  on public.deshmite for delete to authenticated
  using (
    exists (
      select 1 from public.vizitat v
      where v.id = deshmite.vizita_id
        and v.miku_id = (select auth.uid())
        and v.statusi = 'vizita'
    )
  );

-- 3 · Starting and sending a visit -----------------------------------------------------
-- true when the visit has a GPS position, at least one photo and a voice note.
-- (security definer: it counts the rows without going through the policies again)
create or replace function public.deshmia_e_plote(vid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (select 1 from public.deshmite where vizita_id = vid and lloji = 'gps')
    and exists (select 1 from public.deshmite where vizita_id = vid and lloji = 'foto')
    and exists (select 1 from public.deshmite where vizita_id = vid and lloji = 'zeri')
$$;

revoke all on function public.deshmia_e_plote(uuid) from public, anon;
grant execute on function public.deshmia_e_plote(uuid) to authenticated;

-- The Miku starts the visit they accepted ...
drop policy if exists "miku starts vizita" on public.vizitat;
create policy "miku starts vizita"
  on public.vizitat for update to authenticated
  using (miku_id = (select auth.uid()) and statusi = 'pranuar')
  with check (miku_id = (select auth.uid()) and statusi = 'vizita');

-- ... and sends it once the evidence is complete.
drop policy if exists "miku sends vizita" on public.vizitat;
create policy "miku sends vizita"
  on public.vizitat for update to authenticated
  using (miku_id = (select auth.uid()) and statusi = 'vizita')
  with check (
    miku_id = (select auth.uid())
    and statusi = 'raporti_gati'
    and public.deshmia_e_plote(id)
  );

-- 4 · Files (photos and the voice note) ------------------------------------------------
-- Private bucket, 10 MB per file, only pictures and audio. The first folder of a file's
-- path is the id of its visit, so the policies below can find the visit.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'deshmite', 'deshmite', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/mpeg', 'audio/webm', 'audio/3gpp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owner and miku read deshmite files" on storage.objects;
create policy "owner and miku read deshmite files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'deshmite'
    and exists (
      select 1 from public.vizitat v
      where v.id::text = (storage.foldername(name))[1]
        and (v.pronari_id = (select auth.uid()) or v.miku_id = (select auth.uid()))
    )
  );

drop policy if exists "miku uploads deshmite files" on storage.objects;
create policy "miku uploads deshmite files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'deshmite'
    and exists (
      select 1 from public.vizitat v
      where v.id::text = (storage.foldername(name))[1]
        and v.miku_id = (select auth.uid())
        and v.statusi = 'vizita'
    )
  );

drop policy if exists "miku removes deshmite files" on storage.objects;
create policy "miku removes deshmite files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'deshmite'
    and exists (
      select 1 from public.vizitat v
      where v.id::text = (storage.foldername(name))[1]
        and v.miku_id = (select auth.uid())
        and v.statusi = 'vizita'
    )
  );

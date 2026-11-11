-- Shablloni i javës 6 për tabelën e ekipit (karta e studentit, hapat A, C).
-- Vazhdon tabelën tasks të shabllonit të javës 5.
-- Ndërroni emrin e tabelës dhe email-in. Pjesa A në fillim të orës;
-- pjesa C pasi të dyja llogaritë janë krijuar nga aplikacioni (hapi B).
-- "if exists" / "if not exists" lejojnë Run sërish pas një gabimi.

-- #region fshi-zhvillim
-- A · Dera mbyllet: policy-të e javës 5 fshihen, anon s'ka më qasje.
drop policy if exists "public can read tasks" on public.tasks;
drop policy if exists "public can add tasks" on public.tasks;
drop policy if exists "public can change task status" on public.tasks;
revoke all on public.tasks from anon;
alter table public.tasks enable row level security;
-- #endregion

-- #region pronari
-- C1 · Pronari i çdo rreshti: llogaria që e krijoi (default auth.uid()).
alter table public.tasks
  add column if not exists pronari_id uuid default auth.uid()
  references auth.users (id) on delete cascade;
update public.tasks
  set pronari_id = (
    select id from auth.users where email = 'fluturahysenni@gmail.com')
  where pronari_id is null;
alter table public.tasks alter column pronari_id set not null;
create index if not exists tasks_pronari_idx
  on public.tasks (pronari_id);
-- #endregion

-- #region qasja
-- C2 · Qasja dhe rregullat për përdoruesin e kyçur.
grant select, insert, update on public.tasks to authenticated;
create policy "secili lexon të vetat"
  on public.tasks for select to authenticated
  using (pronari_id = (select auth.uid()));
create policy "secili shton vetëm për vete"
  on public.tasks for insert to authenticated
  with check (pronari_id = (select auth.uid()));
create policy "secili ndryshon të vetat"
  on public.tasks for update to authenticated
  using (pronari_id = (select auth.uid()))
  with check (pronari_id = (select auth.uid()));
-- #endregion

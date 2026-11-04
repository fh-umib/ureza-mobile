-- M3: allow changing the status from the app (only the "status" column; demo, synthetic data).
-- Run in Supabase: SQL Editor > New query > Run.

-- anon cannot change any other column, only status
revoke update on public.tasks from anon;
grant update (status) on public.tasks to anon;

drop policy if exists "public can change task status" on public.tasks;
create policy "public can change task status"
  on public.tasks
  for update
  to anon
  using (true)
  with check (status in ('pending', 'completed'));

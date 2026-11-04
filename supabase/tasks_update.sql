-- M3: lejo ndryshimin e statusit nga aplikacioni (vetëm kolona "status"; demo, të dhëna testuese).
-- Ekzekutoje te Supabase -> SQL Editor -> Run.

-- anon nuk mund të ndryshojë asnjë kolonë tjetër, vetëm status
revoke update on public.tasks from anon;
grant update (status) on public.tasks to anon;

drop policy if exists "public can change task status" on public.tasks;
create policy "public can change task status"
  on public.tasks
  for update
  to anon
  using (true)
  with check (status in ('pending', 'completed'));

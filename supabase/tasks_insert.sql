-- M2: lejo shtimin e detyrave nga aplikacioni (vetëm demo, të dhëna testuese).
-- Ekzekutoje te Supabase -> SQL Editor -> Run.

-- id merret automatikisht nga baza (aplikacioni nuk e dërgon)
alter table public.tasks
  alter column id set default gen_random_uuid()::text;

grant insert on public.tasks to anon;

drop policy if exists "public can add tasks" on public.tasks;
create policy "public can add tasks"
  on public.tasks
  for insert
  to anon
  with check (
    char_length(title) between 1 and 80
    and char_length(location) between 1 and 80
    and status = 'pending'
  );

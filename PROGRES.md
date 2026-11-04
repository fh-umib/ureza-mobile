# URËZA — PROGRES (J5, November 4, 2026)

**Project:** Urëza · **Team:** Flutura Hyseni & Tringa Hyseni · **Route:** 3 — Startup

Today I connected the app to Supabase while working with an AI agent. This document shows what works, what the agent did, what I did, and the next step.

## 1. Missions

| Mission | Status | Evidence in the repo |
|---|---|---|
| **M0** — `AGENTS.md` from EKIPI, BISEDAT, HARTA | Done | Commit `434ee14`. The agent (GitHub Copilot Chat) summarized the idea correctly: the client creates a request, Miku accepts it and performs the visit, the client approves or disputes the report, approved visits are stored in Oda, with Supabase as the backend. |
| **M1** — the app reads something real from Supabase | Done | Commits `6e161c8` and `d6897c3`. The task list comes from the `tasks` table; the phone shows "Të dhëna nga Supabase (5)". |
| **M2** — the user adds something from the phone and it persists | Done | Commit `c3e1166`. The "Shto detyrë të re" form inserts a row into `tasks`; the row is still there after closing and reopening the app. |
| **M3** (challenge) — the main HARTA screen with real data | Done for screen 1 | Screen 1 (Home / My Tasks) reads, adds and changes status with real data, and the task details are read from Supabase. Code: `src/app/index.tsx`, `src/app/artikull/[id].tsx`, `supabase/tasks_update.sql`. Screen 2 (Create Request with visit type and instructions) is not built yet. |

**In class (November 4, 11:30–13:00):** M0, M1 and M2, with commits `434ee14` (12:05), `6e161c8` (12:25), `d6897c3` (12:26), `c3e1166` (12:41) and `58bb6ea` (12:53).

**Outside class (November 4, after the lesson):** M3 (the challenge), commit `3027c78` (15:27), and the documents: updates to `README.md`, `EKIPI.md` and `PITCH.md` (`d04d997` at 14:15, `18919ba` at 14:16), and this `PROGRES.md` with the M3 documentation updates (`c31a48b` at 15:28).

## 2. What works now

- The home screen loads the task list from Supabase (`src/lib/supabase.ts`, `src/app/index.tsx`), with the newest task first.
- When there is no network or no table, the app falls back to the local sample data and shows "Offline" on screen.
- The form adds a new task (title and location) and refreshes the list. If saving fails, the error is shown on screen instead of failing silently.
- The "Ndrysho statusin" button saves the status to Supabase (`update`); if saving fails, the status is rolled back and the error is shown on screen.
- The details screen reads the task from Supabase by id, so tasks added from the phone also open.
- The `tasks` table has the columns `id`, `title`, `location`, `status` (`pending` or `completed`) and `created_at`; the SQL is in `supabase/tasks.sql`, `supabase/tasks_insert.sql` and `supabase/tasks_update.sql`.

## 3. What the agent did and what I did

**The agent (Claude; Copilot Chat only for the M0 summary):**
- wrote the "Urëza" section of `AGENTS.md`, `.env.example` and the `.gitignore` rule that keeps `.env` out of Git;
- wrote the Supabase client, the SQL for the table with 5 test rows, and the RLS policies;
- changed `src/app/index.tsx` to read from Supabase, added the form with `insert` and the status saving with `update`;
- changed the details screen to read from Supabase and wrote `supabase/tasks_update.sql` (UPDATE for the `status` column only);
- updated `AGENTS.md`, `README.md` and `EKIPI.md` when the state of the project changed.

**Me:**
- created the organization and the project in Supabase, ran the SQL and created `.env` with the keys;
- installed the packages with `npx expo install` and tested every step on my iPhone;
- read `git diff` before every commit and committed after every working step;
- fixed the variable name in `.env` when the app reported the missing-`.env` error (it was `EXPO_PUBLIC_SUPABASE_KEY`, the code expects `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).

## 4. Security

- The publishable key (`sb_publishable_…`) is only in `.env`, which is not committed to Git; `.env.example` contains only the variable names.
- No secret key (`service_role`) is in the app or in the repo.
- RLS is on. The `anon` role can read, insert rows (status `pending`, title and location 1–80 characters) and change only the `status` column (`pending` or `completed`); delete is not allowed.
- All data is synthetic. Without login, anyone with the publishable key can add rows or change statuses; this is accepted for the demo only.

## 5. Problems we ran into

- A wrongly named variable in `.env`: the app stopped with the missing-`.env` error until it was fixed.
- INSERT was blocked by RLS ("new row violates row-level security policy") until `supabase/tasks_insert.sql` was run. The error was visible on screen.
- The phone showed the old bundle until we reloaded Expo Go.
- An UPDATE blocked by RLS gives no error, only 0 changed rows. So the code asks Supabase to return the changed row (`.select("id")`) and rolls the status back if none is returned.

## 6. Next step

1. Screen 2 of HARTA, "Create Request", with the visit type and instructions (new columns in the table; Tringa's notes in `HARTA.md` section 9).
2. Login with Supabase Auth and the Client and Miku roles, so the RLS policies are per user and not for everyone.
3. Task acceptance by Miku and the visit evidence (GPS, photo, voice).

## 7. AI usage declaration

-- AI: po — Claude (Anthropic) helped with `AGENTS.md`, the Supabase client, the SQL, the RLS policies and the forms; GitHub Copilot Chat summarized the project from `AGENTS.md`. I read the changes, tested them on my phone and decided what to commit.

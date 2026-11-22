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
- installed the packages with `npx expo install` and tested every step on my phone;
- read `git diff` before every commit and committed after every working step;
- fixed the variable name in `.env` when the app reported the missing-`.env` error (it was `EXPO_PUBLIC_SUPABASE_KEY`, the code expects `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).

**Tringa:**
- tested the app on her own phone throughout the day; we tried every step on both phones, and the phone screenshots in the submission were taken on her phone;
- continues the UI/UX work for the next step (`HARTA.md` section 9).

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

1. Screen 2 of HARTA, "Create Request", with the visit type and instructions (new columns in the table; Tringa continues the UI/UX work, starting from her notes in `HARTA.md` section 9).
2. Login with Supabase Auth and the Client and Miku roles, so the RLS policies are per user and not for everyone.
3. Task acceptance by Miku and the visit evidence (GPS, photo, voice).

## 7. Update — after J5 (up to November 22, 2026)

The three "next steps" above are now done, apart from the Admin side.

| Step | Status | Commits |
|---|---|---|
| Login with Supabase Auth, per-user RLS on `tasks` (J6) | Done | `91f4c09`, `ff72f35`, `a06e104` |
| Packages for location, camera, audio, maps and SVG; camera-only permissions | Done | `e45cf78` |
| Keyboard only scrolls when it would cover the field | Done | `c5d9848` |
| Urëza design kit (colours, icons, hero screen) | Done | `b2c7094` |
| Properties and visits with owner RLS (`pronat`, `vizitat`, `harta`) | Done | `f04f006` |
| Roles Klient / Miku / Admin and profile settings, RLS by role | Done | `fafc8b9` |
| Visit evidence (GPS, live photo, voice) and the client's approve/dispute decision | Done | `4877542`, `91d3767` |
| Welcome, role choice, new sign-in and a tab space per role | Done | `8e0b47d` |
| ESLint set up; lint and typecheck pass | Done | `558a03f` |
| Admin panel: status counts, dispute review with a decision and a note, Miku verification | Done | `5204585` |
| Each role lands on its own home (an Admin goes straight to Paneli) | Done | `ff757c2` |
| Admin dashboard: key figures, 14-day chart, visits per step and kind | Done | this commit |
| AI report in the client's language | Not built | — |

**What works now:** a new user sees the welcome screen, chooses Klient or Miku and signs in. The client adds properties (with the position on the map), requests a visit, follows its steps on Ballina and reads the report; a Miku accepts the request, starts the visit and sends a GPS position, live photos and a voice note; the client approves or disputes, and the visit stays in Oda. I tested every screen on my phone.

**Security:** every new table has Row Level Security by owner and by role; the photos and voice notes are in a private storage bucket that only the visit's client and Miku can read; the Admin role is given only in SQL. The SQL files use example emails (`klienti@example.com`, `admini@example.com`) instead of a real address.

**Admin panel:** the admin opens on a dashboard (cases waiting for a decision, visits in total, approval rate, average time to acceptance, verified Mikus, requests of the last 14 days, visits per step and kind; numbers only), opens each disputed report with the evidence and the client's reason, and closes it with a decision ("Klienti ka të drejtë" or "Raporti qëndron") and a note that the client and the Miku read. The admin also verifies Mikus; a Miku sees their own status on Kërkesat. The SQL (`supabase/admini.sql`) was tested on a local PostgreSQL 18 with 24 checks for the admin, client and Miku roles.

**Next step:**
1. Decide whether a Miku must be verified before accepting a visit.
2. The report in the client's language (simulated AI first, as `HARTA.md` plans).
3. Consent and privacy steps for the non-medical parent visits.

## 8. AI usage declaration

-- AI: po — Claude (Anthropic) helped with `AGENTS.md`, the Supabase client, the SQL, the RLS policies and the forms; GitHub Copilot Chat summarized the project from `AGENTS.md`. I read the changes, tested them on my phone and decided what to commit.

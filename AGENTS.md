This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project: Urëza

Urëza is a mobile app (Route 3 — Startup) that lets a Kosovo diaspora family order a trusted local visitor ("Miku") to check a house, land or a parent's wellbeing (non-medical) in Kosovo.

- **One job:** turn a request from abroad into a documented local visit: GPS, live photo (camera only, never the gallery), voice recording and a clear report.
- **Roles:** Client (creates requests, approves or disputes the report), Miku (accepts, records evidence), Admin (reviews disputes, verifies Mikus). Each role has its own space.
- **Oda:** the client's chronological visit history. The report is shown in the client's language (AI-generated in the planned version).
- **UI language:** Albanian. Use only synthetic data (no real names, phone numbers or addresses).
- **Current prototype:** sign-in with Supabase Auth, a role per account (`profiles`), and one tab space per role in `src/app/(app)/` (Klient: Ballina, Pronat, Harta, Oda, Profili; Miku: Kërkesat, Harta, Profili; Admin: Paneli, Profili). Built: properties, visit requests (`/kerko-vizite`), Miku acceptance, visit details (`/vizita/[id]`), evidence capture (`/deshmia/[id]`: GPS, camera-only photos, voice note), the client's approve/dispute decision, and Oda. Not built yet: the Admin panel (dispute review, Miku verification) and the AI report in the client's language. The course task list (`index.tsx`, `/artikull/[id]`) stays as the history of the weekly tasks.
- **Docs:** README.md, HARTA.md (product map, 5 screens), EKIPI.md, BISEDAT.md, PITCH.md.

### Data (Supabase)

- Backend is Supabase. The client lives in `src/lib/supabase.ts`; it reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from `.env`.
- `.env` is never committed (see `.gitignore`); `.env.example` shows the variable names. Never put a `service_role` key in the app.
- Row Level Security is always on. The `tasks` table started as an `anon` demo (`supabase/tasks.sql`, `tasks_insert.sql`, `tasks_update.sql`); since J6 (`supabase/j6-hyrja-rls.sql`) each signed-in user sees only their own rows.
- The Urëza tables have per-user and per-role policies. Run the SQL files in this order: `pronat.sql`, `vizitat.sql`, `roli.sql`, `profili.sql`, `harta.sql`, `deshmia.sql` (also creates the private `deshmite` storage bucket), `raporti.sql`. Every file is safe to run again. Until a file is run, the app falls back to demo data on the phone and says so.
- The Admin role is given by hand in SQL (see the end of `supabase/roli.sql`), never from the app.

### Working rules

- Commit after every step that works, and read the diff before committing.
- Test on the phone (Expo Go, SDK 58), not only in code.
- Declare AI use in commit messages: `-- AI: po — what it helped with`.

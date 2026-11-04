# PROGRES — J5 (4 nëntor 2026)

**Projekti:** Urëza · **Ekipi:** Flutura Hyseni & Tringa Hyseni · **Rruga:** 3 — Startup

Sot e lidha aplikacionin me Supabase duke punuar me një agjent AI. Ky dokument tregon çka punon, çka bëri agjenti, çka bëra unë dhe hapin e radhës.

## 1. Misionet

| Misioni | Statusi | Provë në repo |
|---|---|---|
| **M0** — `AGENTS.md` nga EKIPI, BISEDAT, HARTA | Kryer | Commit `434ee14`. Agjenti (GitHub Copilot Chat) e përmblodhi idenë saktë: klienti krijon kërkesë, Miku e pranon dhe e kryen vizitën, klienti e miraton ose e kundërshton raportin, vizitat ruhen në Oda, me Supabase. |
| **M1** — aplikacioni lexon një gjë reale nga Supabase | Kryer | Commit-et `6e161c8` dhe `d6897c3`. Lista e detyrave vjen nga tabela `tasks`; telefoni shfaq "Të dhëna nga Supabase (5)". |
| **M2** — përdoruesi shton një gjë nga telefoni dhe ruhet | Kryer | Commit `c3e1166`. Forma "Shto detyrë të re" bën INSERT në `tasks`; rreshti mbetet kur e mbyll dhe e hap aplikacionin. |
| **M3** (sfidë) — ekrani kryesor i HARTA-s me të dhëna reale | Kryer për ekranin 1 | Ballina (ekrani 1) lexon, shton dhe ndryshon statusin me të dhëna reale, dhe detajet e detyrës lexohen nga Supabase. Kodi: `src/app/index.tsx`, `src/app/artikull/[id].tsx`, `supabase/tasks_update.sql`. Ekrani 2 (Krijo kërkesë me lloj vizite dhe udhëzime) nuk është bërë ende. |

## 2. Çka punon tani

- Ballina e ngarkon listën nga Supabase (`src/lib/supabase.ts`, `src/app/index.tsx`), me detyrën më të re në krye.
- Kur nuk ka rrjet ose tabelë, aplikacioni kalon në të dhënat lokale dhe e tregon "Offline" në ekran.
- Forma shton detyrë të re (titull dhe vendndodhje) dhe e rifreskon listën. Nëse ruajtja dështon, gabimi shfaqet në ekran, jo në heshtje.
- Butoni "Ndrysho statusin" e ruan statusin në Supabase (`update`); nëse ruajtja dështon, statusi kthehet mbrapsht dhe gabimi shfaqet në ekran.
- Ekrani i detajeve e lexon detyrën nga Supabase sipas id-së, kështu hapen edhe detyrat e shtuara nga telefoni.
- Tabela `tasks` ka kolonat `id`, `title`, `location`, `status` (`pending` ose `completed`) dhe `created_at`; SQL-i është në `supabase/tasks.sql` dhe `supabase/tasks_insert.sql`.

## 3. Çka bëri agjenti dhe çka bëra unë

**Agjenti (Claude; Copilot Chat vetëm për përmbledhjen e M0):**
- e shkroi seksionin "Urëza" te `AGENTS.md`, `.env.example` dhe rregullin në `.gitignore` që `.env` të mos hyjë në Git;
- shkroi klientin Supabase, SQL-in e tabelës me 5 rreshta testues dhe politikat RLS;
- e ndryshoi `src/app/index.tsx` që të lexojë nga Supabase, shtoi formën me `insert` dhe ruajtjen e statusit me `update`;
- e ndryshoi ekranin e detajeve që të lexojë nga Supabase dhe shkroi `supabase/tasks_update.sql` (UPDATE vetëm për kolonën `status`);
- e përditësoi `AGENTS.md`, `README.md` dhe `EKIPI.md` kur ndryshoi gjendja.

**Unë:**
- krijova organizatën dhe projektin në Supabase, e ekzekutova SQL-in dhe krijova `.env` me çelësat;
- instalova paketat me `npx expo install` dhe e provova çdo hap në iPhone;
- i lexova `git diff` para çdo commit-i dhe bëra commit pas çdo hapi që punonte;
- e ndreqa variablën në `.env` kur aplikacioni tha "Mungon .env" (emri ishte `EXPO_PUBLIC_SUPABASE_KEY`, kodi pret `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).

## 4. Siguria

- Çelësi publik (`sb_publishable_…`) është vetëm te `.env`, që nuk hyn në Git; `.env.example` ka vetëm emrat e variablave.
- Asnjë çelës sekret (`service_role`) nuk është në aplikacion ose në repo.
- RLS është aktive. Roli `anon` mund të lexojë, të shtojë rreshta (status `pending`, titull dhe vendndodhje 1–80 shkronja) dhe të ndryshojë vetëm kolonën `status` (`pending` ose `completed`); fshirja nuk lejohet.
- Të dhënat janë sintetike. Pa hyrje (login), çdokush me çelësin publik mund të shtojë rreshta ose të ndryshojë statuset; kjo pranohet vetëm për demo.

## 5. Probleme që hasëm

- `.env` me emër të gabuar të variablës: aplikacioni u ndal me "Mungon .env" derisa u ndreq.
- INSERT u bllokua nga RLS ("new row violates row-level security policy") derisa u ekzekutua `supabase/tasks_insert.sql`. Gabimi u pa në ekran.
- Telefoni e tregonte paketën e vjetër derisa e rifreskuam Expo Go.
- Një UPDATE i bllokuar nga RLS nuk jep gabim, vetëm 0 rreshta të ndryshuar. Prandaj kodi kërkon që Supabase ta kthejë rreshtin e ndryshuar (`.select("id")`) dhe e kthen statusin mbrapsht nëse nuk u kthye asnjë.

## 6. Hapi tjetër

1. Ekrani 2 i HARTA-s, "Krijo kërkesë", me llojin e vizitës dhe udhëzimet (kolona të reja në tabelë; shënimet e Tringës te `HARTA.md` pika 9).
2. Hyrja me Supabase Auth dhe rolet Klient dhe Miku, që politikat RLS të jenë për përdorues dhe jo për të gjithë.
3. Pranimi i detyrës nga Miku dhe dëshmitë e vizitës (GPS, foto, zë).

## 7. Deklarimi i AI

-- AI: po — Claude (Anthropic) ndihmoi me `AGENTS.md`, klientin Supabase, SQL-in, politikat RLS dhe formën; GitHub Copilot Chat e përmblodhi projektin nga `AGENTS.md`. Unë i lexova ndryshimet, i provova në telefon dhe vendosa çka të commit-oj.

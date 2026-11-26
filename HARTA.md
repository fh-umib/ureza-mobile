
# URËZA — Product Map

**Course:** Mobile Application Development  
**Team:** Flutura Hyseni & Tringa Hyseni  
**Route:** 3 — Startup  
**Date:** October 2026

## 1. The One Job

**Urëza turns a request from the Kosovo diaspora into a documented local visit, supported by GPS, live photos, voice evidence, and a clear report.**

The initial focus is on **property inspections**; the same process may support **non-medical visits to check on parents**, with consent and suitable privacy protection.

## 2. Problem and Evidence

Diaspora members often rely on relatives, neighbors, or workers to monitor property and family responsibilities in Kosovo.

Our three interviews documented:

- Property damage or a burglary discovered too late.
- Inaccurate reports and incomplete paid work.
- Significant time and maintenance expenses.
- Difficulties coordinating local workers from abroad.
- Concerns about checking on an elderly parent.

**Public background sources:** [README.md](README.md), section 1.  
**First-hand interview summaries:** [BISEDAT.md](BISEDAT.md).

Three out of three interviewees described a relevant problem, but broader demand is not yet proven.

## 3. Main User Flow — 5 Screens

### Screen 1 — Home / My Tasks

**Role:** Client  
**Purpose:** View visit requests and statuses.  
**Action:** Open an existing task or create a request.

### Screen 2 — Create Request

**Role:** Client  
**Purpose:** Select a property inspection or a non-medical parent check-in; add instructions and a location.  
**Action:** Submit the request.

### Screen 3 — Task Details / Report Review

**Roles:** Miku and Client  
**Purpose:** Miku reads and accepts a request. After the visit, the client reviews the report and submitted evidence.  
**Actions:** Miku accepts; the client approves or disputes the report. An admin handles disputes as a basic review process.

### Screen 4 — Visit Evidence

**Role:** Miku  
**Purpose:** Document the visit with GPS, **live photos captured through the camera rather than selected from the gallery**, voice recording, and timestamps.  
**Action:** Submit evidence to generate a structured report.

### Screen 5 — Oda / Visit History

**Role:** Client  
**Purpose:** See approved visits and their reports in chronological order.  
**Action:** Review past visits and documented evidence.

## 4. User Flow Diagram

```text
CLIENT                                  VISITOR ("Miku")

1 Home
   |
2 Create request ---------------------> 3 Task details: accept task
                                          |
                                          v
                                        4 Visit evidence:
                                          GPS + live photo + voice
                                          |
3 Task details: AI report <------------- Submit evidence
   |
   |-- Approve -> 5 Oda (visit history)
   |
   '-- Dispute -> Basic admin review
```

The report is intended to appear in the client's language. **AI generation will be simulated in the prototype; real AI and backend services are not yet integrated.**

## 5. MVP Scope

### IN — Included in the Planned MVP

- Basic Client and Miku roles (simulated, without real login)
- Property inspection requests
- Non-medical care visits for parents, with consent
- Task list, details, and status tracking
- Task acceptance by Miku
- GPS, live camera photos, voice recordings, and timestamps
- AI-generated report in the client's language (**simulated in the prototype**)
- Client approval or dispute of reports
- Basic admin dispute review
- Oda — chronological history of approved visits

### OUT — Excluded from the Initial MVP

- Company registration, availability, and service offers
- Advanced business management and dashboards
- Online payments and subscriptions
- Push notifications
- Public web application
- Real backend authentication *(moved in: Supabase Auth was added in J6)*
- Real AI service integration
- Medical advice and healthcare services

These may be explored later when appropriate; medical advice is not part of Urëza's service.

## 6. Current Prototype Status

*Updated November 22, 2026.* The Expo prototype now covers the main flow with real accounts and Supabase data:

| Screen | Status | Where in the code |
|---|---|---|
| Before sign-in: welcome, "Kush je ti?" (role), sign-in / create account | Built | `src/app/miresevini.tsx`, `kush-je.tsx`, `hyrja.tsx` |
| 1 — Home / My Tasks (Ballina, plus Pronat and Harta tabs) | Built | `src/app/(app)/ballina.tsx`, `pronat.tsx`, `harta.tsx` |
| 2 — Create Request: property, inspection or non-medical care visit, day, instructions | Built | `src/app/kerko-vizite.tsx` |
| 3 — Task Details: Miku accepts; the client reads the report and approves or disputes | Built | `src/app/vizita/[id].tsx`, `src/app/(app)/miku.tsx` |
| 4 — Visit Evidence: GPS, live camera photos (no gallery), voice note, timestamps | Built | `src/app/deshmia/[id].tsx` |
| 5 — Oda / Visit History, grouped by month | Built | `src/app/(app)/oda.tsx` |
| Profile: data, report language, notifications, data download, deletion request | Built | `src/app/(app)/profili.tsx` |
| Admin panel: dashboard (key figures, 14-day chart, visits per step and kind), disputed cases (evidence, client's reason, decision with a note), Miku verification | Built | `src/app/(app)/admini.tsx`, `src/components/ShqyrtimiIRastit.tsx`, `supabase/admini.sql` |

Login now uses Supabase Auth, and Row Level Security limits every table by owner and role. One account can switch between Klient and Miku from the profile, to try both sides of the prototype; Admin is given only in SQL.

The admin sees only disputed visits in full; the dashboard shows numbers only. A closed case keeps the status "Kundërshtuar", and the client and the Miku both read the admin's decision and note.

**Not implemented yet:** the admin's map, verification as a requirement before a Miku can accept a visit, and the AI-generated report in the client's language: the report currently lists the evidence the Miku sent. All data is still synthetic.

## 7. MVP Priority

**Create request -> Miku accepts -> Perform visit -> Submit evidence -> Review report -> Approve or dispute.**

A property inspection is the first pilot use case. A parent check-in follows the same visit workflow but needs additional consent and privacy safeguards.

## 8. AI Usage Declaration

-- AI: po — ChatGPT helped draft and structure the product map, organize the screen flow, and improve the English text.

-- Team contribution: We defined the product concept, supplied the interview findings, decided on the MVP boundaries, and reviewed the final workflow.

## 9. UI/UX Design Notes

**Responsible:** Tringa Hyseni  
**Area:** Mobile Interface and User Experience

### Navigation

- A bottom tab bar is used for the main sections (e.g. My Tasks, Create Request, Oda / History).
- Secondary screens (Task Details, Visit Evidence) open on top of the main tabs.

### Screen Design

**1. Home / My Tasks**
- Tasks are shown as detailed cards, not a plain list.
- Each card shows the property location, visit type, date and current status.
- Tapping a card opens the full task details.

**2. Create Request**
- A short, simple form with a clear task description.
- The client chooses the type of visit.
- The submission process is kept to as few steps as possible.

**3. Task Details**
- Shows all task information and the current status.
- Provides an Accept Task action for Miku.
- Displays the submitted report for the client.

**4. Visit Evidence**
- Camera, voice and GPS actions are easy to find.
- Each recorded piece of evidence is clearly marked.
- A confirmation step is required before submitting.

**5. Oda / Visit History**
- Completed visits are ordered chronologically.
- Previous reports are easy to open.
- Approved and disputed visits are clearly distinguished.

### Status Indicators

Task status is shown with both a color and an icon, so it is clear
even for users who have difficulty distinguishing colors:
- Pending: amber + clock icon
- Accepted / In progress: blue + arrow icon
- Completed / Approved: green + check icon
- Disputed: red + warning icon

### Color Direction (proposed)

The app should feel warm, familiar and "homely", since it is about
taking care of a family home. Proposed palette, to be confirmed with the team:
- Primary: warm terracotta (#C8664B)
- Background: soft cream (#FAF6F0)
- Text: dark warm brown (#2E2A26)
- Accent: muted olive green (#6B7F4E)

### Current Prototype vs. Proposed Design

The current Urëza prototype uses a teal-based color palette,
with dark teal as the primary color and light backgrounds.

The terracotta and cream palette proposed above represents
an alternative visual direction for future development.

This design proposal has not yet been implemented.
The final color palette will be selected collaboratively
after reviewing usability and user feedback.

For now, the existing prototype design will remain unchanged
to preserve consistency and functionality.

### Design Principles

- Simple navigation between screens.
- Readable typography and consistent colors.
- Large, accessible touch targets.
- Clear status indicators and action buttons.
- Responsive layouts for different phone sizes.

### Development Status

These notes describe the proposed interface and design direction.
They do not describe completed functionality; implementation status
is tracked in the code.

*Update, November 22, 2026:* the bottom tab bar, the detailed cards and
the status shown with both a colour and an icon are now in the app
(`src/app/(app)/_layout.tsx`, `src/components/StatusiChip.tsx`). The app
uses the petrol-blue palette in `src/constants/ureza.ts`; the terracotta
direction above has not been adopted.

### Redesign of Harta and Profili (November 2026)

Ballina, Oda and Pronat were redesigned first; Harta and Profili still had
the older look (plain text chips, text-only links, a flat progress bar).
They now follow the same rules: white cards with radius 20–22 and a light
shadow, colours only from `src/constants/ureza.ts`, icons only from
`src/components/UrezaIcon.tsx`, an arrow on everything that opens
something, and status shown with colour + icon + word.

**Harta** (`src/app/(app)/harta.tsx`)
- *Properties as cards.* The text chips became small cards that slide
  sideways, each with the property picture (`PronaIlustrim`), name and
  town; the selected one has a petrol frame. *Why:* a picture is faster to
  recognise than a name, especially for older family members, and the
  cards match the property cards on Ballina.
- *The selected property.* Name, town, the freshness chip ("Kontrolluar
  para X ditësh", shared with Pronat) and a full-width **Kërko vizitë →**
  button that opens the request for this property and kind. *Why:* the map
  answers "when was it last checked?" and the next action is one tap away,
  instead of the old "Shiko ditarin" link to another tab.
- *Location card with three states.* Exact (green, check), approximate
  (orange, warning) and not on the map (grey). The colour also shows as a
  stripe on the card's left edge. "Hape në Google Maps" and "Shto/Ndrysho
  vendndodhjen" are real 44 px buttons with icons. *Why:* the three states
  mean different things for the GPS check, so they must not look alike,
  and a button with a frame reads as tappable where plain text did not.
- *Visit list.* Each row has the icon of the visit kind, the title and
  date, the `StatusiChip` and an arrow. "Shiko të gjitha" sits next to the
  "Vizitat" title and goes to Oda (to Kërkesat for a Miku, who has no
  Oda). *Why:* the same row anatomy as Oda, so the user does not learn two
  lists.

**Profili** (`src/app/(app)/profili.tsx`)
- *Header.* A round badge with the initials, the name and email, a role
  badge (Klient / Miku / Admin, each with its own icon) and, for a Miku
  verified by the team, a "I verifikuar" badge with the shield icon.
  *Why:* trust is the core of Urëza, so the verification is shown where
  the person sees themselves first. The non-working "Ndrysho foton" link
  was removed.
- *Completeness ring.* The percentage is a ring (`react-native-svg`) and
  each missing step is a row; steps done on another screen (property,
  exact location) have an arrow and open that screen. *Why:* a ring with a
  number is read at a glance, and a list of what is missing is easier to
  act on than one hint at a time.
- *Three groups.* **Të dhënat**, **Njoftimet** and **Privatësia dhe
  pëlqimi**, each with a title and an icon. Every row has the same shape:
  icon on the left, text, arrow on the right when it opens something.
  "Kushtet e vizitës dhe pëlqimi", "Shkarko të dhënat e mia" and "Ndrysho
  rolin" are rows with arrows. *Why:* one row shape across the screen
  makes it predictable and keeps touch targets large.
- *Sign out.* "Dil" is at the bottom, set apart with a soft red tint and
  the logout icon, but not a strong red button. *Why:* it should be easy
  to find and clearly different, without looking like a dangerous action;
  strong red stays for deleting the account.
- *"Si punon si Miku".* Only the look changed (title with icon, shadow,
  radius 22, save button with a check). The logic is the same.

**Small additions**: the `bell` icon in `UrezaIcon.tsx`; named colours for
the states (`ok`, `kujdes`, `neutral`, `ikonaBg`, `errorBg`) in
`ureza.ts`, so the new parts of Harta and Profili use them instead of
hex values. Some older hard-coded colours remain (e.g. the card shadow
`#0B2530`, input placeholders); moving them to tokens is the next step,
on the `tringa/sistemi-ui` branch.

**After Flutura's review**: property names on the Harta cards wrap to
two lines (cards 170 px wide), so similar names can be told apart; the
"Gjithmonë" chip sits under the text so the photos row keeps its full
width; the Miku also sees "Kushtet dhe kontrata" under Privatësia; the
missing "Emri" and "Telefoni" steps jump to their field; "Not on the map"
uses a grey map icon (neutral) instead of an X.

### The Miku's first steps (onboarding)

Before this change a new Miku signed up and landed on Kërkesat with two
separate notes ("not verified yet", "fill your work profile") and had to
find "Si punon si Miku" on Profili alone. Now there is one guided path.

- **Role choice** (`kush-je.tsx`, `ZgjedhesiIRolit`): the Miku option
  lists what is needed — a work profile, verification by the team, and a
  contract for every visit. *Why:* nobody should sign up and only then
  learn that they must be verified before they can work.
- **First steps** (`miku-fillimi.tsx`), opened once per session from
  Kërkesat while the work profile is missing:
  1. *Ti* — name and phone. The phone is required for a Miku (optional
     for a client), because the team calls before verifying.
  2. *Puna* — company (name and business number), individual, student or
     craftsman (trade). It goes into every contract.
  3. *Më pas* — verification by the team, the contract and the 3% damage
     rule, the evidence every visit needs, and a link to the terms.

  A step indicator sits at the top, with "Mbrapa" (and "Më vonë" on the
  first step). *Why three steps:* each one is a different kind of
  question (who, how, what next), and short screens are easier for
  people who are not used to forms. The progress is not stored
  separately: name and phone live in the profile and the work type in
  the work profile, so a Miku who leaves and comes back starts at the
  first step that is still missing. No change to `src/lib/` or
  `supabase/` was needed.
- **"Gati për punë"** on Kërkesat replaces the two notes: three rows
  (profile, work type, verification), each with an icon, a word (Gati /
  Mungon / Në pritje) and an arrow to where it is done. When all three
  are done it shrinks to one "I verifikuar · gati për punë" badge.
  *Why:* one checklist shows how far the Miku is; three separate warnings
  only said what was wrong.
- **Profili**: the header shows how the Miku works next to the role,
  e.g. "Kompani · Shtëpia e Sigurt". The "Si punon si Miku" form stays
  for later edits, and the header updates as soon as it is saved.

### AI Usage

- AI: po — Claude (Anthropic) helped write the code of the Harta and
  Profili redesign and phrase the notes above; the design decisions and
  the review on the phone were made by Tringa.
- AI: po — AI was used to help phrase these notes in English; the design
  decisions (card layout, bottom tab bar, color + icon status indicators,
  warm color direction) were made by Tringa.
- Team contribution: UI/UX decisions and review by Tringa.

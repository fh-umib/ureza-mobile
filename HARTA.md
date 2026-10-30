
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
- Real backend authentication
- Real AI service integration
- Medical advice and healthcare services

These may be explored later when appropriate; medical advice is not part of Urëza's service.

## 6. Current Prototype Status

The current Expo prototype implements:

- Home screen with synthetic tasks
- Reusable `TaskCard` (Karta e Detyrës) component
- `FlatList` with unique task IDs
- Local status updates with `useState`
- Dynamic task details using Expo Router
- Navigation between list and detail screens
- Invalid task ID handling

**Not implemented yet:** Request creation, Miku acceptance, evidence capture, report generation/review, disputes, care visits, and Oda. Current data is synthetic.

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

### AI Usage

- AI: po — AI was used to help phrase these notes in English; the design
  decisions (card layout, bottom tab bar, color + icon status indicators,
  warm color direction) were made by Tringa.
- Team contribution: UI/UX decisions and review by Tringa.


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

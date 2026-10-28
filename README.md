
# URËZA
### Connecting Kosovo's Diaspora with Home

**University:** University "Isa Boletini" Mitrovica  
**Course:** Mobile Application Development  
**Academic Year:** 2026/2027  
**Team:** Flutura Hyseni & Tringa Hyseni  
**Project Route:** 3 — Startup  
**Status:** Early-stage Expo mobile prototype

## 1. Problem and Evidence

Many Kosovo diaspora members live abroad while owning property or having family responsibilities in Kosovo. They often rely on relatives, neighbors, or workers for updates they cannot verify in person.

### Public Research

- [Haluzík (2025) — Why Brothers in Kosovo Build Identical Houses: The House as an Attempt to Adapt to Contradictions of Globalization](https://doi.org/10.1177/08883254251335981): Discusses houses in Kosovo whose owners may live abroad.
- [Dushi & Berila (2025) — Diaspora's Role in Their Home Country's Economic Development: The Case of Kosovo](https://doi.org/10.3986/AGS.12806): Examines Kosovo diaspora investments and related challenges.

These sources offer background context; they do not establish demand for Urëza.

### Our User Research

We documented three interviews with diaspora members:

- **P1 — Germany:** Waste was dumped on land without the owner's knowledge. A paid cleaning service left work unfinished, and the family spent another three days cleaning.
- **P2 — Germany:** Managing several properties and construction-related activities is costly. Some reports from workers have not reflected the real situation.
- **P3 — Sweden:** A family discovered a house burglary approximately one week after it occurred. Dealing with property damage also consumed vacation time.

**Three out of three participants described a problem with managing responsibilities in Kosovo from abroad.** This is initial qualitative evidence, not a representative market survey.

See [BISEDAT.md](BISEDAT.md) for the anonymized interview summaries.

## 2. Our Solution

**One job:** Urëza turns a request from the Kosovo diaspora into a documented local visit, supported by GPS, live photos, voice evidence, and a clear report.

The first target user is **a diaspora homeowner who needs a trusted property inspection in Kosovo**. The same workflow may support non-medical care visits for parents, with appropriate consent and privacy protections.

## 3. User Roles

- **Client:** Creates requests, views evidence and reports, and approves or disputes completed visits.
- **Miku (local visitor):** Accepts a task, completes the visit, and submits evidence.
- **Admin:** Reviews disputed submissions and supports accountability.

The initial prototype does not yet have real accounts or backend authentication.

## 4. Main Service Flow

1. The client creates a visit request.
2. Miku accepts the available task.
3. Miku records GPS, live camera photos (not gallery uploads), voice notes, and timestamps during the visit.
4. The client receives a report in their preferred language; AI report generation will be **simulated in the prototype**.
5. The client approves or disputes the report. Approved visits appear in **Oda**, the chronological visit history; disputes can be reviewed by an admin.

## 5. Planned MVP

**Included:**

- Property inspections and optional non-medical parent care visits
- Basic Client and Miku roles, tasks, details, and status tracking
- Task acceptance by Miku
- GPS, live photos, voice, and timestamps
- Simulated AI-generated report in the client's language
- Client approval/dispute and basic admin review
- Oda — chronological visit history

**Excluded for now:**

- Company registration, availability, and service offers
- Advanced business management
- Online payments and subscriptions
- Push notifications and a public web application
- Real backend authentication and real AI service integration
- Advanced admin dashboard
- Medical advice or healthcare services

See [HARTA.md](HARTA.md) for the five-screen flow and scope decisions.

## 6. Current Prototype

**Stack:** React Native, Expo SDK 58, TypeScript, and Expo Router.

**Implemented and tested:**

- Home screen with synthetic inspection tasks
- Reusable `TaskCard` (Karta e Detyrës) component
- `FlatList` with unique task IDs
- Local status changes using `useState`
- Dynamic `[id].tsx` task-detail screen
- List-to-details navigation and invalid-ID handling

**Not yet implemented:** Real request creation, Miku task acceptance, camera/GPS/voice collection, real or simulated AI report screens, approval/dispute workflow, non-medical parent visits, and Oda.

The current data is synthetic. Urëza is not yet a live service.

## 7. Run Locally

Install Node.js and npm, and Expo Go on the phone. In the project directory run:

```bash
npm install
npm start
```

Scan the Expo QR code on the phone. The phone and computer should normally be on the same Wi-Fi network.

## 8. Documentation

- [IDEAS.md](IDEAS.md) — Three Week 2 app ideas and the selected startup
- [EKIPI.md](EKIPI.md) — Team, startup route, and first target user
- [BISEDAT.md](BISEDAT.md) — Three anonymized interviews
- [HARTA.md](HARTA.md) — Product map, five screens, and MVP boundaries
- [PITCH.md](PITCH.md) — One-minute pitch and rehearsal checklist

## 9. Privacy and Limitations

The planned application must handle personal locations, live photos, voice recordings, and visit reports only with appropriate permission and safeguards. Parent care visits are non-medical and require the parent's consent. GPS and media provide supporting evidence, not an absolute guarantee of task quality or personal safety.

The three interviews support the existence of problems for those participants only. Pricing, willingness to pay, visitor verification, and service reliability still require testing.

## 10. AI Usage Declaration

-- AI: po — ChatGPT helped organize this README, improve English wording, explain technical concepts, and draft sections from the team's information.

-- Team contribution: We selected the idea, conducted and documented the interviews, defined the scope and roles, and reviewed the final content.

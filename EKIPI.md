
# URËZA — Official Team

**Course:** Mobile Application Development  
**University:** University "Isa Boletini" Mitrovica  
**Academic Year:** 2026/2027  
**Project:** Urëza  
**Route:** 3 — Startup  
**Repository:** https://github.com/fh-umib/ureza-mobile

## 1. Team Members

| Member | Role | Responsibilities |
|---|---|---|
| Flutura Hyseni | Project Lead & Developer | Project coordination, application logic, data management, prototype development, testing, planned backend and AI integration. |
| Tringa Hyseni | Frontend Developer & UI/UX Designer | Mobile interface planning, UI/UX design, screen layouts, reusable components, user experience and application testing. |

We are developing Urëza together as a mobile application based on real problems experienced by Kosovo diaspora members.

Responsibilities are divided according to our roles, while project planning, important decisions, and testing are handled collaboratively.

## 2. Project Idea

**Urëza turns a request from the Kosovo diaspora into a documented local visit, supported by GPS, live photos, voice evidence, and a clear report.**

The platform connects diaspora members with trusted local visitors, called **Miku**, who can inspect properties or perform consent-based, non-medical care visits for parents.

Our goal is to help people stay informed about their responsibilities in Kosovo, even when they live abroad.

## 3. Problem We Want to Solve

Many Kosovo diaspora members own houses, apartments, or land that they cannot regularly monitor.

They often depend on relatives, neighbors, or workers for information. However, calls and messages do not always provide reliable evidence about property conditions or completed work.

Our three user interviews identified several challenges:

- Property damage discovered too late.
- Incomplete work and inaccurate reports.
- High maintenance and coordination costs.
- Dependence on different people for local tasks.
- Difficulties checking on elderly family members from abroad.

These findings are documented in [BISEDAT.md](BISEDAT.md).

## 4. First Target User

Our first target user is **a Kosovo diaspora homeowner living abroad who needs a trusted person to inspect and report on a property in Kosovo.**

We will initially focus on individual property owners.

Non-medical parent care visits are also part of the planned MVP, while advanced business services and company management may be considered in future development.

## 5. Proposed Solution

Urëza aims to make remote property monitoring and local visits more organized, transparent, and trustworthy.

The planned process is:

1. The client creates a visit request.
2. Miku reviews and accepts the task.
3. Miku performs the visit and collects GPS, live camera photos, voice recordings, and timestamps.
4. The client receives a structured report in their preferred language.
5. The client approves or disputes the report.
6. Approved visits are stored in **Oda**, the chronological visit history.

AI-generated reports will initially be simulated in the prototype. Real AI integration is planned for a later stage.

## 6. Initial MVP

### Included in the Planned MVP

- Basic Client and Miku roles.
- Property inspections and non-medical care visits for parents, with consent.
- Task creation, details, and status tracking.
- Task acceptance by Miku.
- GPS, live camera photos, voice recordings, and timestamps.
- AI-generated reports in the client's language (simulated in the prototype).
- Client approval or dispute of reports.
- Basic admin review of disputed reports.
- Oda — chronological history of completed visits.

### Outside the Initial MVP

- Company registration, availability, and service offers.
- Advanced business management modules.
- Online payments and subscriptions.
- Push notifications.
- Public web application.
- Real backend authentication.
- Real AI service integration.
- Medical advice and healthcare services.

### Current Development Status

The existing Expo prototype currently includes:

- A working home screen with sample tasks.
- A reusable `TaskCard` component.
- A task list using `FlatList`.
- Task status changes using `useState`.
- Dynamic task details using Expo Router.
- Navigation between the list and task details.
- Handling of invalid task IDs.

The remaining MVP features are planned and have not yet been implemented.

## 7. Team Collaboration

We use a shared public GitHub repository to organize development, review contributions, and track project progress.

### Flutura's Contribution

- Coordinated the project and its development stages.
- Worked on the Expo prototype and application logic.
- Organized the user research and project documentation.
- Tested the application on an iPhone.
- Reviewed and merged the team's contributions.

### Tringa's Contribution

- Planned the UI/UX design and screen structure.
- Prepared navigation and interface recommendations.
- Defined task status indicators using colors and icons.
- Proposed an alternative visual design direction.
- Documented her UI/UX decisions in `HARTA.md`.

### GitHub Collaboration

- Both members have access to the shared repository.
- Tringa Hyseni (`th-umib`) is an accepted Collaborator.
- Tringa submitted her UI/UX contribution through Pull Request #1.
- Her changes were reviewed and merged into the `main` branch.
- Git commits and Pull Requests are used to track contributions.
- Private information, passwords, and secret keys are not committed.

**Pull Request:** https://github.com/fh-umib/ureza-mobile/pull/1

The UI/UX color palette proposed by Tringa is a possible future design direction. The current prototype uses a teal-based interface, and no color change has been implemented.

## 8. AI Usage Declaration

-- AI: po — ChatGPT was used to assist with project planning, documentation, technical explanations, prototype development, and debugging.

### AI Assistance in Code

AI helped draft, explain, and improve parts of the Expo prototype, including:

- Home screen and task list in `src/app/index.tsx`.
- Reusable `TaskCard` component and TypeScript props.
- Sample task data and TypeScript definitions in `src/data/tasks.ts`.
- Dynamic navigation and task details in `src/app/artikull/[id].tsx`.
- TypeScript troubleshooting and Expo Router navigation.

### AI Assistance in Documentation

AI helped organize project documents, structure interview notes, improve English wording, and clarify the MVP scope.

### Team Contribution

The team developed the Urëza concept, conducted three real user interviews, selected the project requirements, reviewed AI-assisted material, and made the final decisions.

Flutura worked on coordinating, testing, and refining the prototype. Tringa contributed UI/UX planning and design decisions through her own GitHub Pull Request.

AI-assisted code and documentation were reviewed and adapted by the team. All current application task data is synthetic.

# MediKiosk

**"Your medical story, ready before you meet the doctor."**

AI-powered clinical history preparation platform for busy hospital OPDs.

---

## 1. Project Overview

MediKiosk lets a patient prepare their medical history — via voice, guided
touch, typing, or document upload — **before** they enter the consultation
room. The system organises that information into a structured, source-tagged
clinical history draft for the doctor, flags possible priority symptoms for
staff review, and simulates the hand-off to a hospital's ABHA/HIS systems.

**MediKiosk is a clinical decision support prototype. It does not diagnose.**
Every generated history is labelled an *AI-generated draft — requires
clinician verification*, and every red-flag alert is *triage assistance only*.
The treating doctor remains solely responsible for diagnosis and treatment.

## 2. Problem

Indian OPDs are high-volume and time-constrained. Doctors routinely spend the
first several minutes of a short consultation re-collecting a history the
patient could have provided while waiting — chief complaint, past conditions,
medications, allergies, and any prior prescriptions or reports they're
carrying. That time is lost from the actual clinical decision-making.

## 3. Solution

A kiosk-style, multilingual, voice/touch-friendly intake flow that:

1. Registers the patient and captures consent.
2. Runs an adaptive, rule-based clinical interview (chief-complaint specific
   follow-ups, past history, medications, allergies, family/personal history,
   review of systems — plus an AYUSH-specific pathway for Ayurveda).
3. Applies a transparent, configurable **red-flag rule engine** for triage
   assistance (never a diagnosis).
4. Digitises uploaded prescriptions/reports through a simulated OCR pipeline
   with confidence scoring and doctor-editable extraction.
5. Builds a chronological, source-tagged medical timeline.
6. Generates a deterministic, template-based clinical summary (no external
   LLM dependency) for the doctor to review, edit, and confirm.
7. Simulates ABHA (ABDM sandbox) and Hospital HIS/EMR (FHIR-adapter) hand-off.
8. Logs every step to an audit trail.

## 4. Features

- 5-stage patient journey: **Identify → Converse → Scan → Summarize → Consult**
- Voice input (Web Speech API `SpeechRecognition`) + text-to-speech
  (`SpeechSynthesis`), with graceful fallback to tap/type when unsupported
- 3 languages (English / Tamil / Hindi) with a centralised translation dictionary
- Adaptive question engine driven by JSON question banks (easy to extend)
- Rule-based red-flag triage engine, rules defined in a JSON-like config
- Simulated OCR with realistic extracted entities, confidence badges, and
  inline doctor/patient editing
- Reference-range lab result highlighting (NORMAL / HIGH / LOW / UNKNOWN)
- Full source traceability on every summary line: *patient reported*,
  *document extracted*, *system highlighted*, *doctor verified*
- Role-based dashboards: **Patient kiosk**, **Triage**, **Doctor**, **Admin**
- Mock ABHA (ABDM Sandbox Simulation) and mock Hospital HIS/EMR integration,
  both behind swappable service interfaces (`lib/integrations/`)
- FHIR-ready prototype data bundle (`lib/integrations/fhir.ts`)
- End-to-end audit trail
- Admin analytics (Recharts): department volume, common complaints,
  languages, documents processed
- Kiosk privacy affordances: End Session button, auto-closing thank-you screen
- **Site-wide login gate**: every route, including the landing page and the
  patient kiosk flow, requires an authenticated session (`proxy.ts`).
  A shared "Reception / Kiosk" credential unlocks patient intake, while
  Doctor/Triage/Admin sign in with their own role-specific accounts

## 5. Architecture

```
app/
  page.tsx                    Landing hub (Patient/Triage/Doctor/Admin) — auth required
  login/                      Role-based sign-in (Reception/Kiosk, Triage, Doctor, Admin)
  patient/                    Kiosk flow: start → register → consent → interview
                               → documents → timeline → history → review → complete
  triage/                     Triage dashboard (priority alerts, waiting queue)
  doctor/                     Doctor dashboard + doctor/patient/[id] detail view
  admin/                      Admin analytics + admin/integrations
  api/                        Next.js Route Handlers (see API section)

proxy.ts                 Site-wide login gate — every route requires a session

components/
  patient/   doctor/   triage/   admin/   clinical/   documents/   timeline/   common/   ui/

lib/
  db/            JSON-file-backed repository (swap-in point for Prisma/SQLite later)
  clinical/      Adaptive question engine, lab range classifier
  triage/        Red-flag rule engine
  ocr/           OCR simulation layer
  summary/       Deterministic clinical summary generator
  integrations/  Mock ABHA + Mock HIS services (interface-isolated) + FHIR bundle builder
  auth/          Cookie-based demo session auth + role guard
  i18n / store    (data/translations, lib/store — Zustand kiosk session)
  audit/         Audit log writer/reader

data/
  questions/       Chief-complaint pathways, common history sections, AYUSH questions
  triageRules/     Red-flag rule definitions
  translations/    EN / TA / HI dictionaries
  documentTypes.ts

types/           Shared TypeScript domain types (Patient, Encounter, ClinicalSummary, ...)
```

### Data layer

The prototype uses a **JSON-file-backed repository** (`lib/db/store.ts` +
`lib/db/repository.ts`) instead of Prisma/SQLite, per the brief's fallback
allowance — this avoids native-binary download risk in constrained/offline
build environments while still giving real, persisted, multi-role state
across API calls (stored at `.data/db.json`, auto-seeded on first run via
`instrumentation.ts`). All access goes through the repository module, so
swapping in Prisma + SQLite (or any real database) later only requires
reimplementing `lib/db/repository.ts` — no page or API route changes.

### Database model (entities)

`User`, `Patient`, `Encounter`, `Consent`, `ClinicalResponse`,
`ClinicalQuestion` (config, not persisted), `MedicalDocument`,
`ExtractedEntity` (embedded), `MedicalTimelineEvent`, `ClinicalSummary`,
`TriageAlert`, `DoctorVerification` (embedded in summary), `AuditLog`,
`IntegrationEvent`. Full shapes in `types/index.ts`.

Key relationships: `Patient 1—N Encounter`, `Encounter 1—N ClinicalResponse`,
`Encounter 1—N MedicalDocument`, `Encounter 1—1 ClinicalSummary`,
`Patient 1—N MedicalTimelineEvent`.

### API (selected)

```
POST   /api/patients                       Register patient + create encounter
GET    /api/patients/:id                   Patient detail
GET    /api/patients/lookup?patientId=     Returning-patient lookup
GET    /api/patients/:id/timeline          Patient's chronological timeline
POST   /api/encounters                     New encounter for an existing patient
GET    /api/encounters | /api/encounters/:id
POST   /api/consent
GET    /api/interview/next-question?encounterId=
POST   /api/interview/answer               Also runs the triage rule engine
POST   /api/documents/upload
POST   /api/documents/:id/process          Runs OCR simulation
PATCH  /api/documents/:id                  Doctor/patient edits to extraction
POST   /api/summary/generate
PATCH  /api/summary/:id                    Doctor section edit
POST   /api/summary/:id/verify             action: patient_confirm | doctor_confirm
GET    /api/triage/alerts
POST   /api/triage/alerts/:id/acknowledge
POST   /api/mock-abha/verify | link | share-history | fetch-records
POST   /api/mock-his/push
GET    /api/audit?encounterId=
GET    /api/admin/stats
```

## 6. Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **UI**: Tailwind CSS v4, shadcn/ui (Radix primitives), lucide-react icons
- **State**: Zustand (persisted kiosk session), React state elsewhere
- **Charts**: Recharts
- **Voice**: Browser Web Speech API (`SpeechRecognition` / `SpeechSynthesis`)
- **Data**: JSON-file repository (`.data/db.json`) — see Architecture
- **Auth**: Cookie-based demo session (no external auth provider needed)

## 7. Installation

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo data seeds
automatically on first request (5 demo patients, 3 staff users, question
banks, triage rules — see `lib/db/seed.ts`).

To reset all demo/session data back to the clean seed:

```bash
rm -f .data/db.json
```

Production build:

```bash
npm run build
npm run start
```

No API keys or external services are required for the full demo.

## 8. Demo Users

The entire site sits behind a login gate (`proxy.ts`) — there is no
unauthenticated path into any page, including the landing page and the
patient kiosk flow.

| Role               | Email                        | Password  |
|---------------------|-------------------------------|-----------|
| Reception / Kiosk  | reception@medikiosk.demo     | demo123   |
| Doctor             | doctor@medikiosk.demo        | demo123   |
| Admin              | admin@medikiosk.demo         | demo123   |
| Triage             | triage@medikiosk.demo        | demo123   |

Patients themselves never hold an account — in a real deployment the kiosk
device or the reception desk signs in once with the shared **Reception /
Kiosk** credential to unlock patient intake for walk-up patients, exactly as
a physical hospital kiosk would be unlocked by staff.

## 9. Demo Workflow

1. `/login` → sign in as **Reception / Kiosk** → lands on the MediKiosk hub.
2. From the hub, choose **Patient Mode** (or **Guided Demo Walkthrough** for
   an auto-fill shortcut on the registration form).
4. Choose a language, **Start Health Intake**, register (or **Scan ABHA QR**
   for a simulated ABDM sandbox lookup).
5. Grant consent on the dedicated consent screen.
6. Conversational interview: answer via tap, type, or speak. Try chief
   complaint **"Chest pain"** → associated symptoms **Breathlessness** and
   **Sweating** to trigger a **HIGH priority** red-flag alert live.
7. Upload a document (or **Simulate Camera Scan**) — watch the staged OCR
   pipeline (Uploading → Scanning → Extracting → Identifying → Timeline).
8. Review the generated timeline, then the AI-generated clinical history
   draft, then confirm on the "Let's make sure we understood you correctly"
   screen.
9. Sign out, then sign in as **Triage** (`/login?role=triage`) — see the
   priority alert, acknowledge it.
10. Sign out, then sign in as **Doctor** (`/login?role=doctor`) — see the
    patient in the queue (flagged HIGH), open their record, review Summary /
    History / Timeline / Documents / Investigations / Consent / Audit tabs,
    edit a section, confirm the history, then **Push to HIS** and (if ABHA
    present) **Push to ABHA**.
11. Sign out, then sign in as **Admin** (`/login?role=admin`) — see
    analytics, then open **Integrations** to inspect the mock ABHA/HIS event
    log and try **Simulate HIS Unavailable**.

Five seeded demo patients cover normal / priority / returning / Ayurveda /
document-OCR scenarios out of the box — see `lib/db/seed.ts`.

## 10. Mock Integrations

- **ABHA / ABDM** (`lib/integrations/abha.ts`, `/api/mock-abha/*`) — clearly
  labelled *ABDM Sandbox Simulation*. No real ABDM connectivity. Sample ABHA:
  `91-2345-6789-0123`.
- **Hospital HIS/EMR** (`lib/integrations/his.ts`, `/api/mock-his/push`) —
  labelled *Connected – Demo Mode*, transmits a FHIR-ready prototype bundle
  (`lib/integrations/fhir.ts`) to a simulated endpoint. A "Simulate HIS
  Unavailable" action demonstrates the failure-handling path.

Both are implemented behind small service interfaces so a real integration
can be substituted without touching any calling code.

## 11. Security & Privacy

- **Site-wide login gate** (`proxy.ts`) — every route requires an
  authenticated session; there is no anonymous path into the app
- Role-based access control on every staff route (`lib/auth/requireRole.ts`)
- Explicit, itemised patient consent recorded with timestamp + purposes
- ABHA IDs are never required; the UI masks them where shown as reference
- End Session button + auto-closing kiosk session for shared-device privacy
- Full audit trail of registration, consent, answers, uploads, OCR,
  triage alerts, summary generation/edits/confirmation, and integration pushes
- Only fictional demo data is used; no real patient data anywhere in the repo

## 12. Limitations (Prototype Boundaries)

- Not connected to real ABDM/ABHA or a real hospital HIS/EMR
- OCR is a realistic simulation, not a production text-extraction pipeline
- Summary generation is deterministic/template-based, not an LLM
- Speech recognition/synthesis depends on browser support (Chrome/Edge
  recommended); the UI degrades gracefully to tap/type when unavailable
- Data persistence is a local JSON file, not a production database
- Not validated against the full FHIR specification (labelled "FHIR-ready
  prototype data structure")

## 13. Future Roadmap

- Swap `lib/db/repository.ts` for a Prisma + PostgreSQL/SQLite implementation
- Real ABDM/ABHA integration behind the existing `AbhaService` interface
- Real hospital HIS/FHIR server integration behind `HisService`
- Cloud OCR + Indian-language ASR/TTS behind the existing service boundaries
- Kiosk hardware integration (barcode/QR scanner, receipt printer)
- Clinical NLP-assisted entity extraction to complement rule-based logic

---

MediKiosk — Your medical story, ready before you meet the doctor.

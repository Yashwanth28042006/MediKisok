import { randomUUID } from "node:crypto";
import { getDb, saveDb } from "@/lib/db/store";
import type {
  Patient,
  Encounter,
  ConsentRecord,
  ClinicalResponse,
  MedicalDocument,
  MedicalTimelineEvent,
  ClinicalSummary,
  TriageAlert,
  User,
} from "@/types";

// --- Users ---
export function findUserByEmail(email: string): User | undefined {
  return getDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// --- Patients ---
export function createPatient(data: Omit<Patient, "id" | "createdAt">): Patient {
  const db = getDb();
  const patient: Patient = { id: randomUUID(), createdAt: new Date().toISOString(), ...data };
  db.patients.push(patient);
  saveDb();
  return patient;
}

export function getPatient(id: string): Patient | undefined {
  return getDb().patients.find((p) => p.id === id);
}

export function findPatientByPatientId(patientId: string): Patient | undefined {
  return getDb().patients.find((p) => p.patientId.toLowerCase() === patientId.toLowerCase());
}

export function listPatients(): Patient[] {
  return getDb().patients;
}

export function generatePatientId(): string {
  const year = new Date().getFullYear();
  const count = getDb().patients.length + 1;
  return `MK-${year}-${String(count).padStart(4, "0")}`;
}

// --- Encounters ---
export function nextToken(): string {
  const highest = getDb().encounters.reduce((max, e) => {
    const n = parseInt(e.token.replace(/^A/, ""), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 18); // seed data occupies A014-A018
  return `A${String(highest + 1).padStart(3, "0")}`;
}

export function createEncounter(data: Omit<Encounter, "id" | "createdAt" | "waitingSince">): Encounter {
  const db = getDb();
  const now = new Date().toISOString();
  const encounter: Encounter = { id: randomUUID(), createdAt: now, waitingSince: now, ...data };
  db.encounters.push(encounter);
  saveDb();
  return encounter;
}

export function getEncounter(id: string): Encounter | undefined {
  return getDb().encounters.find((e) => e.id === id);
}

export function listEncounters(): Encounter[] {
  return getDb().encounters;
}

export function updateEncounter(id: string, patch: Partial<Encounter>): Encounter | undefined {
  const db = getDb();
  const idx = db.encounters.findIndex((e) => e.id === id);
  if (idx === -1) return undefined;
  db.encounters[idx] = { ...db.encounters[idx], ...patch };
  saveDb();
  return db.encounters[idx];
}

// --- Consent ---
export function createConsent(data: Omit<ConsentRecord, "id" | "timestamp">): ConsentRecord {
  const db = getDb();
  const consent: ConsentRecord = { id: randomUUID(), timestamp: new Date().toISOString(), ...data };
  db.consents.push(consent);
  saveDb();
  return consent;
}

export function getConsentByEncounter(encounterId: string): ConsentRecord | undefined {
  return getDb().consents.find((c) => c.encounterId === encounterId);
}

// --- Clinical Responses ---
export function addClinicalResponse(data: Omit<ClinicalResponse, "id" | "timestamp">): ClinicalResponse {
  const db = getDb();
  const response: ClinicalResponse = { id: randomUUID(), timestamp: new Date().toISOString(), ...data };
  db.clinicalResponses.push(response);
  saveDb();
  return response;
}

export function getResponsesByEncounter(encounterId: string): ClinicalResponse[] {
  return getDb().clinicalResponses.filter((r) => r.encounterId === encounterId);
}

// --- Documents ---
export function addDocument(data: Omit<MedicalDocument, "id" | "uploadedAt">): MedicalDocument {
  const db = getDb();
  const doc: MedicalDocument = { id: randomUUID(), uploadedAt: new Date().toISOString(), ...data };
  db.documents.push(doc);
  saveDb();
  return doc;
}

export function updateDocument(id: string, patch: Partial<MedicalDocument>): MedicalDocument | undefined {
  const db = getDb();
  const idx = db.documents.findIndex((d) => d.id === id);
  if (idx === -1) return undefined;
  db.documents[idx] = { ...db.documents[idx], ...patch };
  saveDb();
  return db.documents[idx];
}

export function getDocument(id: string): MedicalDocument | undefined {
  return getDb().documents.find((d) => d.id === id);
}

export function getDocumentsByEncounter(encounterId: string): MedicalDocument[] {
  return getDb().documents.filter((d) => d.encounterId === encounterId);
}

export function getDocumentsByPatient(patientId: string): MedicalDocument[] {
  return getDb().documents.filter((d) => d.patientId === patientId);
}

// --- Timeline ---
export function addTimelineEvent(data: Omit<MedicalTimelineEvent, "id">): MedicalTimelineEvent {
  const db = getDb();
  const event: MedicalTimelineEvent = { id: randomUUID(), ...data };
  db.timelineEvents.push(event);
  saveDb();
  return event;
}

export function getTimelineByPatient(patientId: string): MedicalTimelineEvent[] {
  return getDb()
    .timelineEvents.filter((t) => t.patientId === patientId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// --- Summaries ---
export function upsertSummary(encounterId: string, summary: Omit<ClinicalSummary, "id" | "encounterId">): ClinicalSummary {
  const db = getDb();
  const idx = db.summaries.findIndex((s) => s.encounterId === encounterId);
  if (idx === -1) {
    const record: ClinicalSummary = { id: randomUUID(), encounterId, ...summary };
    db.summaries.push(record);
    saveDb();
    return record;
  }
  db.summaries[idx] = { ...db.summaries[idx], ...summary };
  saveDb();
  return db.summaries[idx];
}

export function getSummaryByEncounter(encounterId: string): ClinicalSummary | undefined {
  return getDb().summaries.find((s) => s.encounterId === encounterId);
}

export function updateSummary(id: string, patch: Partial<ClinicalSummary>): ClinicalSummary | undefined {
  const db = getDb();
  const idx = db.summaries.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  db.summaries[idx] = { ...db.summaries[idx], ...patch };
  saveDb();
  return db.summaries[idx];
}

// --- Triage Alerts ---
export function addTriageAlert(data: Omit<TriageAlert, "id" | "createdAt" | "acknowledged">): TriageAlert {
  const db = getDb();
  const alert: TriageAlert = { id: randomUUID(), createdAt: new Date().toISOString(), acknowledged: false, ...data };
  db.triageAlerts.push(alert);
  saveDb();
  return alert;
}

export function listTriageAlerts(): TriageAlert[] {
  return getDb().triageAlerts;
}

export function acknowledgeAlert(id: string, by: string): TriageAlert | undefined {
  const db = getDb();
  const idx = db.triageAlerts.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  db.triageAlerts[idx] = { ...db.triageAlerts[idx], acknowledged: true, acknowledgedBy: by, acknowledgedAt: new Date().toISOString() };
  saveDb();
  return db.triageAlerts[idx];
}

// --- Integration events ---
export function addIntegrationEvent(data: Omit<import("@/types").IntegrationEvent, "id" | "timestamp">) {
  const db = getDb();
  const record = { id: randomUUID(), timestamp: new Date().toISOString(), ...data };
  db.integrationEvents.push(record);
  saveDb();
  return record;
}

export function listIntegrationEvents() {
  return getDb().integrationEvents;
}

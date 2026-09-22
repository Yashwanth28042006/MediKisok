// Core domain types for MediKiosk prototype.
// Loosely modeled on FHIR-ready concepts (Patient, Encounter, Condition, etc.)
// Labeled "FHIR-ready prototype data structure" — not validated FHIR compliance.

export type Role = "patient" | "triage" | "doctor" | "admin" | "kiosk";

export type Language = "en" | "ta" | "hi";

export type Department =
  | "General Medicine"
  | "Cardiology"
  | "Orthopaedics"
  | "Dermatology"
  | "ENT"
  | "Paediatrics"
  | "Ayurveda";

export type Gender = "Male" | "Female" | "Other";

export type VisitType = "New Visit" | "Follow-up" | "Referral";

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  password: string; // demo only, plaintext for prototype
  department?: Department;
}

export interface Patient {
  id: string;
  patientId: string; // human readable MRN e.g. MK-2026-0001
  abhaId?: string; // 91-XXXX-XXXX-0123
  name: string;
  age: number;
  gender: Gender;
  mobile: string;
  preferredLanguage: Language;
  isReturning: boolean;
  createdAt: string;
}

export type Priority = "ROUTINE" | "HIGH";

export type IntakeStatus =
  | "NOT_STARTED"
  | "CONSENT_PENDING"
  | "INTERVIEW_IN_PROGRESS"
  | "DOCUMENTS_PENDING"
  | "SUMMARY_READY"
  | "PATIENT_CONFIRMED"
  | "DOCTOR_REVIEWING"
  | "DOCTOR_CONFIRMED";

export interface Encounter {
  id: string;
  token: string; // e.g. A014
  patientId: string;
  department: Department;
  visitType: VisitType;
  createdAt: string;
  intakeStatus: IntakeStatus;
  priority: Priority;
  chiefComplaint?: string;
  waitingSince: string;
  ayushMode?: boolean;
}

export interface ConsentRecord {
  id: string;
  patientId: string;
  encounterId: string;
  timestamp: string;
  purposes: {
    collectHealthInfo: boolean;
    processVoice: boolean;
    processDocuments: boolean;
    shareWithDoctor: boolean;
    linkAbha: boolean;
  };
}

export type AnswerSource = "patient_reported" | "document_extracted" | "system_highlighted" | "doctor_verified";

export interface ClinicalResponse {
  id: string;
  encounterId: string;
  questionId: string;
  category: string; // e.g. HPI, PMH, PSH, MEDICATION, ALLERGY, FHX, PERSONAL, ROS, AYUSH
  question: string;
  answer: string | string[];
  inputMode: "voice" | "touch" | "text";
  timestamp: string;
  source: AnswerSource;
}

export type DocumentType = "Prescription" | "Laboratory Report" | "Discharge Summary" | "Imaging Report" | "Other Document";

export type OcrConfidence = "high" | "medium" | "needs_verification";

export interface ExtractedEntity {
  label: string; // e.g. "Diagnosis", "Medication", "Investigation"
  value: string;
  detail?: string; // dosage/frequency/reference range
  confidence: OcrConfidence;
}

export interface MedicalDocument {
  id: string;
  encounterId: string;
  patientId: string;
  type: DocumentType;
  fileName: string;
  fileDataUrl?: string; // stored as data URL for prototype
  uploadedAt: string;
  documentDate?: string;
  hospital?: string;
  ocrStatus: "pending" | "processing" | "done" | "failed";
  extractedEntities: ExtractedEntity[];
  rawExtractedText?: string;
}

export type TimelineEventType = "diagnosis" | "medication" | "investigation" | "procedure" | "visit";

export interface MedicalTimelineEvent {
  id: string;
  patientId: string;
  date: string; // ISO date, approximate ok
  displayDate: string; // human label e.g. "2022" or "15 Sep 2026"
  type: TimelineEventType;
  title: string;
  description?: string;
  source: AnswerSource;
  sourceDocumentId?: string;
}

export interface ClinicalSummarySection {
  key: string;
  title: string;
  content: string;
  source: AnswerSource;
}

export interface ClinicalSummary {
  id: string;
  encounterId: string;
  generatedAt: string;
  sections: ClinicalSummarySection[];
  status: "draft" | "patient_confirmed" | "doctor_confirmed";
  doctorEdits?: { sectionKey: string; editedContent: string; editedAt: string }[];
  verification?: DoctorVerification;
}

export interface DoctorVerification {
  doctorName: string;
  confirmedAt: string;
  notes?: string;
}

export interface TriageAlert {
  id: string;
  encounterId: string;
  patientId: string;
  ruleId: string;
  severity: Priority;
  message: string;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  status: "success" | "failure" | "info";
  encounterId?: string;
  patientId?: string;
}

export interface IntegrationEvent {
  id: string;
  timestamp: string;
  system: "ABHA" | "HIS";
  action: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  status: "success" | "failure";
}

// --- Question engine ---

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "yes_no"
  | "numeric"
  | "date"
  | "voice_text"
  | "severity_scale"
  | "body_location";

export interface ClinicalQuestion {
  id: string;
  category: string;
  complaint?: string; // null/undefined = generic across complaints
  question: string;
  helpText?: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  next?: string | null;
}

export interface RedFlagCondition {
  field: string;
  operator: "equals" | "contains" | "gte" | "lte";
  value: string | number;
}

export interface RedFlagRule {
  id: string;
  conditions: RedFlagCondition[];
  severity: Priority;
  message: string;
}

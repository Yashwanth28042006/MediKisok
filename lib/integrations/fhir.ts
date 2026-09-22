import type { ClinicalSummary, Encounter, MedicalDocument, Patient } from "@/types";

// FHIR-ready prototype data structure. Loosely modeled on Patient, Encounter,
// Condition, MedicationStatement, AllergyIntolerance, Observation,
// DocumentReference, Consent and QuestionnaireResponse resource shapes.
// Not validated against the FHIR spec — for demo/interop illustration only.
export function buildFhirBundle(patient: Patient, encounter: Encounter, summary: ClinicalSummary, documents: MedicalDocument[]) {
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: patient.id,
          identifier: [{ system: "https://medikiosk.demo/mrn", value: patient.patientId }, ...(patient.abhaId ? [{ system: "https://abdm.gov.in/abha", value: patient.abhaId }] : [])],
          name: [{ text: patient.name }],
          gender: patient.gender.toLowerCase(),
        },
      },
      {
        resource: {
          resourceType: "Encounter",
          id: encounter.id,
          status: "in-progress",
          class: { code: "AMB" },
          subject: { reference: `Patient/${patient.id}` },
          serviceType: { text: encounter.department },
        },
      },
      {
        resource: {
          resourceType: "QuestionnaireResponse",
          id: `qr-${encounter.id}`,
          status: "completed",
          subject: { reference: `Patient/${patient.id}` },
        },
      },
      ...documents.map((d) => ({
        resource: {
          resourceType: "DocumentReference",
          id: d.id,
          status: "current",
          type: { text: d.type },
          date: d.uploadedAt,
          content: [{ attachment: { title: d.fileName } }],
        },
      })),
      {
        resource: {
          resourceType: "Composition",
          id: `summary-${summary.id}`,
          status: summary.status,
          section: summary.sections.map((s) => ({ title: s.title, text: s.content })),
        },
      },
    ],
  };
}

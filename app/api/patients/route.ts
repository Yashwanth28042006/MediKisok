import { NextRequest, NextResponse } from "next/server";
import { createPatient, createEncounter, generatePatientId, listPatients, nextToken, findPatientByPatientId } from "@/lib/db/repository";
import { logAudit } from "@/lib/audit";

export async function GET() {
  return NextResponse.json({ patients: listPatients() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    patientId, abhaId, name, age, gender, mobile, preferredLanguage,
    department, visitType, isReturning,
  } = body;

  if (patientId) {
    const existing = findPatientByPatientId(patientId);
    if (existing) {
      return NextResponse.json({ error: "A patient with this Patient ID already exists. Use 'I already have a Patient ID' to continue their visit instead." }, { status: 409 });
    }
  }

  const patient = createPatient({
    patientId: patientId || generatePatientId(),
    abhaId: abhaId || undefined,
    name,
    age: Number(age),
    gender,
    mobile,
    preferredLanguage: preferredLanguage || "en",
    isReturning: Boolean(isReturning),
  });

  const encounter = createEncounter({
    token: nextToken(),
    patientId: patient.id,
    department,
    visitType: visitType || "New Visit",
    intakeStatus: "CONSENT_PENDING",
    priority: "ROUTINE",
    ayushMode: department === "Ayurveda",
  });

  logAudit({ actor: patient.name, action: "Patient registered", resource: `Patient/${patient.id}`, status: "success", patientId: patient.id, encounterId: encounter.id });

  return NextResponse.json({ patient, encounter });
}

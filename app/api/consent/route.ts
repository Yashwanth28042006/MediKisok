import { NextRequest, NextResponse } from "next/server";
import { createConsent, getPatient, updateEncounter } from "@/lib/db/repository";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { patientId, encounterId, purposes } = body;
  const patient = getPatient(patientId);
  const consent = createConsent({ patientId, encounterId, purposes });
  updateEncounter(encounterId, { intakeStatus: "INTERVIEW_IN_PROGRESS" });
  logAudit({ actor: patient?.name ?? "Patient", action: "Consent granted", resource: `Consent/${consent.id}`, status: "success", patientId, encounterId });
  return NextResponse.json({ consent });
}

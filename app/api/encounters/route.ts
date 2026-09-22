import { NextRequest, NextResponse } from "next/server";
import { listEncounters, listPatients, createEncounter, nextToken, getPatient } from "@/lib/db/repository";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const department = searchParams.get("department");

  const patients = listPatients();
  const patientMap = new Map(patients.map((p) => [p.id, p]));

  let encounters = listEncounters();
  if (status) encounters = encounters.filter((e) => e.intakeStatus === status);
  if (priority) encounters = encounters.filter((e) => e.priority === priority);
  if (department) encounters = encounters.filter((e) => e.department === department);

  const enriched = encounters
    .map((e) => ({ encounter: e, patient: patientMap.get(e.patientId) }))
    .filter((row) => row.patient)
    .sort((a, b) => new Date(b.encounter.createdAt).getTime() - new Date(a.encounter.createdAt).getTime());

  return NextResponse.json({ rows: enriched });
}

export async function POST(req: NextRequest) {
  const { patientId, department, visitType } = await req.json();
  const patient = getPatient(patientId);
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const encounter = createEncounter({
    token: nextToken(),
    patientId: patient.id,
    department,
    visitType: visitType || "Follow-up",
    intakeStatus: "CONSENT_PENDING",
    priority: "ROUTINE",
    ayushMode: department === "Ayurveda",
  });

  logAudit({ actor: patient.name, action: "Returning patient visit started", resource: `Encounter/${encounter.id}`, status: "success", patientId: patient.id, encounterId: encounter.id });

  return NextResponse.json({ patient, encounter });
}

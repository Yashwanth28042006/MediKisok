import { NextRequest, NextResponse } from "next/server";
import {
  getEncounter, getPatient, getResponsesByEncounter, getDocumentsByEncounter,
  getTimelineByPatient, getSummaryByEncounter, getConsentByEncounter, updateEncounter,
} from "@/lib/db/repository";
import { getDb } from "@/lib/db/store";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encounter = getEncounter(id);
  if (!encounter) return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  const patient = getPatient(encounter.patientId);
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const responses = getResponsesByEncounter(id);
  const documents = getDocumentsByEncounter(id);
  const timeline = getTimelineByPatient(patient.id);
  const summary = getSummaryByEncounter(id);
  const consent = getConsentByEncounter(id);
  const alerts = getDb().triageAlerts.filter((a) => a.encounterId === id);

  return NextResponse.json({ encounter, patient, responses, documents, timeline, summary, consent, alerts });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patch = await req.json();
  const updated = updateEncounter(id, patch);
  if (!updated) return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  logAudit({ actor: "System", action: `Encounter status updated to ${patch.intakeStatus ?? "n/a"}`, resource: `Encounter/${id}`, status: "success", encounterId: id, patientId: updated.patientId });
  return NextResponse.json({ encounter: updated });
}

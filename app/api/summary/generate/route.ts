import { NextRequest, NextResponse } from "next/server";
import {
  getEncounter, getPatient, getResponsesByEncounter, getDocumentsByEncounter,
  getTimelineByPatient, upsertSummary, updateEncounter,
} from "@/lib/db/repository";
import { getDb } from "@/lib/db/store";
import { generateSummarySections } from "@/lib/summary/generate";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { encounterId } = await req.json();
  const encounter = getEncounter(encounterId);
  if (!encounter) return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  const patient = getPatient(encounter.patientId);
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const responses = getResponsesByEncounter(encounterId);
  const documents = getDocumentsByEncounter(encounterId);
  const timeline = getTimelineByPatient(patient.id);
  const alerts = getDb().triageAlerts.filter((a) => a.encounterId === encounterId);

  const sections = generateSummarySections(patient, encounter, responses, documents, timeline, alerts);
  const summary = upsertSummary(encounterId, { generatedAt: new Date().toISOString(), sections, status: "draft" });
  updateEncounter(encounterId, { intakeStatus: "SUMMARY_READY" });

  logAudit({ actor: "Summary Generator", action: "Summary generated", resource: `ClinicalSummary/${summary.id}`, status: "success", encounterId, patientId: patient.id });

  return NextResponse.json({ summary });
}

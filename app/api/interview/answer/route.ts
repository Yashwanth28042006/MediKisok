import { NextRequest, NextResponse } from "next/server";
import { addClinicalResponse, getEncounter, updateEncounter, addTimelineEvent } from "@/lib/db/repository";
import { runTriageCheck } from "@/lib/triage/runCheck";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { encounterId, questionId, category, question, answer, inputMode } = body;

  const encounter = getEncounter(encounterId);
  if (!encounter) return NextResponse.json({ error: "Encounter not found" }, { status: 404 });

  const response = addClinicalResponse({
    encounterId, questionId, category, question, answer, inputMode: inputMode || "touch", source: "patient_reported",
  });

  if (questionId === "CC001") {
    const complaint = Array.isArray(answer) ? answer[0] : answer;
    updateEncounter(encounterId, { chiefComplaint: complaint });
    addTimelineEvent({
      patientId: encounter.patientId,
      date: new Date().toISOString(),
      displayDate: "Today",
      type: "visit",
      title: `Current visit – ${complaint}`,
      source: "patient_reported",
    });
  }

  const newAlerts = runTriageCheck(encounterId);

  logAudit({
    actor: "Patient", action: `Answer recorded: ${category}`, resource: `ClinicalResponse/${response.id}`,
    status: "success", encounterId, patientId: encounter.patientId,
  });

  return NextResponse.json({ response, newAlerts });
}

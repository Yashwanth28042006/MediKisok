import { NextRequest, NextResponse } from "next/server";
import { updateSummary, updateEncounter } from "@/lib/db/repository";
import { getDb } from "@/lib/db/store";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, doctorName, notes } = body as { action: "patient_confirm" | "doctor_confirm"; doctorName?: string; notes?: string };

  const summary = getDb().summaries.find((s) => s.id === id);
  if (!summary) return NextResponse.json({ error: "Summary not found" }, { status: 404 });

  if (action === "patient_confirm") {
    const updated = updateSummary(id, { status: "patient_confirmed" });
    updateEncounter(summary.encounterId, { intakeStatus: "PATIENT_CONFIRMED" });
    logAudit({ actor: "Patient", action: "Patient confirmed clinical summary", resource: `ClinicalSummary/${id}`, status: "success", encounterId: summary.encounterId });
    return NextResponse.json({ summary: updated });
  }

  const verification = { doctorName: doctorName ?? "Doctor", confirmedAt: new Date().toISOString(), notes };
  const updated = updateSummary(id, { status: "doctor_confirmed", verification });
  updateEncounter(summary.encounterId, { intakeStatus: "DOCTOR_CONFIRMED" });
  logAudit({ actor: doctorName ?? "Doctor", action: "Doctor confirmed clinical history", resource: `ClinicalSummary/${id}`, status: "success", encounterId: summary.encounterId });
  return NextResponse.json({ summary: updated });
}

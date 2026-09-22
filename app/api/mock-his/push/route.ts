import { NextRequest, NextResponse } from "next/server";
import { mockHisService } from "@/lib/integrations/his";
import { buildFhirBundle } from "@/lib/integrations/fhir";
import { getEncounter, getPatient, getSummaryByEncounter, getDocumentsByEncounter, addIntegrationEvent } from "@/lib/db/repository";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { encounterId, simulateUnavailable } = await req.json();
  const encounter = getEncounter(encounterId);
  const patient = encounter ? getPatient(encounter.patientId) : undefined;
  const summary = getSummaryByEncounter(encounterId);

  if (!encounter || !patient || !summary) {
    return NextResponse.json({ error: "Encounter, patient or summary not found" }, { status: 404 });
  }

  if (simulateUnavailable) {
    addIntegrationEvent({ system: "HIS", action: "push", requestPayload: { encounterId }, responsePayload: { error: "Demo HIS unavailable" }, status: "failure" });
    logAudit({ actor: "System", action: "HIS push failed — system unavailable", resource: `Encounter/${encounterId}`, status: "failure", encounterId, patientId: patient.id });
    return NextResponse.json({ success: false, message: "Demo HIS is currently unavailable. The record has been queued and will retry automatically." }, { status: 503 });
  }

  const documents = getDocumentsByEncounter(encounterId);
  const bundle = buildFhirBundle(patient, encounter, summary, documents);
  const result = await mockHisService.pushClinicalHistory(bundle);

  addIntegrationEvent({ system: "HIS", action: "push", requestPayload: bundle, responsePayload: result, status: "success" });
  logAudit({ actor: "System", action: "Clinical history pushed to Demo HIS", resource: `Encounter/${encounterId}`, status: "success", encounterId, patientId: patient.id });

  return NextResponse.json({ ...result, bundle });
}

import { NextRequest, NextResponse } from "next/server";
import { mockAbhaService } from "@/lib/integrations/abha";
import { addIntegrationEvent } from "@/lib/db/repository";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { patientId, summaryId } = await req.json();
  const result = await mockAbhaService.pushHistory(patientId, summaryId);
  addIntegrationEvent({ system: "ABHA", action: "share-history", requestPayload: { patientId, summaryId }, responsePayload: result, status: result.success ? "success" : "failure" });
  logAudit({ actor: "System", action: "Clinical history shared to ABHA sandbox", resource: `ClinicalSummary/${summaryId}`, status: "success", patientId });
  return NextResponse.json(result);
}

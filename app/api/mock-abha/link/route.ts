import { NextRequest, NextResponse } from "next/server";
import { mockAbhaService } from "@/lib/integrations/abha";
import { addIntegrationEvent } from "@/lib/db/repository";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { patientId, abhaId } = await req.json();
  const result = await mockAbhaService.link(patientId, abhaId);
  addIntegrationEvent({ system: "ABHA", action: "link", requestPayload: { patientId, abhaId }, responsePayload: result, status: "success" });
  logAudit({ actor: "System", action: "Patient linked to ABHA (sandbox)", resource: `Patient/${patientId}`, status: "success", patientId });
  return NextResponse.json(result);
}

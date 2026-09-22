import { NextRequest, NextResponse } from "next/server";
import { mockAbhaService } from "@/lib/integrations/abha";
import { addIntegrationEvent } from "@/lib/db/repository";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { abhaId } = await req.json();
  const result = await mockAbhaService.verify(abhaId);
  addIntegrationEvent({ system: "ABHA", action: "verify", requestPayload: { abhaId }, responsePayload: result, status: result.verified ? "success" : "failure" });
  logAudit({ actor: "System", action: "ABHA verification attempted", resource: "ABHA/verify", status: result.verified ? "success" : "failure" });
  return NextResponse.json(result);
}

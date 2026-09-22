import { NextRequest, NextResponse } from "next/server";
import { mockAbhaService } from "@/lib/integrations/abha";
import { addIntegrationEvent } from "@/lib/db/repository";

export async function POST(req: NextRequest) {
  const { abhaId } = await req.json();
  const result = await mockAbhaService.fetchPreviousRecords(abhaId);
  addIntegrationEvent({ system: "ABHA", action: "fetch-records", requestPayload: { abhaId }, responsePayload: result, status: "success" });
  return NextResponse.json(result);
}

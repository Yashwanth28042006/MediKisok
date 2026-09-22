import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const encounterId = searchParams.get("encounterId") ?? undefined;
  const patientId = searchParams.get("patientId") ?? undefined;
  return NextResponse.json({ logs: getAuditLogs({ encounterId, patientId }) });
}

import { NextRequest, NextResponse } from "next/server";
import { acknowledgeAlert } from "@/lib/db/repository";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { by } = await req.json().catch(() => ({ by: "Triage Staff" }));
  const alert = acknowledgeAlert(id, by ?? "Triage Staff");
  if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  logAudit({ actor: by ?? "Triage Staff", action: "Priority alert acknowledged", resource: `TriageAlert/${id}`, status: "success", encounterId: alert.encounterId, patientId: alert.patientId });
  return NextResponse.json({ alert });
}

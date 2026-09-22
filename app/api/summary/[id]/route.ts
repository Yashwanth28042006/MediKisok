import { NextRequest, NextResponse } from "next/server";
import { updateSummary } from "@/lib/db/repository";
import { getDb } from "@/lib/db/store";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { sectionKey, editedContent, editedBy } = body;

  const summary = getDb().summaries.find((s) => s.id === id);
  if (!summary) return NextResponse.json({ error: "Summary not found" }, { status: 404 });

  const sections = summary.sections.map((s) => (s.key === sectionKey ? { ...s, content: editedContent, source: "doctor_verified" as const } : s));
  const doctorEdits = [...(summary.doctorEdits ?? []), { sectionKey, editedContent, editedAt: new Date().toISOString() }];
  const updated = updateSummary(id, { sections, doctorEdits });

  logAudit({ actor: editedBy ?? "Doctor", action: `Summary section edited: ${sectionKey}`, resource: `ClinicalSummary/${id}`, status: "success", encounterId: summary.encounterId });

  return NextResponse.json({ summary: updated });
}

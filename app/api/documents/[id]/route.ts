import { NextRequest, NextResponse } from "next/server";
import { getDocument, updateDocument } from "@/lib/db/repository";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return NextResponse.json({ document: doc });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patch = await req.json();
  const doc = getDocument(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  const updated = updateDocument(id, patch);
  logAudit({ actor: "User", action: "Extracted document information edited", resource: `MedicalDocument/${id}`, status: "success", encounterId: doc.encounterId, patientId: doc.patientId });
  return NextResponse.json({ document: updated });
}

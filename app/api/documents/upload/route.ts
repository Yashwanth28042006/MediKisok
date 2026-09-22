import { NextRequest, NextResponse } from "next/server";
import { addDocument, getEncounter, updateEncounter } from "@/lib/db/repository";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { encounterId, patientId, type, fileName, fileDataUrl } = body;

  const encounter = getEncounter(encounterId);
  if (!encounter) return NextResponse.json({ error: "Encounter not found" }, { status: 404 });

  const doc = addDocument({
    encounterId, patientId, type, fileName, fileDataUrl,
    ocrStatus: "pending", extractedEntities: [],
  });

  updateEncounter(encounterId, { intakeStatus: "DOCUMENTS_PENDING" });

  logAudit({ actor: "Patient", action: "Document uploaded", resource: `MedicalDocument/${doc.id}`, status: "success", encounterId, patientId });

  return NextResponse.json({ document: doc });
}

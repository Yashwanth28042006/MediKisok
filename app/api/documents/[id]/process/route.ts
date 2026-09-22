import { NextRequest, NextResponse } from "next/server";
import { getDocument, updateDocument, addTimelineEvent } from "@/lib/db/repository";
import { simulateOcr } from "@/lib/ocr/simulate";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { forceFail } = await req.json().catch(() => ({ forceFail: false }));

  const doc = getDocument(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  updateDocument(id, { ocrStatus: "processing" });

  if (forceFail) {
    const failed = updateDocument(id, { ocrStatus: "failed" });
    logAudit({ actor: "OCR Engine", action: "OCR processing failed", resource: `MedicalDocument/${id}`, status: "failure", encounterId: doc.encounterId, patientId: doc.patientId });
    return NextResponse.json({ document: failed });
  }

  const result = simulateOcr(doc.type);
  const updated = updateDocument(id, {
    ocrStatus: "done",
    documentDate: result.documentDate,
    hospital: result.hospital,
    extractedEntities: result.extractedEntities,
    rawExtractedText: result.rawExtractedText,
  });

  const parsedDate = Date.parse(result.documentDate);
  const eventDate = Number.isNaN(parsedDate) ? new Date().toISOString() : new Date(parsedDate).toISOString();

  for (const entity of result.extractedEntities) {
    if (["Diagnosis", "Medication", "Investigation", "Procedure"].includes(entity.label)) {
      addTimelineEvent({
        patientId: doc.patientId,
        date: eventDate,
        displayDate: result.documentDate,
        type: entity.label.toLowerCase() as "diagnosis" | "medication" | "investigation" | "procedure",
        title: entity.detail ? `${entity.value} — ${entity.detail}` : entity.value,
        source: "document_extracted",
        sourceDocumentId: doc.id,
      });
    }
  }

  logAudit({ actor: "OCR Engine", action: "OCR processed", resource: `MedicalDocument/${id}`, status: "success", encounterId: doc.encounterId, patientId: doc.patientId });

  return NextResponse.json({ document: updated });
}

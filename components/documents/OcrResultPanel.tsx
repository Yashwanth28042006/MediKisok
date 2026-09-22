"use client";

import { useState } from "react";
import type { MedicalDocument, ExtractedEntity } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Check, X, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";

const CONFIDENCE_STYLE: Record<ExtractedEntity["confidence"], string> = {
  high: "bg-success/15 text-success border-success/30",
  medium: "bg-warning/20 text-warning-foreground border-warning/40",
  needs_verification: "bg-urgent/10 text-urgent border-urgent/30",
};

const CONFIDENCE_LABEL: Record<ExtractedEntity["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  needs_verification: "Needs verification",
};

export function OcrResultPanel({ document, onUpdated }: { document: MedicalDocument; onUpdated: (doc: MedicalDocument) => void }) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [imgError, setImgError] = useState(false);

  if (document.ocrStatus === "failed") {
    return (
      <Card className="border-urgent/40 bg-urgent/5">
        <CardContent className="flex items-center gap-3 py-4 text-sm text-urgent">
          <FileWarning className="size-5 shrink-0" />
          <div>
            <p className="font-medium">Document could not be read</p>
            <p className="text-urgent/80">The document appears unreadable. Please try uploading a clearer photo, or continue without OCR — the doctor can review the original file.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const saveEdit = async (idx: number) => {
    const updated = [...document.extractedEntities];
    updated[idx] = { ...updated[idx], value: draft, confidence: "high" };
    const { document: doc } = await api.patch<{ document: MedicalDocument }>(`/api/documents/${document.id}`, { extractedEntities: updated });
    onUpdated(doc);
    setEditingIdx(null);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original Document</p>
        <Card className="overflow-hidden">
          <CardContent className="flex aspect-[3/4] items-center justify-center bg-muted/40 p-0">
            {document.fileDataUrl?.startsWith("data:image") && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={document.fileDataUrl} alt={document.fileName} className="size-full object-contain" onError={() => setImgError(true)} />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <FileWarning className="size-8" />
                <span className="text-xs">{document.fileName}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Extracted Information</p>
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Document Date</p>
                <p className="font-medium">{document.documentDate ?? "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hospital</p>
                <p className="font-medium">{document.hospital ?? "Unknown"}</p>
              </div>
            </div>
            <div className="space-y-2">
              {document.extractedEntities.map((entity, idx) => (
                <div key={idx} className="rounded-lg border p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{entity.label}</p>
                      {editingIdx === idx ? (
                        <div className="mt-1 flex items-center gap-1.5">
                          <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="h-7 text-sm" autoFocus />
                          <Button size="icon-sm" className="size-7" onClick={() => saveEdit(idx)}><Check className="size-3.5" /></Button>
                          <Button size="icon-sm" variant="ghost" className="size-7" onClick={() => setEditingIdx(null)}><X className="size-3.5" /></Button>
                        </div>
                      ) : (
                        <p className="truncate text-sm font-medium">{entity.value}{entity.detail ? ` — ${entity.detail}` : ""}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className={cn("text-[10px] font-normal", CONFIDENCE_STYLE[entity.confidence])}>
                        {CONFIDENCE_LABEL[entity.confidence]}
                      </Badge>
                      {editingIdx !== idx && (
                        <button onClick={() => { setEditingIdx(idx); setDraft(entity.value); }} className="text-muted-foreground hover:text-foreground">
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

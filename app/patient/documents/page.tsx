"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KioskShell } from "@/components/patient/KioskShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useKioskStore } from "@/lib/store/kioskStore";
import { api } from "@/lib/api/client";
import { DOCUMENT_TYPES } from "@/data/documentTypes";
import { OCR_STAGES } from "@/lib/ocr/simulate";
import { OcrResultPanel } from "@/components/documents/OcrResultPanel";
import type { DocumentType, MedicalDocument } from "@/types";
import { Upload, ArrowRight, Loader2, CheckCircle2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function DocumentsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isDemo = params.get("demo") === "1";
  const { encounterId, patientId } = useKioskStore();

  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processingStage, setProcessingStage] = useState<number | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null, forceFail = false) => {
      if (!files || files.length === 0 || !selectedType || !encounterId || !patientId) return;
      const file = files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        try {
          const { document: doc } = await api.post<{ document: MedicalDocument }>("/api/documents/upload", {
            encounterId, patientId, type: selectedType, fileName: file.name, fileDataUrl: dataUrl,
          });
          setDocuments((d) => [...d, doc]);
          setSelectedType(null);
          await runOcr(doc.id, forceFail);
        } catch {
          toast.error("Upload failed. Please try again.");
        }
      };
      reader.readAsDataURL(file);
    },
    [selectedType, encounterId, patientId]
  );

  async function runOcr(docId: string, forceFail = false) {
    setProcessingStage(0);
    for (let i = 0; i < OCR_STAGES.length; i++) {
      setProcessingStage(i);
      await new Promise((r) => setTimeout(r, 550));
    }
    try {
      const { document: processed } = await api.post<{ document: MedicalDocument }>(`/api/documents/${docId}/process`, { forceFail });
      setDocuments((docs) => docs.map((d) => (d.id === docId ? processed : d)));
    } catch {
      toast.error("OCR processing failed.");
    } finally {
      setProcessingStage(null);
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const updateDoc = (doc: MedicalDocument) => setDocuments((docs) => docs.map((d) => (d.id === doc.id ? doc : d)));

  const handleContinue = () => router.push(`/patient/timeline${isDemo ? "?demo=1" : ""}`);

  return (
    <KioskShell stage="scan" listenText="Add your previous medical records such as prescriptions or lab reports. You can also skip this step if you don't have any.">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Add Your Previous Medical Records</h1>
          <p className="mt-1 text-sm text-muted-foreground">Prescriptions, lab reports, discharge summaries — anything that helps your doctor.</p>
        </div>

        {!selectedType && processingStage === null && (
          <div>
            {documents.length > 0 && <p className="mb-2 text-sm font-medium text-muted-foreground">Add another document</p>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DOCUMENT_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Icon className="size-7 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
          </div>
        )}

        {selectedType && processingStage === null && (
          <Card
            className={cn("border-2 border-dashed transition-colors", dragOver && "border-primary bg-primary/5")}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Upload className="size-10 text-primary" />
              <p className="font-medium">Drop your {selectedType} here</p>
              <p className="text-xs text-muted-foreground">PDF, JPG or PNG — or use camera/scanner simulation</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <Button onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                  <Upload className="size-4" /> Browse File
                </Button>
                <Button variant="outline" onClick={() => handleFiles(makeFakeFileList(`${selectedType}_scan.jpg`))}>
                  📷 Simulate Camera Scan
                </Button>
                <Button variant="ghost" onClick={() => setSelectedType(null)}>Cancel</Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </CardContent>
          </Card>
        )}

        {processingStage !== null && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="font-medium">Reading your medical document...</p>
              <div className="w-full max-w-xs space-y-1.5">
                {OCR_STAGES.map((stage, i) => (
                  <div key={stage} className={cn("flex items-center gap-2 text-sm", i <= processingStage ? "text-foreground" : "text-muted-foreground/50")}>
                    {i < processingStage ? <CheckCircle2 className="size-4 text-success" /> : i === processingStage ? <Loader2 className="size-4 animate-spin text-primary" /> : <div className="size-4" />}
                    {stage}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {documents.some((d) => d.ocrStatus === "done" || d.ocrStatus === "failed") && (
          <div className="space-y-6">
            {documents.filter((d) => d.ocrStatus === "done" || d.ocrStatus === "failed").map((doc) => (
              <div key={doc.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{doc.type} — {doc.fileName}</p>
                  {doc.ocrStatus === "failed" && (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => runOcr(doc.id, false)}>
                      <RefreshCcw className="size-3.5" /> Retry OCR
                    </Button>
                  )}
                </div>
                <OcrResultPanel document={doc} onUpdated={updateDoc} />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between">
          {!selectedType && processingStage === null && (
            <p className="text-xs text-muted-foreground">You can add more documents or continue when ready.</p>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={handleContinue}>Skip this step</Button>
            <Button className="gap-1.5" onClick={handleContinue}>
              Continue <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </KioskShell>
  );
}

function makeFakeFileList(name: string): FileList {
  const blob = new Blob(["simulated scan"], { type: "image/jpeg" });
  const file = new File([blob], name, { type: "image/jpeg" });
  const dt = new DataTransfer();
  dt.items.add(file);
  return dt.files;
}

export default function DocumentsPage() {
  return (
    <Suspense>
      <DocumentsContent />
    </Suspense>
  );
}

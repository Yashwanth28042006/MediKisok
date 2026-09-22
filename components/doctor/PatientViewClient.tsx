"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AuditLogEntry, ClinicalResponse, ClinicalSummary, ConsentRecord, Encounter,
  MedicalDocument, MedicalTimelineEvent, Patient, TriageAlert,
} from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { SourceBadge } from "@/components/common/SourceBadge";
import { Timeline } from "@/components/timeline/Timeline";
import { ClinicalSummaryView } from "@/components/clinical/ClinicalSummaryView";
import { OcrResultPanel } from "@/components/documents/OcrResultPanel";
import { classifyLabDetail, type LabBadge } from "@/lib/clinical/labUtils";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import {
  User, AlertTriangle, MessageSquareWarning, Ban,
  CheckCircle2, Send, ArrowLeft, FlaskConical, ShieldCheck, History as HistoryIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LAB_BADGE_STYLE: Record<LabBadge, string> = {
  NORMAL: "bg-success/15 text-success border-success/30",
  HIGH: "bg-urgent/10 text-urgent border-urgent/30",
  LOW: "bg-warning/20 text-warning-foreground border-warning/40",
  UNKNOWN: "bg-muted text-muted-foreground border-border",
};

export function PatientViewClient({
  encounter, patient, responses, documents, timeline, summary, consent, alerts, auditLogs, doctorName,
}: {
  encounter: Encounter; patient: Patient; responses: ClinicalResponse[]; documents: MedicalDocument[];
  timeline: MedicalTimelineEvent[]; summary: ClinicalSummary | null; consent: ConsentRecord | null;
  alerts: TriageAlert[]; auditLogs: AuditLogEntry[]; doctorName: string;
}) {
  const router = useRouter();
  const [currentSummary, setCurrentSummary] = useState(summary);
  const [docs, setDocs] = useState(documents);
  const [confirming, setConfirming] = useState(false);
  const [pushing, setPushing] = useState<"his" | "abha" | null>(null);

  const handleEditSection = async (sectionKey: string, content: string) => {
    if (!currentSummary) return;
    const { summary: updated } = await api.patch<{ summary: ClinicalSummary }>(`/api/summary/${currentSummary.id}`, {
      sectionKey, editedContent: content, editedBy: doctorName,
    });
    setCurrentSummary(updated);
    toast.success("Section updated");
  };

  const handleConfirm = async () => {
    if (!currentSummary) return;
    setConfirming(true);
    try {
      const { summary: updated } = await api.post<{ summary: ClinicalSummary }>(`/api/summary/${currentSummary.id}/verify`, {
        action: "doctor_confirm", doctorName,
      });
      setCurrentSummary(updated);
      toast.success("Clinical history confirmed");
      router.refresh();
    } catch {
      toast.error("Could not confirm history");
    } finally {
      setConfirming(false);
    }
  };

  const handlePushHis = async () => {
    setPushing("his");
    try {
      const res = await api.post<{ success: boolean; message: string }>("/api/mock-his/push", { encounterId: encounter.id });
      toast.success(res.message);
    } catch {
      toast.error("HIS push failed");
    } finally {
      setPushing(null);
    }
  };

  const handlePushAbha = async () => {
    if (!currentSummary) return;
    setPushing("abha");
    try {
      const res = await api.post<{ message: string }>("/api/mock-abha/share-history", { patientId: patient.id, summaryId: currentSummary.id });
      toast.success(res.message);
    } catch {
      toast.error("ABHA push failed");
    } finally {
      setPushing(null);
    }
  };

  const investigations = docs.flatMap((d) =>
    d.extractedEntities.filter((e) => e.label === "Investigation").map((e) => ({ ...e, doc: d }))
  );

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.push("/doctor")}>
        <ArrowLeft className="size-4" /> Back to Dashboard
      </Button>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{patient.name}</h1>
                <PriorityBadge priority={encounter.priority} />
              </div>
              <p className="text-sm text-muted-foreground">
                {patient.age} yrs, {patient.gender} · Token {encounter.token} · {encounter.department}
                {patient.abhaId && ` · ABHA ${patient.abhaId}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1.5" onClick={handlePushHis} disabled={pushing === "his"}>
              <Send className="size-4" /> {pushing === "his" ? "Pushing..." : "Push to HIS"}
            </Button>
            {patient.abhaId && (
              <Button variant="outline" className="gap-1.5" onClick={handlePushAbha} disabled={pushing === "abha"}>
                <Send className="size-4" /> {pushing === "abha" ? "Pushing..." : "Push to ABHA"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {alerts.length > 0 && (
        <Card className="border-urgent/40 bg-urgent/5">
          <CardContent className="flex flex-wrap items-start gap-3 pt-5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-urgent" />
            <div className="space-y-1">
              <p className="font-semibold text-urgent">Priority symptoms flagged by triage assistance</p>
              {alerts.map((a) => (
                <p key={a.id} className="text-sm text-urgent/90">{a.message} <span className="text-xs text-muted-foreground">({a.ruleId})</span></p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="summary">
        <TabsList className="flex-wrap">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="investigations">Investigations</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          {currentSummary ? (
            <div className="space-y-4">
              <ClinicalSummaryView summary={currentSummary} editable onEditSection={handleEditSection} />
              <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-3">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Clarification request sent to patient record (demo)")}>
                  <MessageSquareWarning className="size-3.5" /> Request Clarification
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-urgent" onClick={() => toast.warning("Section marked incorrect — flagged for revision (demo)")}>
                  <Ban className="size-3.5" /> Mark Incorrect
                </Button>
                <div className="flex-1" />
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={confirming || currentSummary.status === "doctor_confirmed"}
                  onClick={handleConfirm}
                >
                  <CheckCircle2 className="size-3.5" />
                  {currentSummary.status === "doctor_confirmed" ? "History Confirmed" : confirming ? "Confirming..." : "Confirm History"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No summary generated yet for this encounter.</p>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-2">
          {responses.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No interview responses recorded.</p>}
          {responses.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{r.category}</p>
                  <p className="text-sm font-medium">{r.question}</p>
                  <p className="text-sm text-primary">{Array.isArray(r.answer) ? r.answer.join(", ") : r.answer}</p>
                </div>
                <SourceBadge source={r.source} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card><CardContent className="pt-6"><Timeline events={timeline} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-6">
          {docs.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No documents uploaded.</p>}
          {docs.map((doc) => (
            <div key={doc.id} className="space-y-2">
              <p className="text-sm font-semibold">{doc.type} — {doc.fileName}</p>
              <OcrResultPanel document={doc} onUpdated={(updated) => setDocs((d) => d.map((x) => (x.id === updated.id ? updated : x)))} />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="investigations" className="mt-4">
          {investigations.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No investigation results on record.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {investigations.map((inv, i) => {
                const badge = classifyLabDetail(inv.detail);
                return (
                  <Card key={i}>
                    <CardContent className="flex items-center justify-between gap-2 py-4">
                      <div className="flex items-center gap-3">
                        <FlaskConical className="size-5 text-teal" />
                        <div>
                          <p className="text-sm font-semibold">{inv.value}</p>
                          <p className="text-xs text-muted-foreground">{inv.detail}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("font-medium", LAB_BADGE_STYLE[badge])}>{badge}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="consent" className="mt-4">
          {consent ? (
            <Card>
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-center gap-2 text-success">
                  <ShieldCheck className="size-5" />
                  <p className="font-semibold">Consent granted {new Date(consent.timestamp).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(consent.purposes).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={cn("size-2 rounded-full", val ? "bg-success" : "bg-muted-foreground/30")} />
                      <span className="capitalize text-muted-foreground">{key.replace(/([A-Z])/g, " $1")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No consent record found.</p>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-4 space-y-2">
          {auditLogs.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No audit entries yet.</p>}
          {auditLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="flex items-center gap-2.5">
                  <HistoryIcon className="size-3.5 text-muted-foreground" />
                  <span>{log.action}</span>
                  <span className="text-xs text-muted-foreground">by {log.actor}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

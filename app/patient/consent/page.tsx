"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KioskShell } from "@/components/patient/KioskShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useKioskStore } from "@/lib/store/kioskStore";
import { api } from "@/lib/api/client";
import { speakText } from "@/hooks/useSpeech";
import { ShieldCheck, Volume2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const AUDIO_EXPLANATION =
  "MediKiosk will collect the information you provide, including your voice responses and uploaded medical records, to prepare a draft clinical history for your doctor. Your information is kept confidential and used only for your care today.";

function ConsentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isDemo = params.get("demo") === "1";
  const { language, patientId, encounterId } = useKioskStore();

  const [purposes, setPurposes] = useState({
    collectHealthInfo: true,
    processVoice: true,
    processDocuments: true,
    shareWithDoctor: true,
    linkAbha: false,
  });
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (key: keyof typeof purposes) => setPurposes((p) => ({ ...p, [key]: !p[key] }));

  const canContinue = purposes.collectHealthInfo && purposes.processVoice && purposes.processDocuments && purposes.shareWithDoctor;

  const handleAgree = async () => {
    if (!patientId || !encounterId) {
      toast.error("Session expired. Please register again.");
      router.push("/patient/start");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/consent", { patientId, encounterId, purposes });
      router.push(`/patient/interview${isDemo ? "?demo=1" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save consent");
    } finally {
      setSubmitting(false);
    }
  };

  const cards = [
    { key: "collectHealthInfo" as const, label: "Collect health information", desc: "The symptoms and history you share with us today." },
    { key: "processVoice" as const, label: "Process voice responses", desc: "Convert your spoken answers to text using on-device speech recognition." },
    { key: "processDocuments" as const, label: "Process uploaded medical records", desc: "Read and organise prescriptions or reports you upload." },
    { key: "shareWithDoctor" as const, label: "Share clinical summary with hospital doctor", desc: "So your doctor has your history before you meet." },
  ];

  return (
    <KioskShell stage="identify" listenText={AUDIO_EXPLANATION}>
      <Card className="mx-auto max-w-xl shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-1 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <CardTitle className="text-2xl">Before We Begin</CardTitle>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            MediKiosk will collect information you provide to prepare a draft clinical history for your doctor.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {cards.map((c) => (
            <label key={c.key} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 hover:bg-muted/40">
              <Checkbox checked={purposes[c.key]} onCheckedChange={() => toggle(c.key)} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
            </label>
          ))}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed p-3.5 hover:bg-muted/40">
            <Checkbox checked={purposes.linkAbha} onCheckedChange={() => toggle("linkAbha")} className="mt-0.5" />
            <div>
              <p className="text-sm font-medium">Link information with ABHA <span className="text-muted-foreground font-normal">(optional)</span></p>
              <p className="text-xs text-muted-foreground">Sandbox simulation only — no real ABDM connectivity.</p>
            </div>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <Button variant="link" size="sm" className="h-auto gap-1 p-0 text-xs" onClick={() => setPrivacyOpen(true)}>
              <Eye className="size-3.5" /> View Privacy Details
            </Button>
            <Button variant="link" size="sm" className="h-auto gap-1 p-0 text-xs" onClick={() => speakText(AUDIO_EXPLANATION, language)}>
              <Volume2 className="size-3.5" /> Play Audio Explanation
            </Button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => router.push("/patient/start")}>Cancel</Button>
            <Button className="flex-1" disabled={!canContinue || submitting} onClick={handleAgree}>
              {submitting ? "Saving..." : "I Agree & Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Privacy Details</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Your information is stored securely and shared only with the treating hospital team for your care today.</p>
            <p>Documents and voice recordings are processed to extract structured medical information and are not shared with third parties.</p>
            <p>All AI-generated content is a draft that a clinician verifies before it becomes part of your medical record.</p>
            <p>You may withdraw consent at any time by ending this kiosk session.</p>
          </div>
        </DialogContent>
      </Dialog>
    </KioskShell>
  );
}

export default function ConsentPage() {
  return (
    <Suspense>
      <ConsentContent />
    </Suspense>
  );
}

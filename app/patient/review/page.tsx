"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KioskShell } from "@/components/patient/KioskShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/common/LoadingState";
import { useKioskStore } from "@/lib/store/kioskStore";
import { api } from "@/lib/api/client";
import { speakText } from "@/hooks/useSpeech";
import type { ClinicalSummary } from "@/types";
import { Volume2, Pencil, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

function ReviewContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isDemo = params.get("demo") === "1";
  const { encounterId, language } = useKioskStore();
  const [summary, setSummary] = useState<ClinicalSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!encounterId) {
      router.push("/patient/start");
      return;
    }
    (async () => {
      const { summary } = await api.post<{ summary: ClinicalSummary }>("/api/summary/generate", { encounterId });
      setSummary(summary);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterId]);

  const listenToSummary = () => {
    if (!summary) return;
    const text = summary.sections.map((s) => `${s.title}. ${s.content}`).join(". ");
    const ok = speakText(text, language);
    if (!ok) toast.error("Audio playback isn't supported in this browser.");
  };

  const confirmSubmit = async () => {
    if (!summary) return;
    setSubmitting(true);
    try {
      await api.post(`/api/summary/${summary.id}/verify`, { action: "patient_confirm" });
      router.push(`/patient/complete${isDemo ? "?demo=1" : ""}`);
    } catch {
      toast.error("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KioskShell stage="summarize" listenText="Let's make sure we understood you correctly. Listen to the summary or confirm and submit.">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-bold">Let&apos;s make sure we understood you correctly.</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review the key points below before we share this with your doctor.</p>
        </div>

        {!summary ? (
          <LoadingState messages={["Preparing your summary...", "Almost ready..."]} />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap justify-center gap-2">
              <Button variant="outline" className="gap-1.5" onClick={listenToSummary}>
                <Volume2 className="size-4" /> Listen to Summary
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={() => router.push("/patient/interview")}>
                <Pencil className="size-4" /> Edit Answer
              </Button>
            </div>

            <div className="space-y-3">
              {summary.sections.slice(0, 4).map((s) => (
                <Card key={s.key}>
                  <CardContent className="pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{s.title}</p>
                    <p className="mt-1 whitespace-pre-line text-sm">{s.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Your full history, including past conditions, medications and uploaded documents, will be shared with your doctor.
            </p>

            <Button size="lg" className="mt-5 h-14 w-full gap-2 text-base" disabled={submitting} onClick={confirmSubmit}>
              <CheckCircle2 className="size-5" />
              {submitting ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </>
        )}
      </div>
    </KioskShell>
  );
}

export default function PatientReviewPage() {
  return (
    <Suspense>
      <ReviewContent />
    </Suspense>
  );
}

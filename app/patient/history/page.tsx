"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KioskShell } from "@/components/patient/KioskShell";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/common/LoadingState";
import { ClinicalSummaryView } from "@/components/clinical/ClinicalSummaryView";
import { useKioskStore } from "@/lib/store/kioskStore";
import { api } from "@/lib/api/client";
import type { ClinicalSummary } from "@/types";
import { ArrowRight } from "lucide-react";

function HistoryContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isDemo = params.get("demo") === "1";
  const { encounterId } = useKioskStore();
  const [summary, setSummary] = useState<ClinicalSummary | null>(null);

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

  return (
    <KioskShell stage="summarize" listenText="Here is the clinical history draft we prepared from your answers and documents.">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-bold">Your Clinical History</h1>
          <p className="mt-1 text-sm text-muted-foreground">Prepared for your doctor from your answers and uploaded records.</p>
        </div>
        {!summary ? (
          <LoadingState messages={["Preparing your doctor summary...", "Organising sections...", "Checking for priority symptoms..."]} />
        ) : (
          <>
            <ClinicalSummaryView summary={summary} />
            <div className="mt-5 flex justify-end">
              <Button className="gap-1.5" onClick={() => router.push(`/patient/review${isDemo ? "?demo=1" : ""}`)}>
                Continue <ArrowRight className="size-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </KioskShell>
  );
}

export default function PatientHistoryPage() {
  return (
    <Suspense>
      <HistoryContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KioskShell } from "@/components/patient/KioskShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/common/LoadingState";
import { Timeline } from "@/components/timeline/Timeline";
import { useKioskStore } from "@/lib/store/kioskStore";
import { api } from "@/lib/api/client";
import type { MedicalTimelineEvent } from "@/types";
import { ArrowRight } from "lucide-react";

function TimelineContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isDemo = params.get("demo") === "1";
  const { patientId } = useKioskStore();
  const [events, setEvents] = useState<MedicalTimelineEvent[] | null>(null);

  useEffect(() => {
    if (!patientId) {
      router.push("/patient/start");
      return;
    }
    const t = setTimeout(async () => {
      const res = await api.get<{ timeline: MedicalTimelineEvent[] }>(`/api/patients/${patientId}/timeline`);
      setEvents(res.timeline);
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  return (
    <KioskShell stage="scan" listenText="Here is your medical timeline, built from what you told us and the documents you uploaded.">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-bold">Your Medical Timeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organised chronologically from your answers and uploaded records.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            {events === null ? (
              <LoadingState messages={["Organising your medical timeline...", "Sorting events chronologically...", "Almost there..."]} />
            ) : (
              <Timeline events={events} />
            )}
          </CardContent>
        </Card>
        <div className="mt-5 flex justify-end">
          <Button
            className="gap-1.5"
            disabled={events === null}
            onClick={() => router.push(`/patient/history${isDemo ? "?demo=1" : ""}`)}
          >
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </KioskShell>
  );
}

export default function PatientTimelinePage() {
  return (
    <Suspense>
      <TimelineContent />
    </Suspense>
  );
}

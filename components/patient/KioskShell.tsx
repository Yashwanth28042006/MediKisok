"use client";

import { useKioskStore } from "@/lib/store/kioskStore";
import { KioskHeader } from "@/components/patient/KioskHeader";
import { StageStepper, type StageKey } from "@/components/common/StageStepper";
import { cn } from "@/lib/utils";

export function KioskShell({
  stage,
  listenText,
  children,
}: {
  stage?: StageKey;
  listenText?: string;
  children: React.ReactNode;
}) {
  const textSize = useKioskStore((s) => s.textSize);
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-muted/40 to-background",
        textSize === "large" && "text-[1.08rem]",
        textSize === "xlarge" && "text-[1.2rem]"
      )}
    >
      <KioskHeader listenText={listenText} />
      {stage && (
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <StageStepper current={stage} />
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useKioskStore } from "@/lib/store/kioskStore";
import { CheckCircle2, Stethoscope } from "lucide-react";

function CompleteContent() {
  const router = useRouter();
  const { patientName, endSession } = useKioskStore();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) {
      endSession();
      router.push("/patient/start");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, endSession, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-success/10 to-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="size-9" />
          </div>
          <h1 className="text-2xl font-bold">Thank You{patientName ? `, ${patientName.split(" ")[0]}` : ""}!</h1>
          <p className="text-muted-foreground">Your information has been securely submitted.</p>
          <div className="w-full rounded-xl border bg-muted/40 p-4 text-sm">
            <p className="flex items-center justify-center gap-1.5 font-medium text-primary">
              <Stethoscope className="size-4" /> Please wait for your token to be called.
            </p>
            <p className="mt-1 text-muted-foreground">Your doctor already has your organised clinical history.</p>
          </div>
          <p className="text-xs text-muted-foreground">
            For your privacy, this kiosk session will now close in {countdown}s.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense>
      <CompleteContent />
    </Suspense>
  );
}

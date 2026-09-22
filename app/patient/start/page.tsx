"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KioskHeader } from "@/components/patient/KioskHeader";
import { useKioskStore } from "@/lib/store/kioskStore";
import { LANGUAGE_LABELS } from "@/data/translations";
import type { Language } from "@/types";
import { Mic, FileUp, Clock3, ArrowRight, IdCard, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEMO_ABHA_SAMPLE } from "@/lib/constants";
import { QrCode } from "lucide-react";

function StartContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isDemo = params.get("demo") === "1";
  const { language, setLanguage } = useKioskStore();
  const [qrOpen, setQrOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setQrOpen(false);
      router.push(`/patient/register?abha=${DEMO_ABHA_SAMPLE}${isDemo ? "&demo=1" : ""}`);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <KioskHeader listenText="Welcome to MediKiosk. Your medical story, ready before you meet the doctor. Choose start health intake to begin, or select your language above." />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-10 text-center sm:py-16">
        {isDemo && (
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" /> Demo Mode Active
          </div>
        )}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">MediKiosk</h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">Your medical story, ready before you meet the doctor.</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
            <Button key={lang} variant={language === lang ? "default" : "outline"} size="lg" className="h-12 px-5" onClick={() => setLanguage(lang)}>
              {LANGUAGE_LABELS[lang]}
            </Button>
          ))}
        </div>

        <div className="mt-10 flex w-full flex-col gap-4 sm:max-w-sm">
          <Button size="lg" className="h-16 gap-2 text-lg shadow-lg shadow-primary/20" onClick={() => router.push(`/patient/register${isDemo ? "?demo=1" : ""}`)}>
            Start Health Intake <ArrowRight className="size-5" />
          </Button>
          <Button size="lg" variant="outline" className="h-14 gap-2 text-base" onClick={() => router.push(`/patient/register?returning=1${isDemo ? "&demo=1" : ""}`)}>
            <IdCard className="size-5" />
            I Already Have a Patient ID
          </Button>
          <Button size="lg" variant="ghost" className="h-12 gap-2 text-sm text-muted-foreground" onClick={() => setQrOpen(true)}>
            <QrCode className="size-4" />
            Scan ABHA QR
          </Button>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          <ValueCard icon={Mic} title="Speak Naturally" body="Tell your story in English, Tamil or Hindi." />
          <ValueCard icon={FileUp} title="Upload Records" body="Bring prescriptions and reports together." />
          <ValueCard icon={Clock3} title="Save Time" body="Your doctor gets an organised history first." />
        </div>
      </main>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan ABHA QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex size-48 items-center justify-center rounded-xl border-2 border-dashed bg-muted">
              {scanning ? (
                <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              ) : (
                <QrCode className="size-20 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {scanning ? "Scanning ABHA QR (sandbox simulation)..." : "Position the ABHA QR code within the frame."}
            </p>
            <Button onClick={handleScan} disabled={scanning} className="w-full">
              {scanning ? "Scanning..." : "Simulate Scan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ValueCard({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <Card className="border-none bg-card shadow-sm">
      <CardContent className="flex flex-col items-center gap-2 pt-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

export default function PatientStartPage() {
  return (
    <Suspense>
      <StartContent />
    </Suspense>
  );
}

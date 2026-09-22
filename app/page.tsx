import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { SignOutButton } from "@/components/common/SignOutButton";
import {
  Stethoscope, Mic, FileUp, Clock3, ShieldCheck, ArrowRight, Sparkles,
  ClipboardList, Users, Settings, UserCheck, MessageCircle, ScanLine, FileText,
  Languages, Building2, KeyRound, History,
} from "lucide-react";

const HOW_IT_WORKS = [
  { icon: UserCheck, title: "Identify", body: "Register with your details, or scan your ABHA QR for a faster lookup." },
  { icon: MessageCircle, title: "Converse", body: "Answer adaptive questions by voice, tap, or typing — in your language." },
  { icon: ScanLine, title: "Scan", body: "Upload prior prescriptions or reports; MediKiosk reads them for you." },
  { icon: FileText, title: "Summarize", body: "Review a structured draft history before you confirm and submit it." },
  { icon: Stethoscope, title: "Consult", body: "Your doctor opens an organised, source-tagged history — ready to go." },
];

const TRUST_POINTS = [
  { icon: Languages, label: "3 languages", detail: "English · Tamil · Hindi" },
  { icon: Building2, label: "7 departments", detail: "General Medicine to Ayurveda" },
  { icon: KeyRound, label: "Role-based access", detail: "Every area requires sign-in" },
  { icon: History, label: "Full audit trail", detail: "Every step is logged" },
];

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold text-primary text-lg">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="size-5" />
          </div>
          MediKiosk
        </div>
        {session && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">
              Signed in as <span className="font-medium text-foreground">{session.name}</span>
            </span>
            <SignOutButton />
          </div>
        )}
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-10 text-center sm:pt-16">
        <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          AI-Powered Clinical History Platform
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">MediKiosk</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Your medical story, ready before you meet the doctor.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-13 gap-2 px-8 text-base shadow-lg shadow-primary/20">
            <Link href="/patient/start">
              Patient Mode <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-13 gap-2 px-8 text-base">
            <Link href="/patient/start?demo=1">
              <Sparkles className="size-4" />
              Guided Demo Walkthrough
            </Link>
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link href="/login?role=triage" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 font-medium text-foreground hover:bg-muted">
            <ClipboardList className="size-4 text-teal" /> Triage Mode
          </Link>
          <Link href="/login?role=doctor" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 font-medium text-foreground hover:bg-muted">
            <Users className="size-4 text-primary" /> Doctor Mode
          </Link>
          <Link href="/login?role=admin" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 font-medium text-foreground hover:bg-muted">
            <Settings className="size-4 text-muted-foreground" /> Admin Mode
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto mt-14 max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-4">
          {TRUST_POINTS.map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-1.5 bg-card px-4 py-5 text-center">
              <t.icon className="size-5 text-primary" />
              <p className="text-sm font-semibold">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-16 max-w-5xl px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How MediKiosk works</h2>
          <p className="mt-2 text-muted-foreground">Five simple stages, from kiosk to consultation.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-5">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center gap-2.5 rounded-2xl border bg-card p-5 text-center shadow-sm">
              <span className="absolute -top-3 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="mt-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="size-5" />
              </div>
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="text-xs text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto mt-16 grid max-w-5xl gap-5 px-6 sm:grid-cols-3">
        <ValueCard icon={Mic} title="Speak Naturally" body="Tell your medical story in your preferred language — English, Tamil or Hindi." />
        <ValueCard icon={FileUp} title="Upload Records" body="Bring prescriptions and reports together, digitized in seconds." />
        <ValueCard icon={Clock3} title="Save Consultation Time" body="Your doctor receives an organised history before consultation begins." />
      </section>

      {/* Safety notice */}
      <section className="mx-auto mt-12 max-w-5xl px-6 pb-10">
        <Card className="border-dashed bg-muted/40">
          <CardContent className="flex flex-col items-start gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                MediKiosk is a <strong className="text-foreground">clinical decision support</strong> platform. It never
                diagnoses conditions — every generated history is an <strong className="text-foreground">AI-generated draft
                requiring clinician verification</strong>, and red-flag alerts are triage assistance only.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t bg-card/50">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Stethoscope className="size-4 text-primary" /> MediKiosk
          </div>
          <p>Your medical story, ready before you meet the doctor.</p>
        </div>
      </footer>
    </div>
  );
}

function ValueCard({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <Card className="border-none bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col items-start gap-3 pt-2">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

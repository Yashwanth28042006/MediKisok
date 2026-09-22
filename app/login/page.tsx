"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { Stethoscope, ClipboardList, Users, Settings, MonitorSmartphone, ShieldCheck, Mic, FileUp, Clock3 } from "lucide-react";
import type { Role, User } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLE_META: Record<Exclude<Role, "patient">, { label: string; description: string; icon: React.ElementType; email: string; redirect: string }> = {
  kiosk: { label: "Reception / Kiosk", description: "Unlock patient intake", icon: MonitorSmartphone, email: "reception@medikiosk.demo", redirect: "/" },
  triage: { label: "Triage Staff", description: "Monitor priority alerts", icon: ClipboardList, email: "triage@medikiosk.demo", redirect: "/triage" },
  doctor: { label: "Doctor", description: "Review patient histories", icon: Users, email: "doctor@medikiosk.demo", redirect: "/doctor" },
  admin: { label: "Admin", description: "Hospital-wide oversight", icon: Settings, email: "admin@medikiosk.demo", redirect: "/admin" },
};

const ROLE_ORDER: (keyof typeof ROLE_META)[] = ["kiosk", "triage", "doctor", "admin"];

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = (params.get("role") as keyof typeof ROLE_META) ?? "kiosk";
  const [role, setRole] = useState<keyof typeof ROLE_META>(ROLE_META[initialRole] ? initialRole : "kiosk");
  const [email, setEmail] = useState(ROLE_META[ROLE_META[initialRole] ? initialRole : "kiosk"].email);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const selectRole = (r: keyof typeof ROLE_META) => {
    setRole(r);
    setEmail(ROLE_META[r].email);
    setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await api.post<{ user: User }>("/api/auth/login", { email, password });
      toast.success(`Welcome, ${user.name}`);
      router.push(ROLE_META[role].redirect);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = () => setPassword("demo123");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary px-12 py-12 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
            <Stethoscope className="size-5" />
          </div>
          MediKiosk
        </div>

        <div className="relative max-w-md space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Your medical story, ready before you meet the doctor.
          </h1>
          <p className="text-primary-foreground/80">
            A secure clinical history platform for hospital OPDs — every area
            of MediKiosk requires sign-in, keeping patient information behind
            an authenticated door at all times.
          </p>
          <div className="space-y-3.5 pt-2">
            <Feature icon={Mic} text="Voice, touch or typed intake in English, Tamil or Hindi" />
            <Feature icon={FileUp} text="Prescriptions and reports digitised automatically" />
            <Feature icon={Clock3} text="Doctors start consultations with an organised history" />
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-primary-foreground/60">
          <ShieldCheck className="size-4" />
          Clinical decision support only — every summary requires clinician verification.
        </div>
      </div>

      {/* Login panel */}
      <div className="flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope className="size-5" />
            </div>
            <h1 className="text-xl font-bold">MediKiosk</h1>
            <p className="text-sm text-muted-foreground">Your medical story, ready before you meet the doctor.</p>
          </div>

          <h2 className="text-2xl font-bold">Sign in to continue</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">Choose how you&apos;d like to access MediKiosk.</p>

          <div className="mb-6 grid grid-cols-2 gap-2.5">
            {ROLE_ORDER.map((r) => {
              const meta = ROLE_META[r];
              const Icon = meta.icon;
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => selectRole(r)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-colors",
                    active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"
                  )}
                >
                  <div className={cn("flex size-8 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="demo123" />
            </div>
            <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={quickFill}>
              Use demo password (demo123)
            </Button>
            <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={loading}>
              {loading ? "Signing in..." : `Sign in as ${ROLE_META[role].label}`}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-primary-foreground/90">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Icon className="size-3.5" />
      </div>
      {text}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

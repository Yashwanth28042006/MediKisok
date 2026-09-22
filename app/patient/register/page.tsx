"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KioskShell } from "@/components/patient/KioskShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DEPARTMENTS, VISIT_TYPES } from "@/lib/constants";
import { useKioskStore } from "@/lib/store/kioskStore";
import { api } from "@/lib/api/client";
import type { Encounter, Patient } from "@/types";
import { Sparkles, Search } from "lucide-react";
import { toast } from "sonner";

function RegisterContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isReturningFlow = params.get("returning") === "1";
  const isDemo = params.get("demo") === "1";
  const prefilledAbha = params.get("abha") ?? "";
  const { language, startSession } = useKioskStore();

  const [form, setForm] = useState({
    patientId: "",
    abhaId: prefilledAbha,
    name: "",
    age: "",
    gender: "Male",
    mobile: "",
    department: "General Medicine",
    visitType: "New Visit",
    isReturning: isReturningFlow,
  });
  const [submitting, setSubmitting] = useState(false);
  const [lookupResult, setLookupResult] = useState<Patient | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const autoFillDemo = () => {
    update({
      name: "Suresh Patel",
      age: "45",
      gender: "Male",
      mobile: "9123456780",
      department: "General Medicine",
      visitType: "New Visit",
    });
    toast.success("Demo patient auto-filled");
  };

  const handleLookup = async () => {
    if (!form.patientId) return;
    setLookupLoading(true);
    try {
      const { patient } = await api.get<{ patient: Patient }>(`/api/patients/lookup?patientId=${encodeURIComponent(form.patientId)}`);
      setLookupResult(patient);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Patient not found");
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleReturningSubmit = async () => {
    if (!lookupResult) return;
    setSubmitting(true);
    try {
      const { patient, encounter } = await api.post<{ patient: Patient; encounter: Encounter }>("/api/encounters", {
        patientId: lookupResult.id,
        department: form.department,
        visitType: "Follow-up",
      });
      startSession({ patientId: patient.id, encounterId: encounter.id, patientName: patient.name, department: encounter.department });
      router.push(`/patient/consent${isDemo ? "?demo=1" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start visit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { patient, encounter } = await api.post<{ patient: Patient; encounter: Encounter }>("/api/patients", {
        ...form,
        preferredLanguage: language,
      });
      startSession({ patientId: patient.id, encounterId: encounter.id, patientName: patient.name, department: encounter.department });
      router.push(`/patient/consent${isDemo ? "?demo=1" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KioskShell stage="identify" listenText="Please fill in your details to register, or find your existing patient record.">
      <Card className="mx-auto max-w-xl shadow-md">
        <CardHeader>
          <CardTitle>{isReturningFlow ? "Find Your Patient Record" : "Patient Registration"}</CardTitle>
          <CardDescription>
            {isReturningFlow ? "Enter your Patient ID to continue your visit." : "Tell us a little about yourself to begin."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isDemo && !isReturningFlow && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={autoFillDemo}>
              <Sparkles className="size-3.5" /> Auto-fill Demo Patient
            </Button>
          )}

          {isReturningFlow ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="e.g. MK-2026-0001" value={form.patientId} onChange={(e) => update({ patientId: e.target.value })} />
                <Button type="button" onClick={handleLookup} disabled={lookupLoading} className="gap-1.5">
                  <Search className="size-4" /> {lookupLoading ? "..." : "Find"}
                </Button>
              </div>
              {lookupResult && (
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <p className="font-semibold">{lookupResult.name}</p>
                  <p className="text-muted-foreground">{lookupResult.age} yrs, {lookupResult.gender} · {lookupResult.patientId}</p>
                  <div className="mt-3 space-y-1.5">
                    <Label>Department for this visit</Label>
                    <Select value={form.department} onValueChange={(v) => update({ department: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="mt-4 w-full" onClick={handleReturningSubmit} disabled={submitting}>
                    {submitting ? "Starting visit..." : "Continue"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleNewSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required value={form.name} onChange={(e) => update({ name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" min={0} max={120} required value={form.age} onChange={(e) => update({ age: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <RadioGroup value={form.gender} onValueChange={(v) => update({ gender: v })} className="flex gap-3 pt-1.5">
                    {["Male", "Female", "Other"].map((g) => (
                      <div key={g} className="flex items-center gap-1.5">
                        <RadioGroupItem value={g} id={`g-${g}`} />
                        <Label htmlFor={`g-${g}`} className="font-normal">{g}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="mobile">Mobile number</Label>
                  <Input id="mobile" required value={form.mobile} onChange={(e) => update({ mobile: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="patientId">Patient ID (optional)</Label>
                  <Input id="patientId" placeholder="Auto-generated if empty" value={form.patientId} onChange={(e) => update({ patientId: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="abhaId">ABHA ID (optional)</Label>
                  <Input id="abhaId" placeholder="91-XXXX-XXXX-XXXX" value={form.abhaId} onChange={(e) => update({ abhaId: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={(v) => update({ department: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Visit type</Label>
                  <Select value={form.visitType} onValueChange={(v) => update({ visitType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VISIT_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={submitting}>
                {submitting ? "Registering..." : "Continue"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </KioskShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}

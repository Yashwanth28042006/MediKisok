"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Badge } from "@/components/ui/badge";
import type { Encounter, Patient } from "@/types";
import { Users, CheckCircle2, AlertTriangle, Clock3, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  CONSENT_PENDING: "Consent pending",
  INTERVIEW_IN_PROGRESS: "Interview in progress",
  DOCUMENTS_PENDING: "Documents pending",
  SUMMARY_READY: "Summary ready",
  PATIENT_CONFIRMED: "Completed",
  DOCTOR_REVIEWING: "Doctor reviewing",
  DOCTOR_CONFIRMED: "Confirmed",
};

function waitingMinutes(iso: string) {
  return Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export function DoctorDashboardClient({ rows, initialFilter }: { rows: { encounter: Encounter; patient: Patient }[]; initialFilter: "all" | "waiting" | "priority" }) {
  const router = useRouter();
  const [filter, setFilter] = useState(initialFilter);

  const stats = useMemo(() => {
    const waiting = rows.filter((r) => r.encounter.intakeStatus !== "DOCTOR_CONFIRMED").length;
    const completed = rows.filter((r) => ["SUMMARY_READY", "PATIENT_CONFIRMED", "DOCTOR_CONFIRMED"].includes(r.encounter.intakeStatus)).length;
    const priority = rows.filter((r) => r.encounter.priority === "HIGH").length;
    return { waiting, completed, priority, avg: "6m 42s" };
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (filter === "waiting") return r.encounter.intakeStatus !== "DOCTOR_CONFIRMED";
    if (filter === "priority") return r.encounter.priority === "HIGH";
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        <p className="text-sm text-muted-foreground">Patients ready for consultation, organised and pre-summarised.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={Users} label="Patients Waiting" value={stats.waiting} />
        <StatCard icon={CheckCircle2} label="History Completed" value={stats.completed} tone="success" />
        <StatCard icon={AlertTriangle} label="Priority Alerts" value={stats.priority} tone="urgent" />
        <StatCard icon={Clock3} label="Avg. Intake Time" value={stats.avg} />
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-4 flex flex-wrap gap-1.5">
            {(["all", "waiting", "priority"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
                  filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {f === "all" ? "All Patients" : f === "waiting" ? "Waiting Patients" : "Priority Cases"}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Age/Sex</TableHead>
                  <TableHead>Chief Complaint</TableHead>
                  <TableHead>Intake Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Waiting</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ encounter, patient }) => (
                  <TableRow key={encounter.id} className={cn(encounter.priority === "HIGH" && "bg-urgent/5")}>
                    <TableCell className="font-mono font-medium">{encounter.token}</TableCell>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.age}/{patient.gender[0]}</TableCell>
                    <TableCell>{encounter.chiefComplaint ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="font-normal">{STATUS_LABEL[encounter.intakeStatus]}</Badge></TableCell>
                    <TableCell><PriorityBadge priority={encounter.priority} /></TableCell>
                    <TableCell className="text-muted-foreground">{waitingMinutes(encounter.waitingSince)} min</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => router.push(`/doctor/patient/${encounter.id}`)}>
                        <Eye className="size-3.5" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No patients in this view.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string | number; tone?: "success" | "urgent" }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5">
        <div className={cn("flex size-10 items-center justify-center rounded-xl", tone === "urgent" ? "bg-urgent/10 text-urgent" : tone === "success" ? "bg-success/10 text-success" : "bg-primary/10 text-primary")}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xl font-bold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

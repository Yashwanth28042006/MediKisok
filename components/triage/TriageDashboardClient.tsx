"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import type { Encounter, Patient, TriageAlert } from "@/types";
import { api } from "@/lib/api/client";
import { AlertTriangle, CheckCircle2, Siren, Eye, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AlertRow { alert: TriageAlert; patient?: Patient; encounter?: Encounter }

export function TriageDashboardClient({ alertRows, waitingRows, staffName }: {
  alertRows: AlertRow[];
  waitingRows: { encounter: Encounter; patient: Patient }[];
  staffName: string;
}) {
  const router = useRouter();
  const [alerts, setAlerts] = useState(alertRows);

  const acknowledge = async (id: string) => {
    await api.post(`/api/triage/alerts/${id}/acknowledge`, { by: staffName });
    setAlerts((a) => a.map((row) => (row.alert.id === id ? { ...row, alert: { ...row.alert, acknowledged: true } } : row)));
    toast.success("Alert acknowledged");
  };

  const redirect = (name: string) => {
    toast.success(`${name} redirected to emergency department (demo)`);
  };

  const unacknowledged = alerts.filter((a) => !a.alert.acknowledged);

  const groups = useMemo(() => {
    const byEncounter = new Map<string, { patient?: Patient; encounter?: Encounter; rows: AlertRow[] }>();
    for (const row of alerts) {
      const key = row.encounter?.id ?? row.alert.encounterId;
      if (!byEncounter.has(key)) byEncounter.set(key, { patient: row.patient, encounter: row.encounter, rows: [] });
      byEncounter.get(key)!.rows.push(row);
    }
    return Array.from(byEncounter.values()).sort(
      (a, b) => new Date(b.rows[0].alert.createdAt).getTime() - new Date(a.rows[0].alert.createdAt).getTime()
    );
  }, [alerts]);

  const acknowledgeAll = async (rows: AlertRow[]) => {
    await Promise.all(rows.filter((r) => !r.alert.acknowledged).map((r) => acknowledge(r.alert.id)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Triage Dashboard</h1>
        <p className="text-sm text-muted-foreground">Monitor priority alerts and manage the OPD waiting queue.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Patients Waiting" value={waitingRows.length} />
        <StatCard icon={AlertTriangle} label="Active Priority Alerts" value={unacknowledged.length} tone="urgent" />
        <StatCard icon={CheckCircle2} label="Acknowledged Today" value={alerts.length - unacknowledged.length} tone="success" />
      </div>

      <Card className="border-urgent/30">
        <CardContent className="pt-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-urgent">
            <Siren className="size-4" /> Priority Alerts
          </h2>
          <div className="space-y-2.5">
            {groups.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No priority alerts right now.</p>}
            {groups.map(({ patient, encounter, rows }) => {
              const allAcknowledged = rows.every((r) => r.alert.acknowledged);
              return (
                <div key={encounter?.id ?? rows[0].alert.id} className={cn("flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3.5", allAcknowledged ? "bg-muted/30" : "border-urgent/40 bg-urgent/5")}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{patient?.name ?? "Unknown patient"}</p>
                      {encounter && <Badge variant="outline" className="font-mono text-xs">{encounter.token}</Badge>}
                      {allAcknowledged && <Badge variant="outline" className="border-success/40 bg-success/10 text-success text-xs">Acknowledged</Badge>}
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {rows.map((r) => (
                        <li key={r.alert.id} className="text-sm text-muted-foreground">
                          {r.alert.message} <span className="text-xs opacity-70">({r.alert.ruleId})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    {!allAcknowledged && (
                      <Button size="sm" variant="outline" onClick={() => acknowledgeAll(rows)}>Acknowledge</Button>
                    )}
                    <Button size="sm" variant="outline" className="text-urgent" onClick={() => redirect(patient?.name ?? "Patient")}>Redirect to ED</Button>
                    {encounter && (
                      <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => router.push(`/doctor/patient/${encounter.id}`)}>
                        <Eye className="size-3.5" /> View
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h2 className="mb-3 font-semibold">Waiting Patients</h2>
          <div className="space-y-2">
            {waitingRows.map(({ encounter, patient }) => (
              <div key={encounter.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">{encounter.token}</Badge>
                  <span className="font-medium">{patient.name}</span>
                  <span className="text-muted-foreground">{patient.age}/{patient.gender[0]} · {encounter.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={encounter.priority} />
                  <Badge variant="outline" className="font-normal">{encounter.intakeStatus.replace(/_/g, " ").toLowerCase()}</Badge>
                </div>
              </div>
            ))}
            {waitingRows.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No patients currently waiting.</p>}
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

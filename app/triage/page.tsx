import { requireRole } from "@/lib/auth/requireRole";
import { listEncounters, listPatients, listTriageAlerts } from "@/lib/db/repository";
import { StaffShell } from "@/components/common/StaffShell";
import { TriageDashboardClient } from "@/components/triage/TriageDashboardClient";

export default async function TriagePage() {
  const session = await requireRole(["triage"]);

  const patients = new Map(listPatients().map((p) => [p.id, p]));
  const encounters = listEncounters();
  const alerts = listTriageAlerts()
    .map((alert) => ({ alert, patient: patients.get(alert.patientId), encounter: encounters.find((e) => e.id === alert.encounterId) }))
    .sort((a, b) => new Date(b.alert.createdAt).getTime() - new Date(a.alert.createdAt).getTime());

  const waitingRows = encounters
    .filter((e) => e.intakeStatus !== "DOCTOR_CONFIRMED")
    .map((encounter) => ({ encounter, patient: patients.get(encounter.patientId)! }))
    .filter((r) => r.patient)
    .sort((a, b) => new Date(a.encounter.waitingSince).getTime() - new Date(b.encounter.waitingSince).getTime());

  return (
    <StaffShell role="triage" userName={session.name}>
      <TriageDashboardClient alertRows={alerts} waitingRows={waitingRows} staffName={session.name} />
    </StaffShell>
  );
}

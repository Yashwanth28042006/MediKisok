import { requireRole } from "@/lib/auth/requireRole";
import { listEncounters, listPatients, listIntegrationEvents } from "@/lib/db/repository";
import { StaffShell } from "@/components/common/StaffShell";
import { IntegrationsClient } from "@/components/admin/IntegrationsClient";

export default async function IntegrationsPage() {
  const session = await requireRole(["admin", "doctor", "triage"]);

  const patients = new Map(listPatients().map((p) => [p.id, p]));
  const encounters = listEncounters();
  const encounterOptions = encounters
    .map((e) => ({ id: e.id, patientId: e.patientId, label: `${patients.get(e.patientId)?.name ?? "Unknown"} — ${e.token} (${e.department})` }))
    .filter((e) => patients.has(e.patientId));

  const events = listIntegrationEvents().slice().reverse();

  return (
    <StaffShell role={session.role as "admin" | "doctor" | "triage"} userName={session.name}>
      <IntegrationsClient encounterOptions={encounterOptions} initialEvents={events} />
    </StaffShell>
  );
}

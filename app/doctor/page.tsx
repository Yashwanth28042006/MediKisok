import { requireRole } from "@/lib/auth/requireRole";
import { listEncounters, listPatients } from "@/lib/db/repository";
import { StaffShell } from "@/components/common/StaffShell";
import { DoctorDashboardClient } from "@/components/doctor/DoctorDashboardClient";

export default async function DoctorDashboardPage({ searchParams }: { searchParams: Promise<{ priority?: string }> }) {
  const session = await requireRole(["doctor"]);
  const { priority } = await searchParams;

  const encounters = listEncounters();
  const patients = new Map(listPatients().map((p) => [p.id, p]));
  const rows = encounters
    .map((encounter) => ({ encounter, patient: patients.get(encounter.patientId)! }))
    .filter((r) => r.patient)
    .sort((a, b) => new Date(b.encounter.createdAt).getTime() - new Date(a.encounter.createdAt).getTime());

  const priorityCount = rows.filter((r) => r.encounter.priority === "HIGH").length;

  return (
    <StaffShell role="doctor" priorityCount={priorityCount || undefined} userName={session.name}>
      <DoctorDashboardClient rows={rows} initialFilter={priority === "HIGH" ? "priority" : "all"} />
    </StaffShell>
  );
}

import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import {
  getEncounter, getPatient, getResponsesByEncounter, getDocumentsByEncounter,
  getTimelineByPatient, getSummaryByEncounter, getConsentByEncounter,
} from "@/lib/db/repository";
import { getDb } from "@/lib/db/store";
import { getAuditLogs } from "@/lib/audit";
import { StaffShell } from "@/components/common/StaffShell";
import { PatientViewClient } from "@/components/doctor/PatientViewClient";

export default async function DoctorPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["doctor"]);
  const { id } = await params;

  const encounter = getEncounter(id);
  if (!encounter) notFound();
  const patient = getPatient(encounter.patientId);
  if (!patient) notFound();

  const responses = getResponsesByEncounter(id);
  const documents = getDocumentsByEncounter(id);
  const timeline = getTimelineByPatient(patient.id);
  const summary = getSummaryByEncounter(id) ?? null;
  const consent = getConsentByEncounter(id) ?? null;
  const alerts = getDb().triageAlerts.filter((a) => a.encounterId === id);
  const auditLogs = getAuditLogs({ encounterId: id });

  return (
    <StaffShell role="doctor" userName={session.name}>
      <PatientViewClient
        encounter={encounter}
        patient={patient}
        responses={responses}
        documents={documents}
        timeline={timeline}
        summary={summary}
        consent={consent}
        alerts={alerts}
        auditLogs={auditLogs}
        doctorName={session.name}
      />
    </StaffShell>
  );
}

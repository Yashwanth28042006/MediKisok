import { NextResponse } from "next/server";
import { listTriageAlerts, listPatients, listEncounters } from "@/lib/db/repository";

export async function GET() {
  const alerts = listTriageAlerts();
  const patients = new Map(listPatients().map((p) => [p.id, p]));
  const encounters = new Map(listEncounters().map((e) => [e.id, e]));

  const enriched = alerts
    .map((a) => ({ alert: a, patient: patients.get(a.patientId), encounter: encounters.get(a.encounterId) }))
    .sort((a, b) => new Date(b.alert.createdAt).getTime() - new Date(a.alert.createdAt).getTime());

  return NextResponse.json({ alerts: enriched });
}

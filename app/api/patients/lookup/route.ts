import { NextRequest, NextResponse } from "next/server";
import { findPatientByPatientId } from "@/lib/db/repository";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  if (!patientId) return NextResponse.json({ error: "patientId required" }, { status: 400 });
  const patient = findPatientByPatientId(patientId);
  if (!patient) return NextResponse.json({ error: "No patient found with that Patient ID" }, { status: 404 });
  return NextResponse.json({ patient });
}

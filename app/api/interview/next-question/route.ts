import { NextRequest, NextResponse } from "next/server";
import { getEncounter, getResponsesByEncounter } from "@/lib/db/repository";
import { getNextQuestion } from "@/lib/clinical/questionEngine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const encounterId = searchParams.get("encounterId");
  if (!encounterId) return NextResponse.json({ error: "encounterId required" }, { status: 400 });

  const encounter = getEncounter(encounterId);
  if (!encounter) return NextResponse.json({ error: "Encounter not found" }, { status: 404 });

  const responses = getResponsesByEncounter(encounterId);
  const progress = getNextQuestion(responses, encounter.department);
  return NextResponse.json(progress);
}

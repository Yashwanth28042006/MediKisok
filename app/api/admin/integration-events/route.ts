import { NextResponse } from "next/server";
import { listIntegrationEvents } from "@/lib/db/repository";

export async function GET() {
  const events = listIntegrationEvents().slice().reverse();
  return NextResponse.json({ events });
}

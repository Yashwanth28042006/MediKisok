import { NextResponse } from "next/server";
import { computeAdminStats } from "@/lib/admin/getStats";

export async function GET() {
  return NextResponse.json(computeAdminStats());
}

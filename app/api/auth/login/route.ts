import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findUserByEmail } from "@/lib/db/repository";
import { encodeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    logAudit({ actor: email ?? "unknown", action: "Login failed", resource: "Auth", status: "failure" });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const session = { userId: user.id, role: user.role, name: user.name, email: user.email };
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(session), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  logAudit({ actor: user.name, action: "Login succeeded", resource: "Auth", status: "success" });
  return NextResponse.json({ user: session });
}

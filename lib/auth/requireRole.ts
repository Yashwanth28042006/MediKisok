import { redirect } from "next/navigation";
import { getSession, type Session } from "@/lib/auth/session";
import type { Role } from "@/types";

export async function requireRole(roles: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) {
    redirect(`/login?role=${roles[0]}`);
  }
  return session;
}

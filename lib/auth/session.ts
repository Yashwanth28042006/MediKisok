import { cookies } from "next/headers";
import type { Role } from "@/types";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export interface Session {
  userId: string;
  role: Role;
  name: string;
  email: string;
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session), "utf-8").toString("base64");
}

export { SESSION_COOKIE };

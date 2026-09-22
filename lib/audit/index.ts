import { getDb, saveDb } from "@/lib/db/store";
import type { AuditLogEntry } from "@/types";
import { randomUUID } from "node:crypto";

export function logAudit(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
  const db = getDb();
  const record: AuditLogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  db.auditLogs.unshift(record);
  saveDb();
  return record;
}

export function getAuditLogs(filter?: { encounterId?: string; patientId?: string }) {
  const db = getDb();
  if (!filter) return db.auditLogs;
  return db.auditLogs.filter(
    (a) =>
      (!filter.encounterId || a.encounterId === filter.encounterId) &&
      (!filter.patientId || a.patientId === filter.patientId)
  );
}

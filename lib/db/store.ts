import fs from "node:fs";
import path from "node:path";
import type {
  User,
  Patient,
  Encounter,
  ConsentRecord,
  ClinicalResponse,
  MedicalDocument,
  MedicalTimelineEvent,
  ClinicalSummary,
  TriageAlert,
  AuditLogEntry,
  IntegrationEvent,
} from "@/types";

// File-backed JSON "database" for the prototype. Swappable behind this same
// module surface for a future Prisma/SQLite (or real DB) implementation —
// nothing outside lib/db/ should touch the file system directly.

interface Database {
  users: User[];
  patients: Patient[];
  encounters: Encounter[];
  consents: ConsentRecord[];
  clinicalResponses: ClinicalResponse[];
  documents: MedicalDocument[];
  timelineEvents: MedicalTimelineEvent[];
  summaries: ClinicalSummary[];
  triageAlerts: TriageAlert[];
  auditLogs: AuditLogEntry[];
  integrationEvents: IntegrationEvent[];
}

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "db.json");

function emptyDb(): Database {
  return {
    users: [],
    patients: [],
    encounters: [],
    consents: [],
    clinicalResponses: [],
    documents: [],
    timelineEvents: [],
    summaries: [],
    triageAlerts: [],
    auditLogs: [],
    integrationEvents: [],
  };
}

declare global {
  var __medikioskDb: Database | undefined;
}

function loadFromDisk(): Database {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const fresh = emptyDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2));
    return fresh;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return { ...emptyDb(), ...JSON.parse(raw) };
  } catch {
    return emptyDb();
  }
}

function persist(db: Database) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function getDb(): Database {
  if (!global.__medikioskDb) {
    global.__medikioskDb = loadFromDisk();
    if (global.__medikioskDb.patients.length === 0) {
      // Safety net if instrumentation.ts didn't fire for this process.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require("@/lib/db/seed") as typeof import("@/lib/db/seed")).ensureSeeded();
    }
  }
  return global.__medikioskDb;
}

export function saveDb() {
  if (global.__medikioskDb) persist(global.__medikioskDb);
}

export function resetDb(seed: Database) {
  global.__medikioskDb = seed;
  persist(seed);
}

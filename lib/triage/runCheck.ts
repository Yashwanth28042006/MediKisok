import { getResponsesByEncounter, addTriageAlert, updateEncounter, getEncounter } from "@/lib/db/repository";
import { getDb } from "@/lib/db/store";
import { evaluateTriageRules } from "@/lib/triage/engine";
import { logAudit } from "@/lib/audit";
import type { TriageAlert } from "@/types";

// Runs after each interview answer. Creates new TriageAlert rows for any
// newly-triggered rule and escalates the encounter priority. Idempotent per
// rule+encounter so re-answering doesn't duplicate alerts.
export function runTriageCheck(encounterId: string): TriageAlert[] {
  const encounter = getEncounter(encounterId);
  if (!encounter) return [];
  const responses = getResponsesByEncounter(encounterId);
  const triggered = evaluateTriageRules(responses);
  const existingRuleIds = new Set(getDb().triageAlerts.filter((a) => a.encounterId === encounterId).map((a) => a.ruleId));

  const newAlerts: TriageAlert[] = [];
  for (const rule of triggered) {
    if (existingRuleIds.has(rule.id)) continue;
    const alert = addTriageAlert({
      encounterId,
      patientId: encounter.patientId,
      ruleId: rule.id,
      severity: rule.severity,
      message: rule.message,
    });
    newAlerts.push(alert);
    logAudit({
      actor: "Triage Engine", action: "Priority alert generated", resource: `TriageAlert/${alert.id}`,
      status: "success", encounterId, patientId: encounter.patientId,
    });
  }

  if (newAlerts.some((a) => a.severity === "HIGH") && encounter.priority !== "HIGH") {
    updateEncounter(encounterId, { priority: "HIGH" });
  }

  return newAlerts;
}

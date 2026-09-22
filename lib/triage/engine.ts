import type { ClinicalResponse, RedFlagRule, RedFlagCondition } from "@/types";
import { RED_FLAG_RULES } from "@/data/triageRules/rules";

// Rule-based TRIAGE ASSISTANCE engine. Never produces a diagnosis — only
// flags patterns for staff review. See RED_FLAG_RULES for the rule source.

interface Facts {
  chiefComplaint?: string;
  associatedSymptoms: string[];
  severity?: number;
  freeText: string;
}

function buildFacts(responses: ClinicalResponse[]): Facts {
  const cc = responses.find((r) => r.questionId === "CC001");
  const chiefComplaint = cc ? String(Array.isArray(cc.answer) ? cc.answer[0] : cc.answer).toLowerCase() : undefined;

  const associatedSymptoms: string[] = [];
  let severity: number | undefined;
  const freeTextParts: string[] = [];

  for (const r of responses) {
    const answerArr = Array.isArray(r.answer) ? r.answer : [r.answer];
    if (r.category === "HPI" && r.question.toLowerCase().includes("experiencing")) {
      associatedSymptoms.push(...answerArr.map((a) => a.toLowerCase()));
    }
    if (r.category === "HPI" && r.question.toLowerCase().includes("severe")) {
      const n = Number(answerArr[0]);
      if (!Number.isNaN(n)) severity = n;
    }
    freeTextParts.push(...answerArr.map((a) => String(a).toLowerCase()));
  }

  return { chiefComplaint, associatedSymptoms, severity, freeText: freeTextParts.join(" | ") };
}

function evalCondition(cond: RedFlagCondition, facts: Facts): boolean {
  let fieldValue: string | number | string[] | undefined;
  switch (cond.field) {
    case "chiefComplaint":
      fieldValue = facts.chiefComplaint;
      break;
    case "associatedSymptoms":
      fieldValue = facts.associatedSymptoms;
      break;
    case "severity":
      fieldValue = facts.severity;
      break;
    case "freeText":
      fieldValue = facts.freeText;
      break;
    default:
      return false;
  }

  if (fieldValue === undefined) return false;

  switch (cond.operator) {
    case "equals":
      return String(fieldValue).toLowerCase() === String(cond.value).toLowerCase();
    case "contains":
      if (Array.isArray(fieldValue)) return fieldValue.some((v) => v.includes(String(cond.value).toLowerCase()));
      return String(fieldValue).toLowerCase().includes(String(cond.value).toLowerCase());
    case "gte":
      return Number(fieldValue) >= Number(cond.value);
    case "lte":
      return Number(fieldValue) <= Number(cond.value);
    default:
      return false;
  }
}

export function evaluateTriageRules(responses: ClinicalResponse[]): RedFlagRule[] {
  const facts = buildFacts(responses);
  return RED_FLAG_RULES.filter((rule) => rule.conditions.every((c) => evalCondition(c, facts)));
}

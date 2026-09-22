import type { RedFlagRule } from "@/types";

// Configurable red-flag rules. TRIAGE ASSISTANCE ONLY — never a diagnosis.
// Add new rules here without touching engine code (lib/triage/engine.ts).
export const RED_FLAG_RULES: RedFlagRule[] = [
  {
    id: "RF_CHEST_001",
    conditions: [
      { field: "chiefComplaint", operator: "equals", value: "chest pain" },
      { field: "associatedSymptoms", operator: "contains", value: "breathlessness" },
    ],
    severity: "HIGH",
    message: "Possible priority symptom. Immediate clinical review recommended.",
  },
  {
    id: "RF_CHEST_002",
    conditions: [
      { field: "chiefComplaint", operator: "equals", value: "chest pain" },
      { field: "associatedSymptoms", operator: "contains", value: "sweating" },
    ],
    severity: "HIGH",
    message: "Possible priority symptom. Immediate clinical review recommended.",
  },
  {
    id: "RF_CHEST_003",
    conditions: [
      { field: "chiefComplaint", operator: "equals", value: "chest pain" },
      { field: "severity", operator: "gte", value: 8 },
    ],
    severity: "HIGH",
    message: "Severe chest pain reported. Recommended for clinical review.",
  },
  {
    id: "RF_NEURO_001",
    conditions: [
      { field: "freeText", operator: "contains", value: "facial weakness" },
    ],
    severity: "HIGH",
    message: "Possible priority symptom. Immediate clinical review recommended.",
  },
  {
    id: "RF_NEURO_002",
    conditions: [
      { field: "freeText", operator: "contains", value: "speech difficulty" },
    ],
    severity: "HIGH",
    message: "Possible priority symptom. Immediate clinical review recommended.",
  },
  {
    id: "RF_BREATH_001",
    conditions: [
      { field: "chiefComplaint", operator: "equals", value: "breathlessness" },
      { field: "severity", operator: "gte", value: 7 },
    ],
    severity: "HIGH",
    message: "Severe breathlessness reported. Recommended for urgent clinical assessment.",
  },
  {
    id: "RF_CONSCIOUSNESS_001",
    conditions: [
      { field: "freeText", operator: "contains", value: "loss of consciousness" },
    ],
    severity: "HIGH",
    message: "Possible priority symptom. Immediate clinical review recommended.",
  },
];

import type { ClinicalQuestion } from "@/types";

// Sections asked after the chief-complaint pathway completes, regardless of
// complaint. Kept patient-friendly per the spec's simple-wording requirement.

export const PAST_MEDICAL_HISTORY: ClinicalQuestion[] = [
  {
    id: "PMH001",
    category: "PMH",
    question: "Have you been diagnosed with any of these conditions before?",
    type: "multiple_choice",
    options: ["Diabetes", "Hypertension", "Heart disease", "Asthma", "Thyroid disease", "Kidney disease", "Liver disease", "Tuberculosis", "Stroke", "Other", "None"],
    required: true,
    next: "PSH001",
  },
];

export const PAST_SURGICAL_HISTORY: ClinicalQuestion[] = [
  {
    id: "PSH001",
    category: "PSH",
    question: "Have you had any surgeries in the past? If yes, please describe.",
    type: "voice_text",
    helpText: "You can say 'None' if you haven't had any surgery.",
    required: true,
    next: "MED001",
  },
];

export const MEDICATION_HISTORY: ClinicalQuestion[] = [
  {
    id: "MED001",
    category: "MEDICATION",
    question: "Are you currently taking any medicines regularly?",
    type: "voice_text",
    helpText: "Tell us the medicine name if you remember, e.g. 'Amlodipine for blood pressure'.",
    required: true,
    next: "ALG001",
  },
];

export const ALLERGY_HISTORY: ClinicalQuestion[] = [
  {
    id: "ALG001",
    category: "ALLERGY",
    question: "Do you have any known allergies to medicines or food?",
    type: "voice_text",
    helpText: "This is important safety information for your doctor.",
    required: true,
    next: "FHX001",
  },
];

export const FAMILY_HISTORY: ClinicalQuestion[] = [
  {
    id: "FHX001",
    category: "FHX",
    question: "Does anyone in your immediate family have diabetes, heart disease, or similar conditions?",
    type: "voice_text",
    required: false,
    next: "PERS001",
  },
];

export const PERSONAL_HISTORY: ClinicalQuestion[] = [
  { id: "PERS001", category: "PERSONAL", question: "Do you smoke?", type: "yes_no", required: true, next: "PERS002" },
  { id: "PERS002", category: "PERSONAL", question: "Do you drink alcohol?", type: "yes_no", required: true, next: "PERS003" },
  { id: "PERS003", category: "PERSONAL", question: "How would you describe your diet?", type: "single_choice", options: ["Vegetarian", "Non-vegetarian", "Eggetarian", "Vegan"], required: false, next: "PERS004" },
  { id: "PERS004", category: "PERSONAL", question: "How is your sleep generally?", type: "single_choice", options: ["Good", "Disturbed", "Poor"], required: false, next: "PERS005" },
  { id: "PERS005", category: "PERSONAL", question: "What is your occupation?", type: "voice_text", required: false, next: "ROS001" },
];

export const REVIEW_OF_SYSTEMS: ClinicalQuestion[] = [
  {
    id: "ROS001",
    category: "ROS",
    question: "Do you have any of the following right now?",
    type: "multiple_choice",
    options: ["Weight loss", "Loss of appetite", "Night sweats", "Difficulty sleeping", "Swelling in legs", "Vision changes", "None"],
    required: true,
    next: null,
  },
];

export const COMMON_SECTIONS: ClinicalQuestion[] = [
  ...PAST_MEDICAL_HISTORY,
  ...PAST_SURGICAL_HISTORY,
  ...MEDICATION_HISTORY,
  ...ALLERGY_HISTORY,
  ...FAMILY_HISTORY,
  ...PERSONAL_HISTORY,
  ...REVIEW_OF_SYSTEMS,
];

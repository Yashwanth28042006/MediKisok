import type { ClinicalQuestion } from "@/types";

// Chief complaints offered on the interview screen.
export const CHIEF_COMPLAINTS = [
  "Chest pain",
  "Fever",
  "Headache",
  "Abdominal pain",
  "Cough",
  "Breathlessness",
  "Vomiting",
  "Back pain",
  "Joint pain",
  "Dizziness",
  "Weakness",
  "Other",
] as const;

export const complaintKey = (label: string) => label.toLowerCase().replace(/\s+/g, "_");

// Detailed, hand-tuned pathway for chest pain (flagship demo pathway).
const chestPain: ClinicalQuestion[] = [
  { id: "CP001", category: "HPI", complaint: "chest_pain", question: "When did the pain begin?", type: "single_choice", options: ["Just now", "Today", "Yesterday", "2-3 days ago", "More than a week ago"], required: true, next: "CP002" },
  { id: "CP002", category: "HPI", complaint: "chest_pain", question: "Where exactly is the pain?", type: "body_location", options: ["Centre of chest", "Left side of chest", "Right side of chest", "Upper abdomen", "Back"], required: true, next: "CP003" },
  { id: "CP003", category: "HPI", complaint: "chest_pain", question: "How would you describe the pain?", type: "single_choice", options: ["Sharp", "Burning", "Pressure", "Tightness", "Aching", "Other"], required: true, next: "CP004" },
  { id: "CP004", category: "HPI", complaint: "chest_pain", question: "On a scale of 1-10, how severe is the pain?", type: "severity_scale", required: true, next: "CP005" },
  { id: "CP005", category: "HPI", complaint: "chest_pain", question: "Does the pain move anywhere else?", type: "single_choice", options: ["No", "Left arm", "Jaw", "Back", "Both arms", "Other"], required: false, next: "CP006" },
  { id: "CP006", category: "HPI", complaint: "chest_pain", question: "Does anything make the pain worse?", type: "single_choice", options: ["Exertion", "Deep breathing", "Lying down", "Eating", "Nothing specific"], required: false, next: "CP007" },
  { id: "CP007", category: "HPI", complaint: "chest_pain", question: "Does anything make the pain better?", type: "single_choice", options: ["Rest", "Sitting up", "Medication", "Nothing"], required: false, next: "CP008" },
  { id: "CP008", category: "HPI", complaint: "chest_pain", question: "Are you experiencing any of these?", type: "multiple_choice", options: ["Breathlessness", "Sweating", "Nausea", "Dizziness", "Palpitations", "None"], required: true, next: null },
];

const fever: ClinicalQuestion[] = [
  { id: "FV001", category: "HPI", complaint: "fever", question: "How long have you had fever?", type: "single_choice", options: ["Since today", "1-2 days", "3-5 days", "More than a week"], required: true, next: "FV002" },
  { id: "FV002", category: "HPI", complaint: "fever", question: "Have you measured your temperature? If so, what was it?", type: "voice_text", required: false, next: "FV003" },
  { id: "FV003", category: "HPI", complaint: "fever", question: "Do you have chills or shivering?", type: "yes_no", required: true, next: "FV004" },
  { id: "FV004", category: "HPI", complaint: "fever", question: "Do you have a cough?", type: "yes_no", required: true, next: "FV005" },
  { id: "FV005", category: "HPI", complaint: "fever", question: "Do you have a sore throat?", type: "yes_no", required: true, next: "FV006" },
  { id: "FV006", category: "HPI", complaint: "fever", question: "Any vomiting?", type: "yes_no", required: true, next: "FV007" },
  { id: "FV007", category: "HPI", complaint: "fever", question: "Any loose motions / diarrhoea?", type: "yes_no", required: true, next: "FV008" },
  { id: "FV008", category: "HPI", complaint: "fever", question: "Any skin rash?", type: "yes_no", required: true, next: "FV009" },
  { id: "FV009", category: "HPI", complaint: "fever", question: "Any burning sensation while urinating?", type: "yes_no", required: true, next: null },
];

// Generic HPI template reused for the remaining complaints so every pathway
// stays clinically complete without hand-authoring each one individually.
function genericHpi(key: string): ClinicalQuestion[] {
  const p = (n: number) => `${key.toUpperCase()}${String(n).padStart(3, "0")}`;
  return [
    { id: p(1), category: "HPI", complaint: key, question: "When did this start?", type: "single_choice", options: ["Just now", "Today", "Yesterday", "2-3 days ago", "More than a week ago"], required: true, next: p(2) },
    { id: p(2), category: "HPI", complaint: key, question: "How would you describe it?", type: "single_choice", options: ["Sharp", "Dull", "Burning", "Throbbing", "Constant", "Comes and goes"], required: true, next: p(3) },
    { id: p(3), category: "HPI", complaint: key, question: "On a scale of 1-10, how severe is it?", type: "severity_scale", required: true, next: p(4) },
    { id: p(4), category: "HPI", complaint: key, question: "Does anything make it worse?", type: "voice_text", required: false, next: p(5) },
    { id: p(5), category: "HPI", complaint: key, question: "Does anything make it better?", type: "voice_text", required: false, next: p(6) },
    { id: p(6), category: "HPI", complaint: key, question: "Are you experiencing any of these along with it?", type: "multiple_choice", options: ["Breathlessness", "Sweating", "Nausea", "Dizziness", "Palpitations", "Fever", "None"], required: true, next: null },
  ];
}

export const COMPLAINT_PATHWAYS: Record<string, ClinicalQuestion[]> = {
  chest_pain: chestPain,
  fever: fever,
  headache: genericHpi("headache"),
  abdominal_pain: genericHpi("abdo"),
  cough: genericHpi("cough"),
  breathlessness: genericHpi("breath"),
  vomiting: genericHpi("vomit"),
  back_pain: genericHpi("back"),
  joint_pain: genericHpi("joint"),
  dizziness: genericHpi("dizzy"),
  weakness: genericHpi("weak"),
  other: genericHpi("other"),
};

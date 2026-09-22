import type { ClinicalQuestion } from "@/types";

// AYUSH Extended History — simplified prototype pathway shown only when
// department === "Ayurveda".
export const AYUSH_QUESTIONS: ClinicalQuestion[] = [
  { id: "AY001", category: "AYUSH", question: "Which body constitution (Prakriti) best describes you?", type: "single_choice", options: ["Vata", "Pitta", "Kapha", "Mixed", "Not sure"], required: false, next: "AY002" },
  { id: "AY002", category: "AYUSH", question: "How would you describe your current imbalance (Vikriti), if any?", type: "voice_text", required: false, next: "AY003" },
  { id: "AY003", category: "AYUSH", question: "How would you rate your body's general strength (Sara)?", type: "single_choice", options: ["Strong", "Moderate", "Weak"], required: false, next: "AY004" },
  { id: "AY004", category: "AYUSH", question: "How would you describe your body build (Samhanana)?", type: "single_choice", options: ["Well-built", "Medium", "Slender"], required: false, next: "AY005" },
  { id: "AY005", category: "AYUSH", question: "How would you describe your body measurements/proportion (Pramana)?", type: "single_choice", options: ["Proportionate", "Above average", "Below average"], required: false, next: "AY006" },
  { id: "AY006", category: "AYUSH", question: "Are you comfortable with your usual habits (Satmya), such as food and climate?", type: "voice_text", required: false, next: "AY007" },
  { id: "AY007", category: "AYUSH", question: "How would you describe your mental resilience (Sattva)?", type: "single_choice", options: ["High", "Moderate", "Low"], required: false, next: "AY008" },
  { id: "AY008", category: "AYUSH", question: "How is your digestive strength (Ahara Shakti)?", type: "single_choice", options: ["Strong", "Moderate", "Weak", "Irregular"], required: false, next: "AY009" },
  { id: "AY009", category: "AYUSH", question: "How is your physical exercise capacity (Vyayama Shakti)?", type: "single_choice", options: ["High", "Moderate", "Low"], required: false, next: "AY010" },
  { id: "AY010", category: "AYUSH", question: "What is your age group (Vaya) category for constitution assessment?", type: "single_choice", options: ["Childhood", "Adult", "Elderly"], required: false, next: "AY011" },
  { id: "AY011", category: "AYUSH", question: "Describe your usual diet (Ahara).", type: "voice_text", required: false, next: "AY012" },
  { id: "AY012", category: "AYUSH", question: "Describe your daily routine and lifestyle (Vihara).", type: "voice_text", required: false, next: "AY013" },
  { id: "AY013", category: "AYUSH", question: "How is your appetite?", type: "single_choice", options: ["Good", "Reduced", "Excessive", "Variable"], required: false, next: "AY014" },
  { id: "AY014", category: "AYUSH", question: "How are your bowel habits?", type: "single_choice", options: ["Regular", "Constipated", "Loose", "Irregular"], required: false, next: "AY015" },
  { id: "AY015", category: "AYUSH", question: "What do you believe may have caused your current condition (causative factors)?", type: "voice_text", required: false, next: null },
];

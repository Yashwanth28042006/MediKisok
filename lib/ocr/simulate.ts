import type { DocumentType, ExtractedEntity } from "@/types";

// Prototype OCR simulation layer. Accepts an uploaded file, and returns
// realistic-looking extracted structured data with confidence scores. Clearly
// labeled as prototype OCR throughout the UI — never presented as verified.

export interface OcrResult {
  documentDate: string;
  hospital: string;
  extractedEntities: ExtractedEntity[];
  rawExtractedText: string;
}

const PRESCRIPTION_SAMPLE: OcrResult = {
  documentDate: "12 August 2026",
  hospital: "ABC Medical Centre",
  rawExtractedText:
    "ABC Medical Centre\nDr. S. Venkatesan, MD\nDate: 12/08/2026\nDx: Type 2 Diabetes Mellitus\nRx:\n1. Tab Metformin 500mg - 1-0-1 after food\n2. Tab Amlodipine 5mg - 1-0-0\nAdvice: Low sugar diet, follow up in 4 weeks.",
  extractedEntities: [
    { label: "Diagnosis", value: "Type 2 Diabetes Mellitus", confidence: "high" },
    { label: "Medication", value: "Metformin", detail: "500 mg, twice daily", confidence: "high" },
    { label: "Medication", value: "Amlodipine", detail: "5 mg, once daily (morning)", confidence: "medium" },
    { label: "Doctor", value: "Dr. S. Venkatesan", confidence: "high" },
    { label: "Hospital", value: "ABC Medical Centre", confidence: "high" },
    { label: "Document Date", value: "12 August 2026", confidence: "high" },
  ],
};

const LAB_SAMPLE: OcrResult = {
  documentDate: "08 August 2026",
  hospital: "ABC Diagnostics Lab",
  rawExtractedText:
    "ABC Diagnostics Lab\nReport Date: 08/08/2026\nHemoglobin: 12.8 g/dL (Ref: 12-16)\nFasting Blood Sugar: 156 mg/dL (Ref: 70-100)\nCreatinine: 0.9 mg/dL (Ref: 0.6-1.2)\nTotal Cholesterol: 210 mg/dL (Ref: <200)",
  extractedEntities: [
    { label: "Investigation", value: "Hemoglobin", detail: "12.8 g/dL (Ref 12-16)", confidence: "high" },
    { label: "Investigation", value: "Fasting Blood Sugar", detail: "156 mg/dL (Ref 70-100)", confidence: "high" },
    { label: "Investigation", value: "Creatinine", detail: "0.9 mg/dL (Ref 0.6-1.2)", confidence: "high" },
    { label: "Investigation", value: "Total Cholesterol", detail: "210 mg/dL (Ref <200)", confidence: "medium" },
    { label: "Hospital", value: "ABC Diagnostics Lab", confidence: "high" },
    { label: "Document Date", value: "08 August 2026", confidence: "high" },
  ],
};

const DISCHARGE_SAMPLE: OcrResult = {
  documentDate: "20 March 2024",
  hospital: "City General Hospital",
  rawExtractedText:
    "City General Hospital\nDischarge Summary\nAdmission: 15/03/2024  Discharge: 20/03/2024\nDiagnosis: Acute Appendicitis\nProcedure: Laparoscopic Appendectomy\nCondition at discharge: Stable\nFollow up: OPD in 2 weeks",
  extractedEntities: [
    { label: "Diagnosis", value: "Acute Appendicitis", confidence: "high" },
    { label: "Procedure", value: "Laparoscopic Appendectomy", confidence: "high" },
    { label: "Hospital", value: "City General Hospital", confidence: "high" },
    { label: "Document Date", value: "20 March 2024", confidence: "medium" },
  ],
};

const IMAGING_SAMPLE: OcrResult = {
  documentDate: "02 January 2026",
  hospital: "ABC Medical Centre - Radiology",
  rawExtractedText:
    "ABC Medical Centre - Radiology\nChest X-Ray PA View\nFindings: No active infiltrate. Heart size normal.\nImpression: Normal study.",
  extractedEntities: [
    { label: "Procedure", value: "Chest X-Ray (PA view)", confidence: "high" },
    { label: "Investigation", value: "Impression", detail: "Normal study", confidence: "medium" },
    { label: "Hospital", value: "ABC Medical Centre - Radiology", confidence: "high" },
    { label: "Document Date", value: "02 January 2026", confidence: "needs_verification" },
  ],
};

const OTHER_SAMPLE: OcrResult = {
  documentDate: "Unknown",
  hospital: "Unknown",
  rawExtractedText: "Document received. Handwritten sections could not be fully read.",
  extractedEntities: [
    { label: "Note", value: "Partially legible document", detail: "Manual review recommended", confidence: "needs_verification" },
  ],
};

const SAMPLES: Record<DocumentType, OcrResult> = {
  Prescription: PRESCRIPTION_SAMPLE,
  "Laboratory Report": LAB_SAMPLE,
  "Discharge Summary": DISCHARGE_SAMPLE,
  "Imaging Report": IMAGING_SAMPLE,
  "Other Document": OTHER_SAMPLE,
};

export function simulateOcr(type: DocumentType): OcrResult {
  return SAMPLES[type] ?? OTHER_SAMPLE;
}

export const OCR_STAGES = [
  "Uploading",
  "Scanning",
  "Extracting text",
  "Identifying medical information",
  "Adding to timeline",
] as const;

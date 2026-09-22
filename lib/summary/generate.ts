import type {
  ClinicalResponse,
  ClinicalSummarySection,
  Encounter,
  MedicalDocument,
  MedicalTimelineEvent,
  Patient,
  TriageAlert,
} from "@/types";

// Deterministic, template-based clinical summary generator. No external LLM
// dependency — natural-looking paragraphs built from structured answers.
// Every generated summary must be labeled a draft requiring clinician review.

function ans(responses: ClinicalResponse[], match: (r: ClinicalResponse) => boolean): string | undefined {
  const r = responses.find(match);
  if (!r) return undefined;
  return Array.isArray(r.answer) ? r.answer.join(", ") : r.answer;
}

function ansList(responses: ClinicalResponse[], match: (r: ClinicalResponse) => boolean): string[] {
  const r = responses.find(match);
  if (!r) return [];
  return Array.isArray(r.answer) ? r.answer : [r.answer];
}

function durationPhrase(dur: string): string {
  const lower = dur.toLowerCase();
  if (["just now", "today", "yesterday"].includes(lower)) return `since ${lower}`;
  return `for ${lower}`;
}

const byQ = (id: string) => (r: ClinicalResponse) => r.questionId === id;
const byTextIncludes = (needle: string) => (r: ClinicalResponse) => r.question.toLowerCase().includes(needle);

function buildHpiParagraph(responses: ClinicalResponse[], chiefComplaint: string): string {
  const onset = ans(responses, byTextIncludes("when did") ) ?? ans(responses, byTextIncludes("when did this start"));
  const character = ans(responses, byTextIncludes("how would you describe"));
  const severity = ans(responses, byTextIncludes("scale of 1-10"));
  const location = ans(responses, byTextIncludes("where exactly"));
  const radiation = ans(responses, byTextIncludes("move anywhere"));
  const aggravating = ans(responses, byTextIncludes("worse"));
  const relieving = ans(responses, byTextIncludes("better"));
  const associated = ansList(responses, byTextIncludes("experiencing")).filter((a) => a.toLowerCase() !== "none");

  const parts: string[] = [];
  let sentence = `Patient reports ${chiefComplaint.toLowerCase()}`;
  if (onset) sentence += ` beginning ${onset.toLowerCase()}`;
  if (location) sentence += `, located at ${location.toLowerCase()}`;
  sentence += ".";
  parts.push(sentence);

  if (character || severity) {
    let s = "The discomfort is described as";
    if (character) s += ` ${character.toLowerCase()}`;
    if (severity) s += `, rated ${severity}/10 in severity`;
    s += ".";
    parts.push(s);
  }

  if (radiation && radiation.toLowerCase() !== "no") {
    parts.push(`Pain radiates to ${radiation.toLowerCase()}.`);
  }

  if (aggravating || relieving) {
    let s = "";
    if (aggravating) s += `Symptoms worsen with ${aggravating.toLowerCase()}. `;
    if (relieving) s += `Symptoms improve with ${relieving.toLowerCase()}.`;
    parts.push(s.trim());
  }

  if (associated.length > 0) {
    parts.push(`Associated symptoms reported: ${associated.join(", ").toLowerCase()}.`);
  }

  return parts.join(" ");
}

function buildFeverParagraph(responses: ClinicalResponse[]): string {
  const duration = ans(responses, byQ("FV001"));
  const temp = ans(responses, byQ("FV002"));
  const chills = ans(responses, byQ("FV003"));
  const cough = ans(responses, byQ("FV004"));
  const soreThroat = ans(responses, byQ("FV005"));
  const vomiting = ans(responses, byQ("FV006"));
  const diarrhoea = ans(responses, byQ("FV007"));
  const rash = ans(responses, byQ("FV008"));
  const urinary = ans(responses, byQ("FV009"));

  const parts: string[] = [`Patient reports fever for ${duration?.toLowerCase() ?? "an unspecified duration"}.`];
  if (temp) parts.push(`Measured temperature: ${temp}.`);
  const positives: string[] = [];
  if (chills === "Yes") positives.push("chills");
  if (cough === "Yes") positives.push("cough");
  if (soreThroat === "Yes") positives.push("sore throat");
  if (vomiting === "Yes") positives.push("vomiting");
  if (diarrhoea === "Yes") positives.push("loose motions");
  if (rash === "Yes") positives.push("skin rash");
  if (urinary === "Yes") positives.push("urinary burning sensation");
  if (positives.length > 0) parts.push(`Associated with ${positives.join(", ")}.`);
  else parts.push("No associated chills, cough, sore throat, vomiting, diarrhoea, rash, or urinary symptoms reported.");
  return parts.join(" ");
}

export function generateSummarySections(
  patient: Patient,
  encounter: Encounter,
  responses: ClinicalResponse[],
  documents: MedicalDocument[],
  timelineEvents: MedicalTimelineEvent[],
  triageAlerts: TriageAlert[]
): ClinicalSummarySection[] {
  const sections: ClinicalSummarySection[] = [];
  const chiefComplaintRaw = ans(responses, byQ("CC001")) ?? "Not specified";

  sections.push({
    key: "patient_details",
    title: "Patient Details",
    content: `${patient.name}, ${patient.age} years, ${patient.gender}. Token ${encounter.token}. Department: ${encounter.department}. Visit type: ${encounter.visitType}.${patient.abhaId ? ` ABHA: ${patient.abhaId}.` : ""}`,
    source: "patient_reported",
  });

  sections.push({
    key: "chief_complaint",
    title: "Chief Complaint",
    content: `${chiefComplaintRaw}${(() => {
      const dur = ans(responses, byTextIncludes("when did")) ?? ans(responses, byTextIncludes("how long"));
      return dur ? ` ${durationPhrase(dur)}` : "";
    })()}.`,
    source: "patient_reported",
  });

  const hpiContent =
    chiefComplaintRaw.toLowerCase() === "fever"
      ? buildFeverParagraph(responses)
      : buildHpiParagraph(responses, chiefComplaintRaw);
  sections.push({
    key: "hpi",
    title: "History of Present Illness",
    content: hpiContent || "Not enough information captured to generate a narrative.",
    source: "patient_reported",
  });

  const pmh = ansList(responses, byQ("PMH001")).filter((a) => a.toLowerCase() !== "none");
  sections.push({
    key: "pmh",
    title: "Past Medical History",
    content: pmh.length > 0 ? `Known history of ${pmh.join(", ").toLowerCase()}.` : "No significant past medical history reported.",
    source: "patient_reported",
  });

  const psh = ans(responses, byQ("PSH001"));
  sections.push({
    key: "psh",
    title: "Past Surgical History",
    content: psh && !/none|no/i.test(psh) ? psh : "No prior surgeries reported.",
    source: "patient_reported",
  });

  const meds = ans(responses, byQ("MED001"));
  sections.push({
    key: "medication",
    title: "Medication History",
    content: meds && !/none|no/i.test(meds) ? meds : "No regular medications reported by patient.",
    source: "patient_reported",
  });

  const allergy = ans(responses, byQ("ALG001"));
  sections.push({
    key: "allergy",
    title: "Allergy History",
    content: allergy && !/none|no/i.test(allergy) ? `⚠ ${allergy}` : "No known allergies reported.",
    source: "patient_reported",
  });

  const fhx = ans(responses, byQ("FHX001"));
  sections.push({
    key: "family",
    title: "Family History",
    content: fhx && fhx.trim().length > 0 ? fhx : "Not significant / not reported.",
    source: "patient_reported",
  });

  const smoke = ans(responses, byQ("PERS001"));
  const alcohol = ans(responses, byQ("PERS002"));
  const diet = ans(responses, byQ("PERS003"));
  const sleep = ans(responses, byQ("PERS004"));
  const occupation = ans(responses, byQ("PERS005"));
  sections.push({
    key: "personal",
    title: "Personal History",
    content: `Smoking: ${smoke ?? "not recorded"}. Alcohol: ${alcohol ?? "not recorded"}. Diet: ${diet ?? "not recorded"}. Sleep: ${sleep ?? "not recorded"}.${occupation ? ` Occupation: ${occupation}.` : ""}`,
    source: "patient_reported",
  });

  const ros = ansList(responses, byQ("ROS001")).filter((a) => a.toLowerCase() !== "none");
  sections.push({
    key: "ros",
    title: "Review of Systems",
    content: ros.length > 0 ? `Patient additionally reports ${ros.join(", ").toLowerCase()}.` : "No additional systemic symptoms reported.",
    source: "patient_reported",
  });

  const investigations = documents
    .flatMap((d) => d.extractedEntities.filter((e) => e.label === "Investigation").map((e) => `${e.value}: ${e.detail ?? ""} (from ${d.type}, ${d.documentDate ?? "date unknown"})`));
  sections.push({
    key: "investigations",
    title: "Previous Investigations",
    content: investigations.length > 0 ? investigations.join(" \n") : "No previous investigation reports uploaded.",
    source: "document_extracted",
  });

  sections.push({
    key: "timeline",
    title: "Relevant Timeline",
    content:
      timelineEvents.length > 0
        ? timelineEvents.map((e) => `${e.displayDate}: ${e.title}`).join(" \n")
        : "No prior timeline events on record.",
    source: "document_extracted",
  });

  sections.push({
    key: "documents",
    title: "Uploaded Records",
    content:
      documents.length > 0
        ? documents.map((d) => `${d.type} – ${d.fileName} (uploaded ${new Date(d.uploadedAt).toLocaleDateString()})`).join(" \n")
        : "No documents uploaded during intake.",
    source: "document_extracted",
  });

  sections.push({
    key: "triage",
    title: "Priority / Triage Notes",
    content:
      triageAlerts.length > 0
        ? triageAlerts.map((a) => `${a.message} (Rule ${a.ruleId})`).join(" \n")
        : "No priority symptoms flagged by the triage assistance engine.",
    source: "system_highlighted",
  });

  return sections;
}

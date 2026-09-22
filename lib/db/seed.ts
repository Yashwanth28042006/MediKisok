import { randomUUID } from "node:crypto";
import { getDb, saveDb } from "@/lib/db/store";
import { generateSummarySections } from "@/lib/summary/generate";
import { evaluateTriageRules } from "@/lib/triage/engine";
import { simulateOcr } from "@/lib/ocr/simulate";
import type {
  User,
  Patient,
  Encounter,
  ClinicalResponse,
  MedicalDocument,
  MedicalTimelineEvent,
} from "@/types";

function uid() {
  return randomUUID();
}

function resp(encounterId: string, questionId: string, category: string, question: string, answer: string | string[], source: ClinicalResponse["source"] = "patient_reported"): ClinicalResponse {
  return { id: uid(), encounterId, questionId, category, question, answer, inputMode: "touch", timestamp: new Date().toISOString(), source };
}

export function ensureSeeded() {
  const db = getDb();
  if (db.patients.length > 0) return;

  // --- Users ---
  const users: User[] = [
    { id: uid(), role: "kiosk", name: "Reception Desk", email: "reception@medikiosk.demo", password: "demo123" },
    { id: uid(), role: "doctor", name: "Dr. Ananya Sharma", email: "doctor@medikiosk.demo", password: "demo123", department: "General Medicine" },
    { id: uid(), role: "admin", name: "Priya Nair (Admin)", email: "admin@medikiosk.demo", password: "demo123" },
    { id: uid(), role: "triage", name: "Suresh Babu (Triage Staff)", email: "triage@medikiosk.demo", password: "demo123" },
  ];
  db.users.push(...users);

  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  // ---------------- Patient 1: Rajesh Kumar — HIGH priority chest pain ----------------
  const rajesh: Patient = {
    id: uid(), patientId: "MK-2026-0001", abhaId: "91-2345-6789-0123", name: "Rajesh Kumar", age: 54, gender: "Male",
    mobile: "9876543210", preferredLanguage: "en", isReturning: true, createdAt: iso(daysAgo(0)),
  };
  const encRajesh: Encounter = {
    id: uid(), token: "A014", patientId: rajesh.id, department: "General Medicine", visitType: "New Visit",
    createdAt: iso(now), intakeStatus: "PATIENT_CONFIRMED", priority: "HIGH", chiefComplaint: "Chest pain", waitingSince: iso(now),
  };
  db.patients.push(rajesh);
  db.encounters.push(encRajesh);

  const rajeshResponses: ClinicalResponse[] = [
    resp(encRajesh.id, "CC001", "CC", "What problem brought you to the hospital today?", "Chest pain"),
    resp(encRajesh.id, "CP001", "HPI", "When did the pain begin?", "Yesterday"),
    resp(encRajesh.id, "CP002", "HPI", "Where exactly is the pain?", "Centre of chest"),
    resp(encRajesh.id, "CP003", "HPI", "How would you describe the pain?", "Pressure"),
    resp(encRajesh.id, "CP004", "HPI", "On a scale of 1-10, how severe is the pain?", "7"),
    resp(encRajesh.id, "CP005", "HPI", "Does the pain move anywhere else?", "Left arm"),
    resp(encRajesh.id, "CP006", "HPI", "Does anything make the pain worse?", "Exertion"),
    resp(encRajesh.id, "CP007", "HPI", "Does anything make the pain better?", "Rest"),
    resp(encRajesh.id, "CP008", "HPI", "Are you experiencing any of these?", ["Breathlessness", "Sweating"]),
    resp(encRajesh.id, "PMH001", "PMH", "Have you been diagnosed with any of these conditions before?", ["Hypertension"]),
    resp(encRajesh.id, "PSH001", "PSH", "Have you had any surgeries in the past? If yes, please describe.", "None"),
    resp(encRajesh.id, "MED001", "MEDICATION", "Are you currently taking any medicines regularly?", "Amlodipine 5mg once daily for blood pressure"),
    resp(encRajesh.id, "ALG001", "ALLERGY", "Do you have any known allergies to medicines or food?", "No known allergies"),
    resp(encRajesh.id, "FHX001", "FHX", "Does anyone in your immediate family have diabetes, heart disease, or similar conditions?", "Father had heart disease"),
    resp(encRajesh.id, "PERS001", "PERSONAL", "Do you smoke?", "No"),
    resp(encRajesh.id, "PERS002", "PERSONAL", "Do you drink alcohol?", "No"),
    resp(encRajesh.id, "PERS003", "PERSONAL", "How would you describe your diet?", "Vegetarian"),
    resp(encRajesh.id, "PERS004", "PERSONAL", "How is your sleep generally?", "Disturbed"),
    resp(encRajesh.id, "PERS005", "PERSONAL", "What is your occupation?", "Bus driver"),
    resp(encRajesh.id, "ROS001", "ROS", "Do you have any of the following right now?", ["None"]),
  ];
  db.clinicalResponses.push(...rajeshResponses);

  const rajeshDoc: MedicalDocument = {
    id: uid(), encounterId: encRajesh.id, patientId: rajesh.id, type: "Prescription", fileName: "prescription_12aug2026.jpg",
    uploadedAt: iso(daysAgo(40)), ocrStatus: "done",
    ...simulateOcr("Prescription"),
  };
  db.documents.push(rajeshDoc);

  const rajeshTimeline: MedicalTimelineEvent[] = [
    { id: uid(), patientId: rajesh.id, date: iso(new Date(2022, 3, 1)), displayDate: "2022", type: "diagnosis", title: "Diagnosed with hypertension", source: "patient_reported" },
    { id: uid(), patientId: rajesh.id, date: iso(new Date(2026, 0, 15)), displayDate: "Jan 2026", type: "medication", title: "Started Amlodipine 5mg", source: "patient_reported" },
    { id: uid(), patientId: rajesh.id, date: iso(new Date(2026, 7, 12)), displayDate: "12 Aug 2026", type: "medication", title: "Prescription: Metformin 500mg started", source: "document_extracted", sourceDocumentId: rajeshDoc.id },
    { id: uid(), patientId: rajesh.id, date: iso(now), displayDate: "Today", type: "visit", title: "Current visit – chest pain", source: "patient_reported" },
  ];
  db.timelineEvents.push(...rajeshTimeline);

  const rajeshRules = evaluateTriageRules(rajeshResponses);
  for (const rule of rajeshRules) {
    db.triageAlerts.push({ id: uid(), encounterId: encRajesh.id, patientId: rajesh.id, ruleId: rule.id, severity: rule.severity, message: rule.message, createdAt: iso(now), acknowledged: false });
  }

  const rajeshSections = generateSummarySections(rajesh, encRajesh, rajeshResponses, [rajeshDoc], rajeshTimeline, db.triageAlerts.filter((a) => a.encounterId === encRajesh.id));
  db.summaries.push({ id: uid(), encounterId: encRajesh.id, generatedAt: iso(now), sections: rajeshSections, status: "patient_confirmed" });

  // ---------------- Patient 2: Meena Lakshmi — routine fever, Tamil, abnormal lab ----------------
  const meena: Patient = {
    id: uid(), patientId: "MK-2026-0002", name: "Meena Lakshmi", age: 46, gender: "Female", mobile: "9876500002",
    preferredLanguage: "ta", isReturning: false, createdAt: iso(now),
  };
  const encMeena: Encounter = {
    id: uid(), token: "A015", patientId: meena.id, department: "General Medicine", visitType: "New Visit",
    createdAt: iso(now), intakeStatus: "PATIENT_CONFIRMED", priority: "ROUTINE", chiefComplaint: "Fever", waitingSince: iso(now),
  };
  db.patients.push(meena);
  db.encounters.push(encMeena);
  const meenaResponses: ClinicalResponse[] = [
    resp(encMeena.id, "CC001", "CC", "What problem brought you to the hospital today?", "Fever"),
    resp(encMeena.id, "FV001", "HPI", "How long have you had fever?", "3-5 days"),
    resp(encMeena.id, "FV002", "HPI", "Have you measured your temperature? If so, what was it?", "101 F"),
    resp(encMeena.id, "FV003", "HPI", "Do you have chills or shivering?", "Yes"),
    resp(encMeena.id, "FV004", "HPI", "Do you have a cough?", "No"),
    resp(encMeena.id, "FV005", "HPI", "Do you have a sore throat?", "No"),
    resp(encMeena.id, "FV006", "HPI", "Any vomiting?", "No"),
    resp(encMeena.id, "FV007", "HPI", "Any loose motions / diarrhoea?", "No"),
    resp(encMeena.id, "FV008", "HPI", "Any skin rash?", "No"),
    resp(encMeena.id, "FV009", "HPI", "Any burning sensation while urinating?", "No"),
    resp(encMeena.id, "PMH001", "PMH", "Have you been diagnosed with any of these conditions before?", ["None"]),
    resp(encMeena.id, "PSH001", "PSH", "Have you had any surgeries in the past? If yes, please describe.", "None"),
    resp(encMeena.id, "MED001", "MEDICATION", "Are you currently taking any medicines regularly?", "None"),
    resp(encMeena.id, "ALG001", "ALLERGY", "Do you have any known allergies to medicines or food?", "None"),
    resp(encMeena.id, "FHX001", "FHX", "Does anyone in your immediate family have diabetes, heart disease, or similar conditions?", "Mother has diabetes"),
    resp(encMeena.id, "PERS001", "PERSONAL", "Do you smoke?", "No"),
    resp(encMeena.id, "PERS002", "PERSONAL", "Do you drink alcohol?", "No"),
    resp(encMeena.id, "PERS003", "PERSONAL", "How would you describe your diet?", "Vegetarian"),
    resp(encMeena.id, "PERS004", "PERSONAL", "How is your sleep generally?", "Good"),
    resp(encMeena.id, "PERS005", "PERSONAL", "What is your occupation?", "Homemaker"),
    resp(encMeena.id, "ROS001", "ROS", "Do you have any of the following right now?", ["Loss of appetite"]),
  ];
  db.clinicalResponses.push(...meenaResponses);
  const meenaDoc: MedicalDocument = {
    id: uid(), encounterId: encMeena.id, patientId: meena.id, type: "Laboratory Report", fileName: "cbc_fbs_report.pdf",
    uploadedAt: iso(daysAgo(2)), ocrStatus: "done",
    ...simulateOcr("Laboratory Report"),
  };
  db.documents.push(meenaDoc);
  db.timelineEvents.push({ id: uid(), patientId: meena.id, date: iso(now), displayDate: "Today", type: "visit", title: "Current visit – fever", source: "patient_reported" });
  const meenaSections = generateSummarySections(meena, encMeena, meenaResponses, [meenaDoc], db.timelineEvents.filter((t) => t.patientId === meena.id), []);
  db.summaries.push({ id: uid(), encounterId: encMeena.id, generatedAt: iso(now), sections: meenaSections, status: "patient_confirmed" });

  // ---------------- Patient 3: Abdul Rahman — HIGH priority breathlessness, Cardiology ----------------
  const abdul: Patient = {
    id: uid(), patientId: "MK-2026-0003", name: "Abdul Rahman", age: 67, gender: "Male", mobile: "9876500003",
    preferredLanguage: "en", isReturning: true, createdAt: iso(now),
  };
  const encAbdul: Encounter = {
    id: uid(), token: "A016", patientId: abdul.id, department: "Cardiology", visitType: "Follow-up",
    createdAt: iso(now), intakeStatus: "PATIENT_CONFIRMED", priority: "HIGH", chiefComplaint: "Breathlessness", waitingSince: iso(now),
  };
  db.patients.push(abdul);
  db.encounters.push(encAbdul);
  const abdulResponses: ClinicalResponse[] = [
    resp(encAbdul.id, "CC001", "CC", "What problem brought you to the hospital today?", "Breathlessness"),
    resp(encAbdul.id, "BREATH001", "HPI", "When did this start?", "2-3 days ago"),
    resp(encAbdul.id, "BREATH002", "HPI", "How would you describe it?", "Constant"),
    resp(encAbdul.id, "BREATH003", "HPI", "On a scale of 1-10, how severe is it?", "8"),
    resp(encAbdul.id, "BREATH004", "HPI", "Does anything make it worse?", "Walking, lying flat"),
    resp(encAbdul.id, "BREATH005", "HPI", "Does anything make it better?", "Sitting upright"),
    resp(encAbdul.id, "BREATH006", "HPI", "Are you experiencing any of these along with it?", ["Palpitations", "Dizziness"]),
    resp(encAbdul.id, "PMH001", "PMH", "Have you been diagnosed with any of these conditions before?", ["Heart disease", "Hypertension"]),
    resp(encAbdul.id, "PSH001", "PSH", "Have you had any surgeries in the past? If yes, please describe.", "Coronary angioplasty in 2021"),
    resp(encAbdul.id, "MED001", "MEDICATION", "Are you currently taking any medicines regularly?", "Aspirin 75mg, Atorvastatin 20mg"),
    resp(encAbdul.id, "ALG001", "ALLERGY", "Do you have any known allergies to medicines or food?", "None"),
    resp(encAbdul.id, "FHX001", "FHX", "Does anyone in your immediate family have diabetes, heart disease, or similar conditions?", "Brother had a heart attack"),
    resp(encAbdul.id, "PERS001", "PERSONAL", "Do you smoke?", "Yes"),
    resp(encAbdul.id, "PERS002", "PERSONAL", "Do you drink alcohol?", "No"),
    resp(encAbdul.id, "PERS003", "PERSONAL", "How would you describe your diet?", "Non-vegetarian"),
    resp(encAbdul.id, "PERS004", "PERSONAL", "How is your sleep generally?", "Disturbed"),
    resp(encAbdul.id, "PERS005", "PERSONAL", "What is your occupation?", "Retired"),
    resp(encAbdul.id, "ROS001", "ROS", "Do you have any of the following right now?", ["Swelling in legs"]),
  ];
  db.clinicalResponses.push(...abdulResponses);
  db.timelineEvents.push(
    { id: uid(), patientId: abdul.id, date: iso(new Date(2021, 5, 1)), displayDate: "2021", type: "procedure", title: "Coronary angioplasty", source: "patient_reported" },
    { id: uid(), patientId: abdul.id, date: iso(now), displayDate: "Today", type: "visit", title: "Current visit – breathlessness", source: "patient_reported" }
  );
  const abdulRules = evaluateTriageRules(abdulResponses);
  for (const rule of abdulRules) {
    db.triageAlerts.push({ id: uid(), encounterId: encAbdul.id, patientId: abdul.id, ruleId: rule.id, severity: rule.severity, message: rule.message, createdAt: iso(now), acknowledged: false });
  }
  const abdulSections = generateSummarySections(abdul, encAbdul, abdulResponses, [], db.timelineEvents.filter((t) => t.patientId === abdul.id), db.triageAlerts.filter((a) => a.encounterId === encAbdul.id));
  db.summaries.push({ id: uid(), encounterId: encAbdul.id, generatedAt: iso(now), sections: abdulSections, status: "patient_confirmed" });

  // ---------------- Patient 4: Kavitha — Ayurveda, joint pain ----------------
  const kavitha: Patient = {
    id: uid(), patientId: "MK-2026-0004", name: "Kavitha", age: 39, gender: "Female", mobile: "9876500004",
    preferredLanguage: "en", isReturning: false, createdAt: iso(now),
  };
  const encKavitha: Encounter = {
    id: uid(), token: "A017", patientId: kavitha.id, department: "Ayurveda", visitType: "New Visit",
    createdAt: iso(now), intakeStatus: "PATIENT_CONFIRMED", priority: "ROUTINE", chiefComplaint: "Joint pain", waitingSince: iso(now), ayushMode: true,
  };
  db.patients.push(kavitha);
  db.encounters.push(encKavitha);
  const kavithaResponses: ClinicalResponse[] = [
    resp(encKavitha.id, "CC001", "CC", "What problem brought you to the hospital today?", "Joint pain"),
    resp(encKavitha.id, "JOINT001", "HPI", "When did this start?", "More than a week ago"),
    resp(encKavitha.id, "JOINT002", "HPI", "How would you describe it?", "Throbbing"),
    resp(encKavitha.id, "JOINT003", "HPI", "On a scale of 1-10, how severe is it?", "5"),
    resp(encKavitha.id, "JOINT004", "HPI", "Does anything make it worse?", "Cold weather, mornings"),
    resp(encKavitha.id, "JOINT005", "HPI", "Does anything make it better?", "Warm compress"),
    resp(encKavitha.id, "JOINT006", "HPI", "Are you experiencing any of these along with it?", ["None"]),
    resp(encKavitha.id, "PMH001", "PMH", "Have you been diagnosed with any of these conditions before?", ["Thyroid disease"]),
    resp(encKavitha.id, "PSH001", "PSH", "Have you had any surgeries in the past? If yes, please describe.", "None"),
    resp(encKavitha.id, "MED001", "MEDICATION", "Are you currently taking any medicines regularly?", "Thyroxine 50mcg"),
    resp(encKavitha.id, "ALG001", "ALLERGY", "Do you have any known allergies to medicines or food?", "None"),
    resp(encKavitha.id, "FHX001", "FHX", "Does anyone in your immediate family have diabetes, heart disease, or similar conditions?", "None"),
    resp(encKavitha.id, "PERS001", "PERSONAL", "Do you smoke?", "No"),
    resp(encKavitha.id, "PERS002", "PERSONAL", "Do you drink alcohol?", "No"),
    resp(encKavitha.id, "PERS003", "PERSONAL", "How would you describe your diet?", "Vegetarian"),
    resp(encKavitha.id, "PERS004", "PERSONAL", "How is your sleep generally?", "Good"),
    resp(encKavitha.id, "PERS005", "PERSONAL", "What is your occupation?", "Teacher"),
    resp(encKavitha.id, "ROS001", "ROS", "Do you have any of the following right now?", ["None"]),
    resp(encKavitha.id, "AY001", "AYUSH", "Which body constitution (Prakriti) best describes you?", "Vata"),
    resp(encKavitha.id, "AY003", "AYUSH", "How would you rate your body's general strength (Sara)?", "Moderate"),
    resp(encKavitha.id, "AY008", "AYUSH", "How is your digestive strength (Ahara Shakti)?", "Irregular"),
    resp(encKavitha.id, "AY013", "AYUSH", "How is your appetite?", "Reduced"),
    resp(encKavitha.id, "AY014", "AYUSH", "How are your bowel habits?", "Constipated"),
  ];
  db.clinicalResponses.push(...kavithaResponses);
  db.timelineEvents.push({ id: uid(), patientId: kavitha.id, date: iso(now), displayDate: "Today", type: "visit", title: "Current visit – joint pain", source: "patient_reported" });
  const kavithaSections = generateSummarySections(kavitha, encKavitha, kavithaResponses, [], db.timelineEvents.filter((t) => t.patientId === kavitha.id), []);
  db.summaries.push({ id: uid(), encounterId: encKavitha.id, generatedAt: iso(now), sections: kavithaSections, status: "patient_confirmed" });

  // ---------------- Patient 5: Arjun — Orthopaedics, back pain, returning ----------------
  const arjun: Patient = {
    id: uid(), patientId: "MK-2026-0005", name: "Arjun", age: 24, gender: "Male", mobile: "9876500005",
    preferredLanguage: "en", isReturning: true, createdAt: iso(now),
  };
  const encArjun: Encounter = {
    id: uid(), token: "A018", patientId: arjun.id, department: "Orthopaedics", visitType: "Follow-up",
    createdAt: iso(now), intakeStatus: "SUMMARY_READY", priority: "ROUTINE", chiefComplaint: "Back pain", waitingSince: iso(now),
  };
  db.patients.push(arjun);
  db.encounters.push(encArjun);
  const arjunResponses: ClinicalResponse[] = [
    resp(encArjun.id, "CC001", "CC", "What problem brought you to the hospital today?", "Back pain"),
    resp(encArjun.id, "BACK001", "HPI", "When did this start?", "More than a week ago"),
    resp(encArjun.id, "BACK002", "HPI", "How would you describe it?", "Dull"),
    resp(encArjun.id, "BACK003", "HPI", "On a scale of 1-10, how severe is it?", "4"),
    resp(encArjun.id, "BACK004", "HPI", "Does anything make it worse?", "Prolonged sitting"),
    resp(encArjun.id, "BACK005", "HPI", "Does anything make it better?", "Stretching"),
    resp(encArjun.id, "BACK006", "HPI", "Are you experiencing any of these along with it?", ["None"]),
    resp(encArjun.id, "PMH001", "PMH", "Have you been diagnosed with any of these conditions before?", ["None"]),
    resp(encArjun.id, "PSH001", "PSH", "Have you had any surgeries in the past? If yes, please describe.", "None"),
    resp(encArjun.id, "MED001", "MEDICATION", "Are you currently taking any medicines regularly?", "Occasional ibuprofen"),
    resp(encArjun.id, "ALG001", "ALLERGY", "Do you have any known allergies to medicines or food?", "None"),
    resp(encArjun.id, "FHX001", "FHX", "Does anyone in your immediate family have diabetes, heart disease, or similar conditions?", "None"),
    resp(encArjun.id, "PERS001", "PERSONAL", "Do you smoke?", "No"),
    resp(encArjun.id, "PERS002", "PERSONAL", "Do you drink alcohol?", "Yes"),
    resp(encArjun.id, "PERS003", "PERSONAL", "How would you describe your diet?", "Non-vegetarian"),
    resp(encArjun.id, "PERS004", "PERSONAL", "How is your sleep generally?", "Good"),
    resp(encArjun.id, "PERS005", "PERSONAL", "What is your occupation?", "Software Engineer"),
    resp(encArjun.id, "ROS001", "ROS", "Do you have any of the following right now?", ["None"]),
  ];
  db.clinicalResponses.push(...arjunResponses);
  db.timelineEvents.push(
    { id: uid(), patientId: arjun.id, date: iso(new Date(2023, 8, 1)), displayDate: "2023", type: "diagnosis", title: "Lumbar muscle strain diagnosed", source: "patient_reported" },
    { id: uid(), patientId: arjun.id, date: iso(new Date(2024, 2, 1)), displayDate: "2024", type: "procedure", title: "Physiotherapy course completed", source: "patient_reported" },
    { id: uid(), patientId: arjun.id, date: iso(now), displayDate: "Today", type: "visit", title: "Current visit – back pain follow-up", source: "patient_reported" }
  );
  const arjunSections = generateSummarySections(arjun, encArjun, arjunResponses, [], db.timelineEvents.filter((t) => t.patientId === arjun.id), []);
  db.summaries.push({ id: uid(), encounterId: encArjun.id, generatedAt: iso(now), sections: arjunSections, status: "draft" });

  // --- Baseline audit trail entries for seeded data ---
  for (const [p, e] of [[rajesh, encRajesh], [meena, encMeena], [abdul, encAbdul], [kavitha, encKavitha], [arjun, encArjun]] as [Patient, Encounter][]) {
    db.auditLogs.push({ id: uid(), timestamp: e.createdAt, actor: p.name, action: "Patient registered", resource: `Patient/${p.id}`, status: "success", patientId: p.id, encounterId: e.id });
    db.auditLogs.push({ id: uid(), timestamp: e.createdAt, actor: p.name, action: "Clinical history submitted", resource: `Encounter/${e.id}`, status: "success", patientId: p.id, encounterId: e.id });
  }

  saveDb();
}

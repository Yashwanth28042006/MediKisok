import type { ClinicalQuestion, ClinicalResponse, Department } from "@/types";
import { CHIEF_COMPLAINTS, COMPLAINT_PATHWAYS, complaintKey } from "@/data/questions/complaints";
import { COMMON_SECTIONS } from "@/data/questions/common";
import { AYUSH_QUESTIONS } from "@/data/questions/ayush";

export const CHIEF_COMPLAINT_QUESTION: ClinicalQuestion = {
  id: "CC001",
  category: "CC",
  question: "What problem brought you to the hospital today?",
  type: "single_choice",
  options: [...CHIEF_COMPLAINTS],
  required: true,
  next: null,
};

function buildPathway(chiefComplaintAnswer: string | undefined, department?: Department): ClinicalQuestion[] {
  const list: ClinicalQuestion[] = [CHIEF_COMPLAINT_QUESTION];
  if (chiefComplaintAnswer) {
    const key = complaintKey(chiefComplaintAnswer);
    list.push(...(COMPLAINT_PATHWAYS[key] ?? COMPLAINT_PATHWAYS.other));
  }
  list.push(...COMMON_SECTIONS);
  if (department === "Ayurveda") {
    list.push(...AYUSH_QUESTIONS);
  }
  return list;
}

export interface InterviewProgress {
  question: ClinicalQuestion | null;
  answeredCount: number;
  totalCount: number;
  complete: boolean;
}

export function getNextQuestion(responses: ClinicalResponse[], department?: Department): InterviewProgress {
  const ccResponse = responses.find((r) => r.questionId === "CC001");
  const chiefComplaintAnswer = ccResponse ? (Array.isArray(ccResponse.answer) ? ccResponse.answer[0] : ccResponse.answer) : undefined;
  const pathway = buildPathway(chiefComplaintAnswer, department);
  const answeredIds = new Set(responses.map((r) => r.questionId));
  const next = pathway.find((q) => !answeredIds.has(q.id)) ?? null;
  return {
    question: next,
    answeredCount: pathway.filter((q) => answeredIds.has(q.id)).length,
    totalCount: pathway.length,
    complete: next === null,
  };
}

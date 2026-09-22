export type LabBadge = "NORMAL" | "HIGH" | "LOW" | "UNKNOWN";

// Parses strings like "156 mg/dL (Ref 70-100)" or "0.9 mg/dL (Ref 0.6-1.2)"
// into a reference-range badge. Reference-range highlighting only — never a
// diagnostic judgement.
export function classifyLabDetail(detail?: string): LabBadge {
  if (!detail) return "UNKNOWN";
  const valueMatch = detail.match(/^([\d.]+)/);
  const rangeMatch = detail.match(/Ref\s*([<>]?)\s*([\d.]+)(?:\s*-\s*([\d.]+))?/i);
  if (!valueMatch || !rangeMatch) return "UNKNOWN";

  const value = parseFloat(valueMatch[1]);
  const operator = rangeMatch[1];
  const low = rangeMatch[2] ? parseFloat(rangeMatch[2]) : undefined;
  const high = rangeMatch[3] ? parseFloat(rangeMatch[3]) : undefined;

  if (operator === "<" && low !== undefined) {
    return value < low ? "NORMAL" : "HIGH";
  }
  if (operator === ">" && low !== undefined) {
    return value > low ? "NORMAL" : "LOW";
  }
  if (low !== undefined && high !== undefined) {
    if (value < low) return "LOW";
    if (value > high) return "HIGH";
    return "NORMAL";
  }
  return "UNKNOWN";
}

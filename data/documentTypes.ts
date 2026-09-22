import type { DocumentType } from "@/types";
import { FileText, FlaskConical, HeartPulse, ScanEye, FolderOpen } from "lucide-react";

export const DOCUMENT_TYPES: { type: DocumentType; label: string; icon: typeof FileText }[] = [
  { type: "Prescription", label: "Prescription", icon: FileText },
  { type: "Laboratory Report", label: "Laboratory Report", icon: FlaskConical },
  { type: "Discharge Summary", label: "Discharge Summary", icon: HeartPulse },
  { type: "Imaging Report", label: "Imaging Report", icon: ScanEye },
  { type: "Other Document", label: "Other Document", icon: FolderOpen },
];

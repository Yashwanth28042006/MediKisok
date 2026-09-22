import { Badge } from "@/components/ui/badge";
import type { AnswerSource } from "@/types";
import { cn } from "@/lib/utils";
import { Mic, FileText, Sparkles, Stethoscope } from "lucide-react";

const CONFIG: Record<AnswerSource, { label: string; icon: React.ElementType; className: string }> = {
  patient_reported: { label: "Patient reported", icon: Mic, className: "bg-secondary text-secondary-foreground" },
  document_extracted: { label: "Document extracted", icon: FileText, className: "bg-accent text-accent-foreground" },
  system_highlighted: { label: "System highlighted", icon: Sparkles, className: "bg-warning/20 text-warning-foreground border border-warning/40" },
  doctor_verified: { label: "Doctor verified", icon: Stethoscope, className: "bg-success/15 text-success border border-success/30" },
};

export function SourceBadge({ source, className }: { source: AnswerSource; className?: string }) {
  const config = CONFIG[source];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 font-normal text-xs", config.className, className)}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}

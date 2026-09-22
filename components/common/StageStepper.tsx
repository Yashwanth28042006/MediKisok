"use client";

import { cn } from "@/lib/utils";
import { UserCheck, MessageCircle, ScanLine, FileText, Stethoscope, Check } from "lucide-react";

const STAGES = [
  { key: "identify", label: "Identify", icon: UserCheck },
  { key: "converse", label: "Converse", icon: MessageCircle },
  { key: "scan", label: "Scan", icon: ScanLine },
  { key: "summarize", label: "Summarize", icon: FileText },
  { key: "consult", label: "Consult", icon: Stethoscope },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export function StageStepper({ current }: { current: StageKey }) {
  const currentIdx = STAGES.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 w-full max-w-2xl mx-auto" aria-label="Progress">
      {STAGES.map((stage, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const Icon = stage.icon;
        return (
          <div key={stage.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center justify-center size-9 sm:size-10 rounded-full border-2 transition-colors",
                  done && "bg-success border-success text-success-foreground",
                  active && "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30",
                  !done && !active && "border-border text-muted-foreground bg-card"
                )}
              >
                {done ? <Check className="size-4" /> : <Icon className="size-4 sm:size-5" />}
              </div>
              <span className={cn("text-[11px] sm:text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                {stage.label}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div className={cn("h-0.5 flex-1 mx-1 sm:mx-2 rounded-full", done ? "bg-success" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { MedicalTimelineEvent, TimelineEventType } from "@/types";
import { SourceBadge } from "@/components/common/SourceBadge";
import { cn } from "@/lib/utils";
import { Stethoscope, Pill, FlaskConical, Scissors, CalendarDays } from "lucide-react";

const TYPE_ICON: Record<TimelineEventType, React.ElementType> = {
  diagnosis: Stethoscope,
  medication: Pill,
  investigation: FlaskConical,
  procedure: Scissors,
  visit: CalendarDays,
};

const TYPE_COLOR: Record<TimelineEventType, string> = {
  diagnosis: "bg-urgent/10 text-urgent",
  medication: "bg-teal/15 text-teal",
  investigation: "bg-warning/20 text-warning-foreground",
  procedure: "bg-accent text-accent-foreground",
  visit: "bg-primary/10 text-primary",
};

const FILTERS: { key: "all" | TimelineEventType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "diagnosis", label: "Diagnosis" },
  { key: "medication", label: "Medication" },
  { key: "investigation", label: "Investigation" },
  { key: "procedure", label: "Procedure" },
  { key: "visit", label: "Visit" },
];

export function Timeline({ events }: { events: MedicalTimelineEvent[] }) {
  const [filter, setFilter] = useState<"all" | TimelineEventType>("all");
  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  if (events.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No timeline events yet.</p>;
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === f.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative space-y-5 pl-8">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
        {filtered.map((event) => {
          const Icon = TYPE_ICON[event.type];
          return (
            <div key={event.id} className="relative">
              <div className={cn("absolute -left-8 flex size-8 items-center justify-center rounded-full ring-4 ring-background", TYPE_COLOR[event.type])}>
                <Icon className="size-4" />
              </div>
              <div className="rounded-xl border bg-card p-3.5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-primary">{event.displayDate}</span>
                  <SourceBadge source={event.source} />
                </div>
                <p className="mt-1 text-sm font-medium">{event.title}</p>
                {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

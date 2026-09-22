"use client";

import { useState } from "react";
import type { ClinicalSummary } from "@/types";
import { SourceBadge } from "@/components/common/SourceBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, Check, X, Sparkles } from "lucide-react";

export function ClinicalSummaryView({
  summary,
  editable = false,
  onEditSection,
}: {
  summary: ClinicalSummary;
  editable?: boolean;
  onEditSection?: (sectionKey: string, content: string) => Promise<void> | void;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (key: string, content: string) => {
    setEditingKey(key);
    setDraft(content);
  };

  const save = async (key: string) => {
    setSaving(true);
    try {
      await onEditSection?.(key, draft);
    } finally {
      setSaving(false);
      setEditingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
        <Sparkles className="size-4 shrink-0 text-warning-foreground" />
        <p className="font-medium text-warning-foreground">AI-Generated Clinical History — Draft, requires clinician verification.</p>
      </div>

      {summary.sections.map((section) => (
        <Card key={section.key}>
          <CardContent className="pt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{section.title}</h3>
              <div className="flex items-center gap-1.5">
                <SourceBadge source={section.source} />
                {editable && editingKey !== section.key && (
                  <button onClick={() => startEdit(section.key, section.content)} className="text-muted-foreground hover:text-foreground">
                    <Pencil className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
            {editingKey === section.key ? (
              <div className="space-y-2">
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1" onClick={() => save(section.key)} disabled={saving}>
                    <Check className="size-3.5" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1" onClick={() => setEditingKey(null)}>
                    <X className="size-3.5" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-line text-sm text-foreground/90">{section.content}</p>
            )}
          </CardContent>
        </Card>
      ))}

      {summary.status === "doctor_confirmed" && summary.verification && (
        <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
          Confirmed by {summary.verification.doctorName} at {new Date(summary.verification.confirmedAt).toLocaleString()}
        </Badge>
      )}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import type { Priority } from "@/types";
import { AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  if (priority === "HIGH") {
    return (
      <Badge className={cn("gap-1 bg-urgent text-urgent-foreground hover:bg-urgent", className)}>
        <AlertTriangle className="size-3" />
        HIGH
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn("gap-1 text-muted-foreground font-normal", className)}>
      <Circle className="size-2 fill-current" />
      Routine
    </Badge>
  );
}

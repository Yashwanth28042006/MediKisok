"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function LoadingState({ messages, className }: { messages: string[]; className?: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIdx((i) => (i + 1) % messages.length), 1400);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className ?? ""}`}>
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground transition-all">{messages[idx]}</p>
    </div>
  );
}

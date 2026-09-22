"use client";

import { useRouter } from "next/navigation";
import { useKioskStore } from "@/lib/store/kioskStore";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LANGUAGE_LABELS } from "@/data/translations";
import { speakText } from "@/hooks/useSpeech";
import { Languages, Volume2, VolumeX, Type, LogOut, Stethoscope } from "lucide-react";
import type { Language } from "@/types";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function KioskHeader({ title, listenText }: { title?: string; listenText?: string }) {
  const { language, setLanguage, textSize, cycleTextSize, audioEnabled, toggleAudio, endSession } = useKioskStore();
  const router = useRouter();
  const [confirmEnd, setConfirmEnd] = useState(false);

  const handleListen = () => {
    if (listenText) speakText(listenText, language);
  };

  const handleEndSession = () => {
    endSession();
    setConfirmEnd(false);
    router.push("/patient/start");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="size-4" />
          </div>
          <span className="hidden sm:inline">{title ?? "MediKiosk"}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {listenText && (
            <Button variant="outline" size="sm" onClick={handleListen} className="gap-1.5">
              <Volume2 className="size-4" />
              <span className="hidden sm:inline">Listen</span>
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={toggleAudio} title="Toggle audio guidance" aria-label="Toggle audio guidance">
            {audioEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={cycleTextSize} title="Change text size" aria-label="Change text size">
            <Type className={textSize === "xlarge" ? "size-5" : textSize === "large" ? "size-4.5" : "size-4"} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Languages className="size-4" />
                <span className="hidden sm:inline">{LANGUAGE_LABELS[language]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)}>
                  {LANGUAGE_LABELS[lang]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={() => setConfirmEnd(true)} title="End session" aria-label="End session">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
      <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End this session?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            For your privacy, ending the session will close this kiosk visit and return to the welcome screen. Any unsaved progress will be lost.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmEnd(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleEndSession}>End Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

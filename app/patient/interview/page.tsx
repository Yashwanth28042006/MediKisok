"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KioskShell } from "@/components/patient/KioskShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useKioskStore } from "@/lib/store/kioskStore";
import { api } from "@/lib/api/client";
import { useSpeechRecognition, speakText } from "@/hooks/useSpeech";
import type { ClinicalQuestion, TriageAlert } from "@/types";
import { Mic, Type as TypeIcon, MousePointerClick, Bot, User, AlertTriangle, Loader2, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Turn {
  role: "assistant" | "patient";
  text: string;
  category?: string;
}

type InputMode = "voice" | "touch" | "text";

function InterviewContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isDemo = params.get("demo") === "1";
  const { encounterId, patientName, language, audioEnabled } = useKioskStore();

  const [question, setQuestion] = useState<ClinicalQuestion | null>(null);
  const [progress, setProgress] = useState({ answeredCount: 0, totalCount: 1 });
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<InputMode>("touch");

  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [severity, setSeverity] = useState([5]);
  const [alertOpen, setAlertOpen] = useState<TriageAlert | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const speech = useSpeechRecognition(language);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!encounterId) {
      router.push("/patient/start");
      return;
    }
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    if (question && audioEnabled) {
      speakText(question.question, language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  async function loadNextQuestion() {
    setLoading(true);
    setSelectedChoices([]);
    setTextAnswer("");
    setSeverity([5]);
    speech.reset();
    try {
      const res = await api.get<{ question: ClinicalQuestion | null; answeredCount: number; totalCount: number; complete: boolean }>(
        `/api/interview/next-question?encounterId=${encounterId}`
      );
      if (res.complete || !res.question) {
        router.push(`/patient/documents${isDemo ? "?demo=1" : ""}`);
        return;
      }
      setQuestion(res.question);
      setProgress({ answeredCount: res.answeredCount, totalCount: res.totalCount });
      setTurns((t) => [...t, { role: "assistant", text: res.question!.question, category: res.question!.category }]);
    } catch {
      toast.error("Could not load the next question. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(answer: string | string[], inputMode: InputMode) {
    if (!question || !encounterId) return;
    setSubmitting(true);
    const displayAnswer = Array.isArray(answer) ? answer.join(", ") : answer;
    setTurns((t) => [...t, { role: "patient", text: displayAnswer || "(skipped)" }]);
    try {
      const res = await api.post<{ newAlerts: TriageAlert[] }>("/api/interview/answer", {
        encounterId,
        questionId: question.id,
        category: question.category,
        question: question.question,
        answer,
        inputMode,
      });
      if (res.newAlerts?.length > 0) {
        setAlertOpen(res.newAlerts[0]);
      }
      await loadNextQuestion();
    } catch {
      toast.error("Could not save your answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleVoiceCapture = () => {
    setMode("voice");
    speech.start();
  };

  const handleVoiceConfirm = () => {
    if (!speech.transcript) return;
    resolveFreeTextAnswer(speech.transcript);
  };

  function resolveFreeTextAnswer(raw: string) {
    if (!question) return;
    if (question.type === "single_choice" || question.type === "body_location") {
      const match = question.options?.find((o) => raw.toLowerCase().includes(o.toLowerCase()));
      submitAnswer(match ?? raw, mode === "voice" ? "voice" : "text");
    } else if (question.type === "multiple_choice") {
      const matches = question.options?.filter((o) => raw.toLowerCase().includes(o.toLowerCase())) ?? [];
      submitAnswer(matches.length > 0 ? matches : [raw], mode === "voice" ? "voice" : "text");
    } else if (question.type === "yes_no") {
      const lower = raw.toLowerCase();
      submitAnswer(lower.includes("no") ? "No" : "Yes", mode === "voice" ? "voice" : "text");
    } else {
      submitAnswer(raw, mode === "voice" ? "voice" : "text");
    }
  }

  if (!question && loading) {
    return (
      <KioskShell stage="converse">
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Preparing your questions...</p>
        </div>
      </KioskShell>
    );
  }

  return (
    <KioskShell stage="converse" listenText={question?.question}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{question?.category === "AYUSH" ? "AYUSH Extended History" : "Clinical Interview"}</span>
          <span>{progress.answeredCount} / {progress.totalCount}</span>
        </div>
        <Progress value={(progress.answeredCount / Math.max(progress.totalCount, 1)) * 100} className="mb-5 h-1.5" />

        <Card className="shadow-md">
          <CardContent className="pt-5">
            <div ref={scrollRef} className="mb-4 max-h-[38vh] space-y-3 overflow-y-auto pr-1">
              {turns.slice(-8).map((turn, i) => (
                <div key={i} className={cn("flex gap-2.5", turn.role === "patient" && "flex-row-reverse")}>
                  <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", turn.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
                    {turn.role === "assistant" ? <Bot className="size-4" /> : <User className="size-4" />}
                  </div>
                  <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm", turn.role === "assistant" ? "rounded-tl-sm bg-muted" : "rounded-tr-sm bg-primary text-primary-foreground")}>
                    {turn.role === "assistant" && turns.indexOf(turn) === 0 && patientName ? `Hello, ${patientName.split(" ")[0]}. ` : ""}
                    {turn.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Understanding your answer...
                </div>
              )}
            </div>

            {question && !loading && (
              <QuestionInput
                key={question.id}
                question={question}
                mode={mode}
                setMode={setMode}
                selectedChoices={selectedChoices}
                setSelectedChoices={setSelectedChoices}
                textAnswer={textAnswer}
                setTextAnswer={setTextAnswer}
                severity={severity}
                setSeverity={setSeverity}
                speech={speech}
                submitting={submitting}
                onSubmitChoice={(val) => submitAnswer(val, "touch")}
                onSubmitMultiple={() => submitAnswer(selectedChoices.length ? selectedChoices : ["None"], "touch")}
                onSubmitText={() => resolveFreeTextAnswer(textAnswer)}
                onSubmitSeverity={() => submitAnswer(String(severity[0]), "touch")}
                onVoiceStart={handleVoiceCapture}
                onVoiceConfirm={handleVoiceConfirm}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!alertOpen} onOpenChange={() => setAlertOpen(null)}>
        <DialogContent className="border-urgent">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-urgent">
              <AlertTriangle className="size-5" /> Priority Review Required
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Based on your answers, your symptoms may require urgent clinical assessment. Please let the reception or triage staff know right away — they have also been notified.
          </p>
          <DialogFooter>
            <Button className="w-full bg-urgent text-urgent-foreground hover:bg-urgent/90" onClick={() => setAlertOpen(null)}>
              I understand, continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </KioskShell>
  );
}

function QuestionInput(props: {
  question: ClinicalQuestion;
  mode: InputMode;
  setMode: (m: InputMode) => void;
  selectedChoices: string[];
  setSelectedChoices: (v: string[]) => void;
  textAnswer: string;
  setTextAnswer: (v: string) => void;
  severity: number[];
  setSeverity: (v: number[]) => void;
  speech: ReturnType<typeof useSpeechRecognition>;
  submitting: boolean;
  onSubmitChoice: (val: string) => void;
  onSubmitMultiple: () => void;
  onSubmitText: () => void;
  onSubmitSeverity: () => void;
  onVoiceStart: () => void;
  onVoiceConfirm: () => void;
}) {
  const { question, mode, setMode } = props;

  const ModeToggle = (
    <div className="mb-3 flex gap-1.5">
      <ModeButton icon={MousePointerClick} label="Tap" active={mode === "touch"} onClick={() => setMode("touch")} />
      <ModeButton icon={Mic} label="Speak" active={mode === "voice"} onClick={() => setMode("voice")} />
      <ModeButton icon={TypeIcon} label="Type" active={mode === "text"} onClick={() => setMode("text")} />
    </div>
  );

  if (mode === "voice") {
    return (
      <div>
        {ModeToggle}
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 py-6">
          <button
            onClick={props.onVoiceStart}
            disabled={props.submitting}
            className={cn(
              "flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95",
              props.speech.state === "listening" && "animate-pulse"
            )}
          >
            <Mic className="size-7" />
          </button>
          <p className="text-sm text-muted-foreground">
            {props.speech.state === "unsupported" && "Voice input isn't supported in this browser. Try Tap or Type instead."}
            {props.speech.state === "idle" && "Tap the microphone and speak your answer."}
            {props.speech.state === "listening" && "Listening..."}
            {props.speech.state === "processing" && "Processing..."}
            {props.speech.state === "error" && "Couldn't hear you clearly. Please try again or use Type."}
          </p>
          {props.speech.transcript && (
            <div className="w-full max-w-sm rounded-lg border bg-card px-3 py-2 text-center text-sm">&ldquo;{props.speech.transcript}&rdquo;</div>
          )}
          {props.speech.transcript && (
            <Button onClick={props.onVoiceConfirm} disabled={props.submitting} className="gap-1.5">
              <SendHorizontal className="size-4" /> Confirm Answer
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (mode === "text") {
    return (
      <div>
        {ModeToggle}
        <div className="flex gap-2">
          <Input
            autoFocus
            placeholder="Type your answer..."
            value={props.textAnswer}
            onChange={(e) => props.setTextAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && props.onSubmitText()}
          />
          <Button onClick={props.onSubmitText} disabled={props.submitting}>Send</Button>
        </div>
      </div>
    );
  }

  // touch mode — rendering depends on question type
  if (question.type === "severity_scale") {
    return (
      <div>
        {ModeToggle}
        <div className="space-y-4 px-1">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Mild</span>
            <span className="text-2xl font-bold text-primary">{props.severity[0]}</span>
            <span>Severe</span>
          </div>
          <Slider min={1} max={10} step={1} value={props.severity} onValueChange={props.setSeverity} />
          <Button className="w-full" onClick={props.onSubmitSeverity} disabled={props.submitting}>Confirm</Button>
        </div>
      </div>
    );
  }

  if (question.type === "yes_no") {
    return (
      <div>
        {ModeToggle}
        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" variant="outline" className="h-14 text-base" disabled={props.submitting} onClick={() => props.onSubmitChoice("Yes")}>Yes</Button>
          <Button size="lg" variant="outline" className="h-14 text-base" disabled={props.submitting} onClick={() => props.onSubmitChoice("No")}>No</Button>
        </div>
      </div>
    );
  }

  if (question.type === "multiple_choice") {
    return (
      <div>
        {ModeToggle}
        <div className="flex flex-wrap gap-2">
          {question.options?.map((opt) => {
            const active = props.selectedChoices.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => {
                  if (opt === "None") { props.setSelectedChoices(["None"]); return; }
                  const next = active ? props.selectedChoices.filter((o) => o !== opt) : [...props.selectedChoices.filter((o) => o !== "None"), opt];
                  props.setSelectedChoices(next);
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <Button className="mt-4 w-full" onClick={props.onSubmitMultiple} disabled={props.submitting}>Continue</Button>
      </div>
    );
  }

  if (question.type === "voice_text") {
    return (
      <div>
        {ModeToggle}
        <div className="flex gap-2">
          <Input
            autoFocus
            placeholder={question.helpText ?? "Your answer..."}
            value={props.textAnswer}
            onChange={(e) => props.setTextAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && props.onSubmitText()}
          />
          <Button onClick={props.onSubmitText} disabled={props.submitting}>Send</Button>
        </div>
        {question.helpText && <p className="mt-1.5 text-xs text-muted-foreground">{question.helpText}</p>}
      </div>
    );
  }

  // single_choice / body_location default
  return (
    <div>
      {ModeToggle}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {question.options?.map((opt) => (
          <button
            key={opt}
            onClick={() => props.onSubmitChoice(opt)}
            disabled={props.submitting}
            className="rounded-xl border bg-card px-3 py-3 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ModeButton({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
      )}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );
}

export default function InterviewPage() {
  return (
    <Suspense>
      <InterviewContent />
    </Suspense>
  );
}

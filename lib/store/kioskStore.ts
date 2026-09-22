"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "@/types";

interface KioskState {
  language: Language;
  textSize: "normal" | "large" | "xlarge";
  audioEnabled: boolean;
  patientId: string | null; // internal DB id
  encounterId: string | null;
  patientName: string | null;
  department: string | null;
  setLanguage: (lang: Language) => void;
  cycleTextSize: () => void;
  toggleAudio: () => void;
  startSession: (data: { patientId: string; encounterId: string; patientName: string; department: string }) => void;
  endSession: () => void;
}

export const useKioskStore = create<KioskState>()(
  persist(
    (set) => ({
      language: "en",
      textSize: "normal",
      audioEnabled: true,
      patientId: null,
      encounterId: null,
      patientName: null,
      department: null,
      setLanguage: (language) => set({ language }),
      cycleTextSize: () =>
        set((s) => ({ textSize: s.textSize === "normal" ? "large" : s.textSize === "large" ? "xlarge" : "normal" })),
      toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
      startSession: (data) => set({ ...data }),
      endSession: () => set({ patientId: null, encounterId: null, patientName: null, department: null }),
    }),
    { name: "medikiosk-session" }
  )
);

// Mock ABHA / ABDM sandbox integration, isolated behind a service interface
// so a real ABDM client can be swapped in later without touching callers.

export interface AbhaService {
  verify(abhaId: string): Promise<{ verified: boolean; name?: string; message: string }>;
  link(patientId: string, abhaId: string): Promise<{ linked: boolean; message: string }>;
  pushHistory(patientId: string, summaryId: string): Promise<{ success: boolean; message: string; referenceId?: string }>;
  fetchPreviousRecords(abhaId: string): Promise<{ records: { title: string; date: string; facility: string }[] }>;
}

function sampleAbha() {
  return "91-2345-6789-0123";
}

export const mockAbhaService: AbhaService = {
  async verify(abhaId: string) {
    await delay(600);
    const valid = /^\d{2}-\d{4}-\d{4}-\d{4}$/.test(abhaId) || abhaId === sampleAbha();
    return {
      verified: valid,
      name: valid ? "Demo Patient" : undefined,
      message: valid ? "ABHA ID verified in ABDM Sandbox." : "ABHA ID format not recognised in sandbox.",
    };
  },
  async link(_patientId: string, abhaId: string) {
    await delay(500);
    return { linked: true, message: `Patient linked to ABHA ${abhaId} (sandbox simulation).` };
  },
  async pushHistory(_patientId: string, summaryId: string) {
    await delay(800);
    return {
      success: true,
      message: "Clinical history pushed to ABDM Sandbox Health Locker (simulation).",
      referenceId: `ABDM-SIM-${summaryId.slice(0, 8).toUpperCase()}`,
    };
  },
  async fetchPreviousRecords() {
    await delay(700);
    return {
      records: [
        { title: "Diabetes management consult note", date: "2025-02-14", facility: "ABC Medical Centre" },
        { title: "Lipid profile report", date: "2025-06-30", facility: "ABC Diagnostics Lab" },
      ],
    };
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

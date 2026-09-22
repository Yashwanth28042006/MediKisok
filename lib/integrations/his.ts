// Mock Hospital HIS/EMR integration via a FHIR-like adapter, isolated
// behind a service interface for future replacement with a real HL7 FHIR
// client.

export interface HisService {
  pushClinicalHistory(payload: unknown): Promise<{ success: boolean; message: string; transactionId?: string }>;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockHisService: HisService = {
  async pushClinicalHistory() {
    await delay(900);
    return {
      success: true,
      message: "Clinical history successfully transmitted to Demo HIS.",
      transactionId: `HIS-DEMO-${Date.now().toString().slice(-8)}`,
    };
  },
};

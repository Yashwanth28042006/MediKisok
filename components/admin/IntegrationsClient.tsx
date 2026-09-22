"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { DEMO_ABHA_SAMPLE } from "@/lib/constants";
import { ShieldCheck, Link2, Download, Send, WifiOff, ArrowDown, Server, Database } from "lucide-react";
import { toast } from "sonner";
import type { IntegrationEvent } from "@/types";

interface EncounterOption { id: string; label: string; patientId: string }

export function IntegrationsClient({ encounterOptions, initialEvents }: { encounterOptions: EncounterOption[]; initialEvents: IntegrationEvent[] }) {
  const [abhaId, setAbhaId] = useState(DEMO_ABHA_SAMPLE);
  const [lastResponse, setLastResponse] = useState<{ action: string; payload: unknown } | null>(null);
  const [events, setEvents] = useState(initialEvents);
  const [selectedEncounter, setSelectedEncounter] = useState(encounterOptions[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);

  const refreshEvents = async () => {
    const { events } = await api.get<{ events: IntegrationEvent[] }>("/api/admin/integration-events");
    setEvents(events);
  };

  async function run(action: string, fn: () => Promise<unknown>) {
    setBusy(action);
    try {
      const res = await fn();
      setLastResponse({ action, payload: res });
      toast.success(`${action} completed`);
      await refreshEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setBusy(null);
    }
  }

  const encounter = encounterOptions.find((e) => e.id === selectedEncounter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Integrations</h1>
        <p className="text-sm text-muted-foreground">ABDM Sandbox Simulation and Demo HIS/EMR — no real external connectivity.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> ABHA Connection</span>
              <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning-foreground">Prototype / Sandbox</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>ABHA ID</Label>
              <Input value={abhaId} onChange={(e) => setAbhaId(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={busy !== null} className="gap-1.5" onClick={() => run("Verify ABHA", () => api.post("/api/mock-abha/verify", { abhaId }))}>
                <ShieldCheck className="size-3.5" /> Verify ABHA
              </Button>
              <Button size="sm" variant="outline" disabled={busy !== null} className="gap-1.5" onClick={() => run("Link Patient", () => api.post("/api/mock-abha/link", { patientId: encounter?.patientId, abhaId }))}>
                <Link2 className="size-3.5" /> Link Patient
              </Button>
              <Button size="sm" variant="outline" disabled={busy !== null} className="gap-1.5" onClick={() => run("Fetch Previous Records", () => api.post("/api/mock-abha/fetch-records", { abhaId }))}>
                <Download className="size-3.5" /> Fetch Previous Records
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Sample ABHA: {DEMO_ABHA_SAMPLE}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><Server className="size-4 text-teal" /> Hospital HIS / EMR</span>
              <Badge variant="outline" className="border-success/40 bg-success/10 text-success">Connected – Demo Mode</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2 rounded-xl border bg-muted/30 py-4 text-xs font-medium text-muted-foreground">
              <span className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-primary">MediKiosk</span>
              <ArrowDown className="size-3.5 -rotate-90" />
              <span className="rounded-lg bg-teal/10 px-2.5 py-1.5 text-teal">FHIR Adapter</span>
              <ArrowDown className="size-3.5 -rotate-90" />
              <span className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-accent-foreground"><Database className="size-3.5" /> HIS / EMR</span>
            </div>
            <div className="space-y-1.5">
              <Label>Select patient encounter</Label>
              <Select value={selectedEncounter} onValueChange={setSelectedEncounter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {encounterOptions.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={busy !== null || !selectedEncounter} className="gap-1.5" onClick={() => run("Push Clinical History", () => api.post("/api/mock-his/push", { encounterId: selectedEncounter }))}>
                <Send className="size-3.5" /> Push Clinical History
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-urgent" disabled={busy !== null || !selectedEncounter} onClick={() => run("Push Clinical History (unavailable)", () => api.post("/api/mock-his/push", { encounterId: selectedEncounter, simulateUnavailable: true }))}>
                <WifiOff className="size-3.5" /> Simulate HIS Unavailable
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {lastResponse && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Last Response — {lastResponse.action}</CardTitle></CardHeader>
          <CardContent>
            <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(lastResponse.payload, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Integration Event Log</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Time</TableHead><TableHead>System</TableHead><TableHead>Action</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 15).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline" className="font-normal">{e.system}</Badge></TableCell>
                    <TableCell className="text-sm">{e.action}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={e.status === "success" ? "border-success/40 bg-success/10 text-success" : "border-urgent/40 bg-urgent/10 text-urgent"}>
                        {e.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {events.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No integration events yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

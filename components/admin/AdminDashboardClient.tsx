"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Users, CheckCircle2, Clock3, AlertTriangle, FileStack, Languages } from "lucide-react";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#2f5aa1", "#3f8f96", "#3fa672", "#d9a441", "#c14343", "#7c6fb0"];

interface AdminStats {
  patientsToday: number;
  historyCompleted: number;
  currentlyWaiting: number;
  priorityAlerts: number;
  avgIntakeSeconds: number;
  complaintCounts: Record<string, number>;
  departmentCounts: Record<string, number>;
  languageCounts: Record<string, number>;
  documentsProcessed: number;
  integrationEventsCount: number;
}

const LANGUAGE_NAMES: Record<string, string> = { en: "English", ta: "Tamil", hi: "Hindi" };

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export function AdminDashboardClient({ stats }: { stats: AdminStats }) {
  const deptData = Object.entries(stats.departmentCounts).map(([name, value]) => ({ name, value }));
  const complaintData = Object.entries(stats.complaintCounts).map(([name, value]) => ({ name, value }));
  const langData = Object.entries(stats.languageCounts).map(([code, value]) => ({ name: LANGUAGE_NAMES[code] ?? code, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Hospital-wide OPD intake overview. Demo data for illustration only.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={Users} label="Patients Today" value={stats.patientsToday} />
        <StatTile icon={CheckCircle2} label="History Completed" value={stats.historyCompleted} tone="success" />
        <StatTile icon={Clock3} label="Currently Waiting" value={stats.currentlyWaiting} />
        <StatTile icon={AlertTriangle} label="Priority Alerts" value={stats.priorityAlerts} tone="urgent" />
        <StatTile icon={Clock3} label="Avg. Intake" value={fmtDuration(stats.avgIntakeSeconds)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Department Volume">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptData} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {deptData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most Common Complaints">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={complaintData} margin={{ left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {complaintData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Languages Selected">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={langData} margin={{ left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40} fill={CHART_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Documents & Integrations">
          <div className="flex h-[220px] flex-col justify-center gap-5 px-2">
            <MetricRow icon={FileStack} label="Documents Processed" value={stats.documentsProcessed} />
            <MetricRow icon={Languages} label="Integration Events Logged" value={stats.integrationEventsCount} />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string | number; tone?: "success" | "urgent" }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5">
        <div className={cn("flex size-10 items-center justify-center rounded-xl", tone === "urgent" ? "bg-urgent/10 text-urgent" : tone === "success" ? "bg-success/10 text-success" : "bg-primary/10 text-primary")}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xl font-bold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function MetricRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" /></div>
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

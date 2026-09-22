import { requireRole } from "@/lib/auth/requireRole";
import { computeAdminStats } from "@/lib/admin/getStats";
import { StaffShell } from "@/components/common/StaffShell";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEPARTMENTS } from "@/lib/constants";
import { LANGUAGE_LABELS } from "@/data/translations";
import { getDb } from "@/lib/db/store";
import { Building2, Users, Languages } from "lucide-react";

export default async function AdminPage() {
  const session = await requireRole(["admin"]);
  const stats = computeAdminStats();
  const users = getDb().users;

  return (
    <StaffShell role="admin" userName={session.name}>
      <div className="space-y-6">
        <AdminDashboardClient stats={stats} />

        <div className="grid gap-5 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Building2 className="size-4" /> Departments</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.map((d) => <Badge key={d} variant="outline" className="font-normal">{d}</Badge>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Users className="size-4" /> Staff Users</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <span>{u.name}</span>
                  <Badge variant="outline" className="font-normal capitalize">{u.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Languages className="size-4" /> Language Options</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                <Badge key={code} variant="outline" className="font-normal">{label}</Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffShell>
  );
}

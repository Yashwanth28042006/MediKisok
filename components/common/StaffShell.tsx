"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Stethoscope, LogOut, LayoutDashboard, AlertTriangle, Plug } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Role } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

function getNavItems(role: Role, priorityCount?: number): NavItem[] {
  switch (role) {
    case "doctor":
      return [
        { href: "/doctor", label: "Dashboard", icon: LayoutDashboard },
        { href: "/doctor?priority=HIGH", label: "Priority Cases", icon: AlertTriangle, badge: priorityCount },
        { href: "/admin/integrations", label: "Integrations", icon: Plug },
      ];
    case "triage":
      return [
        { href: "/triage", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/integrations", label: "Integrations", icon: Plug },
      ];
    case "admin":
      return [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/integrations", label: "Integrations", icon: Plug },
      ];
    default:
      return [];
  }
}

const ROLE_LABEL: Record<Role, string> = {
  patient: "Patient",
  kiosk: "Reception / Kiosk",
  triage: "Triage Staff",
  doctor: "Doctor",
  admin: "Administrator",
};

export function StaffShell({
  role,
  priorityCount,
  userName,
  children,
}: {
  role: Role;
  priorityCount?: number;
  userName: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const navItems = getNavItems(role, priorityCount);

  const handleLogout = async () => {
    await api.post("/api/auth/logout");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card sm:flex">
        <div className="flex items-center gap-2 px-5 py-5 font-semibold text-primary">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="size-4" />
          </div>
          MediKiosk
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href.split("?")[0] && !item.href.includes("?");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4" /> {item.label}
                </span>
                {item.badge ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-urgent text-[10px] font-bold text-urgent-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <div className="mb-2 px-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{userName}</p>
            <p>{ROLE_LABEL[role]}</p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-5 py-3 sm:hidden">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <Stethoscope className="size-4" /> MediKiosk
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="size-4" /></Button>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

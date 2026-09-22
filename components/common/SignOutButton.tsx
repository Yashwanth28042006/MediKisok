"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { LogOut } from "lucide-react";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await api.post("/api/auth/logout");
    router.push("/login");
  };

  return (
    <Button variant="ghost" size="sm" className={className} onClick={handleSignOut} disabled={loading}>
      <LogOut className="size-4" />
      {loading ? "Signing out..." : "Sign out"}
    </Button>
  );
}

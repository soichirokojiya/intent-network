"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { AuthScreen } from "./AuthScreen";

const PUBLIC_PATHS = ["/terms", "/privacy"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Allow public pages without auth
  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}

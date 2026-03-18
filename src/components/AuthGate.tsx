"use client";

import { useAuth } from "@/context/AuthContext";
import { AuthScreen } from "./AuthScreen";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const PUBLIC_PATHS = ["/terms", "/privacy", "/lp", "/contact"];

export function AuthGate({ children, publicChildren }: { children: React.ReactNode; publicChildren: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isPublic, setIsPublic] = useState(false);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsPublic(PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p)));
    setChecked(true);
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  // Public pages: render without sidebar/nav
  if (isPublic) return <>{publicChildren}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  // Unauthenticated users at root → redirect to LP
  if (!user) {
    if (window.location.pathname === "/") {
      router.replace("/lp");
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="text-[var(--muted)]">Loading...</div>
        </div>
      );
    }
    return <AuthScreen />;
  }

  return <>{children}</>;
}

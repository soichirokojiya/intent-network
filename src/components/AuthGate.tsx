"use client";

import { useAuth } from "@/context/AuthContext";
import { AuthScreen } from "./AuthScreen";
import { useState, useEffect } from "react";

const PUBLIC_PATHS = ["/terms", "/privacy"];

export function AuthGate({ children, publicChildren }: { children: React.ReactNode; publicChildren: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isPublic, setIsPublic] = useState(false);
  const [checked, setChecked] = useState(false);

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

  if (!user) return <AuthScreen />;

  return <>{children}</>;
}

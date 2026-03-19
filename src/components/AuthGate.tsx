"use client";

import { useAuth } from "@/context/AuthContext";
import { AuthScreen } from "./AuthScreen";
import { usePathname } from "next/navigation";
import { LandingContent } from "./LandingContent";

const PUBLIC_PATHS = ["/terms", "/privacy", "/lp", "/contact"];

export function AuthGate({ children, publicChildren }: { children: React.ReactNode; publicChildren: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Public pages: render without sidebar/nav
  if (isPublic) return <>{publicChildren}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  // Unauthenticated → show auth screen
  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}

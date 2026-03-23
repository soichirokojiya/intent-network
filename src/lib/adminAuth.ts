import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "./serverAuth";

/**
 * Check if the authenticated user is an admin.
 * Uses Supabase Auth (via middleware) + ADMIN_USER_ID env var.
 */
export function checkAdmin(req: NextRequest): { isAdmin: boolean; userId: string | null } {
  const userId = getVerifiedUserId(req);
  if (!userId) return { isAdmin: false, userId: null };

  const adminUserIds = (process.env.ADMIN_USER_ID || "").split(",").map((s) => s.trim()).filter(Boolean);
  return { isAdmin: adminUserIds.includes(userId), userId };
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  const { isAdmin } = checkAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "./serverAuth";

/**
 * Check if the authenticated user is an admin.
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const userId = getVerifiedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminUserIds = (process.env.ADMIN_USER_ID || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!adminUserIds.includes(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

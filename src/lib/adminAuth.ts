import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getVerifiedUserId } from "./serverAuth";

/**
 * Get user ID from middleware header OR directly from Supabase Auth cookies.
 * Fallback for when middleware doesn't run (Next.js 16 deprecation).
 */
async function getUserId(req: NextRequest): Promise<string | null> {
  // Try middleware header first
  const fromMiddleware = getVerifiedUserId(req);
  if (fromMiddleware) return fromMiddleware;

  // Fallback: read Supabase Auth cookies directly
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll() {},
        },
      },
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Check if the authenticated user is an admin.
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminUserIds = (process.env.ADMIN_USER_ID || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!adminUserIds.includes(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * サーバーサイドでSupabase Authセッションからuser.idを取得する。
 * 認証されていない場合はnullを返す。
 *
 * 使い方:
 *   const userId = await getAuthUserId(req);
 *   if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

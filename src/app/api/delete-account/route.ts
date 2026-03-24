import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Rate limit: max 1 request per IP per 10 minutes
const rateLimitMap = new Map<string, number>();

export async function POST(req: NextRequest) {
  // SECURITY: Only the authenticated user can delete their own account
  const verifiedUserId = getVerifiedUserId(req);
  if (!verifiedUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const last = rateLimitMap.get(ip) || 0;
  if (now - last < 10 * 60 * 1000) {
    return NextResponse.json({ error: "しばらく時間をおいてから再度お試しください。" }, { status: 429 });
  }
  rateLimitMap.set(ip, now);

  // Use the verified user ID — ignore any userId/deviceId from the body
  const userId = verifiedUserId;
  const supabaseAdmin = getSupabaseAdmin();

  // Delete all user data from tables
  await supabaseAdmin.from("owner_agents").delete().eq("device_id", userId);
  await supabaseAdmin.from("owner_chats").delete().eq("device_id", userId);
  await supabaseAdmin.from("project_rooms").delete().eq("device_id", userId);
  await supabaseAdmin.from("chat_messages").delete().eq("user_id", userId);
  await supabaseAdmin.from("activity_log").delete().eq("user_id", userId);
  await supabaseAdmin.from("profiles").delete().eq("id", userId);

  // Delete auth user
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

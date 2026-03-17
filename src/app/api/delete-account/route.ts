import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { userId, deviceId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  // Delete all user data from tables
  await supabaseAdmin.from("owner_agents").delete().eq("device_id", deviceId);
  await supabaseAdmin.from("owner_chats").delete().eq("device_id", deviceId);
  await supabaseAdmin.from("chat_messages").delete().eq("user_id", userId);
  await supabaseAdmin.from("activity_log").delete().eq("user_id", userId);
  await supabaseAdmin.from("intents").delete().eq("user_id", userId);
  await supabaseAdmin.from("reactions").delete().eq("user_id", userId);
  await supabaseAdmin.from("profiles").delete().eq("id", userId);

  // Delete auth user
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

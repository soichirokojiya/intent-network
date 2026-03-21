import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { deviceId, token } = await req.json();
  if (!deviceId || !token) {
    return NextResponse.json({ error: "deviceId and token required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      trello_token: token,
      trello_connected: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deviceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

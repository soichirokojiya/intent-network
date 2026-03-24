import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId = getVerifiedUserId(req) || body.deviceId;
  if (!deviceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({
      meta_user_token: null,
      meta_page_id: null,
      meta_page_token: null,
      meta_page_name: null,
      meta_ig_business_id: null,
      meta_connected: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deviceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

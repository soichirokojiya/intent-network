import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { deviceId, userId, email, reason, comment } = await req.json();

  await supabase.from("churn_surveys").insert({
    device_id: deviceId || null,
    user_id: userId || null,
    email: email || null,
    reason: reason || null,
    comment: comment || null,
  });

  return NextResponse.json({ ok: true });
}

// GET: List all churn surveys (admin only)
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("churn_surveys")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ surveys: data || [] });
}

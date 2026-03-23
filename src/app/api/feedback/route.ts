import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// POST: Save feedback response
export async function POST(req: NextRequest) {
  const body = await req.json();
  const deviceId = getVerifiedUserId(req) || body.deviceId;
  if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { triggerType, question, answer } = body;
  if (!triggerType || !answer) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  await supabase.from("feedback_responses").insert({
    device_id: deviceId,
    trigger_type: triggerType,
    question,
    answer,
  });

  return NextResponse.json({ ok: true });
}

// GET: List feedback (admin only)
export async function GET(req: NextRequest) {
  const { requireAdmin } = await import("@/lib/adminAuth");
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { data } = await supabase
    .from("feedback_responses")
    .select("*, profiles:device_id(display_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  return NextResponse.json({ responses: data || [] });
}

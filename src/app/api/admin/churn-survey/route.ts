import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";
import { getVerifiedUserId } from "@/lib/serverAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// POST: Submit churn survey (authenticated users only)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = getVerifiedUserId(req) || body.deviceId;

  await supabase.from("churn_surveys").insert({
    device_id: userId || null,
    user_id: userId || null,
    email: body.email || null,
    reason: body.reason || null,
    comment: body.comment || null,
  });

  return NextResponse.json({ ok: true });
}

// GET: List all churn surveys (admin only)
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { data } = await supabase
    .from("churn_surveys")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ surveys: data || [] });
}

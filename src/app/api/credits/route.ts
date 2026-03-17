import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });

  const { data } = await supabase
    .from("user_credits")
    .select("balance_yen")
    .eq("device_id", deviceId)
    .single();

  if (!data) {
    // Create initial ¥1,000 credit
    await supabase.from("user_credits").insert({
      device_id: deviceId,
      balance_yen: 1000,
    });
    return NextResponse.json({ balance: 1000 });
  }

  return NextResponse.json({ balance: Number(data.balance_yen) });
}

export async function POST(req: NextRequest) {
  const { deviceId, inputTokens, outputTokens, costYen, model, apiRoute } = await req.json();
  if (!deviceId || costYen === undefined) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Check balance
  const { data: credit } = await supabase
    .from("user_credits")
    .select("balance_yen, total_used_yen")
    .eq("device_id", deviceId)
    .single();

  if (!credit || Number(credit.balance_yen) < costYen) {
    return NextResponse.json({ error: "insufficient_balance", balance: Number(credit?.balance_yen || 0) }, { status: 402 });
  }

  const newBalance = Math.round((Number(credit.balance_yen) - costYen) * 1000) / 1000;
  const newUsed = Math.round((Number(credit.total_used_yen) + costYen) * 1000) / 1000;

  // Deduct and log
  await supabase
    .from("user_credits")
    .update({ balance_yen: newBalance, total_used_yen: newUsed, updated_at: new Date().toISOString() })
    .eq("device_id", deviceId);

  await supabase.from("usage_log").insert({
    device_id: deviceId,
    input_tokens: inputTokens || 0,
    output_tokens: outputTokens || 0,
    cost_yen: costYen,
    model: model || "unknown",
    api_route: apiRoute || "unknown",
  });

  return NextResponse.json({ balance: newBalance });
}

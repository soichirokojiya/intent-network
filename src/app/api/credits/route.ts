import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const deviceId = getVerifiedUserId(req);
  if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_credits")
    .select("balance_yen, total_used_yen, total_charged_yen")
    .eq("device_id", deviceId)
    .single();

  if (!data) {
    // Get initial credit from site_settings
    let initialCredit = 1000;
    try {
      const { data: setting } = await supabase.from("site_settings").select("value").eq("key", "initial_credit_yen").single();
      if (setting?.value) initialCredit = Number(setting.value) || 1000;
    } catch {}
    await supabase.from("user_credits").insert({
      device_id: deviceId,
      user_id: deviceId,
      balance_yen: initialCredit,
    });
    return NextResponse.json({ balance: initialCredit, totalUsed: 0, totalCharged: 0, totalInputTokens: 0, totalOutputTokens: 0 });
  }

  // Get total tokens used (exclude charge entries)
  const { data: usageData } = await supabase
    .from("usage_log")
    .select("input_tokens, output_tokens")
    .eq("device_id", deviceId)
    .neq("model", "charge");

  const totalInputTokens = usageData?.reduce((sum, r) => sum + (r.input_tokens || 0), 0) || 0;
  const totalOutputTokens = usageData?.reduce((sum, r) => sum + (r.output_tokens || 0), 0) || 0;

  // Monthly breakdown (exclude charge entries)
  const { data: monthlyData } = await supabase
    .from("usage_log")
    .select("cost_yen, input_tokens, output_tokens, created_at")
    .eq("device_id", deviceId)
    .neq("model", "charge")
    .order("created_at", { ascending: false });

  const monthlyMap: Record<string, { cost: number; input: number; output: number; count: number }> = {};
  (monthlyData || []).forEach((row) => {
    const month = new Date(row.created_at).toISOString().slice(0, 7); // "2026-03"
    if (!monthlyMap[month]) monthlyMap[month] = { cost: 0, input: 0, output: 0, count: 0 };
    monthlyMap[month].cost += Number(row.cost_yen);
    monthlyMap[month].input += row.input_tokens || 0;
    monthlyMap[month].output += row.output_tokens || 0;
    monthlyMap[month].count += 1;
  });

  const monthly = Object.entries(monthlyMap).map(([month, d]) => ({
    month, cost: Math.round(d.cost * 100) / 100, inputTokens: d.input, outputTokens: d.output, count: d.count,
  }));

  return NextResponse.json({
    balance: Number(data.balance_yen),
    totalUsed: Number(data.total_used_yen),
    totalCharged: Number(data.total_charged_yen),
    totalInputTokens,
    totalOutputTokens,
    monthly,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const deviceId = getVerifiedUserId(req) || body.deviceId;
  if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inputTokens, outputTokens, costYen, model, apiRoute } = body;
  if (costYen === undefined) {
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
    user_id: deviceId,
    input_tokens: inputTokens || 0,
    output_tokens: outputTokens || 0,
    cost_yen: costYen,
    model: model || "unknown",
    api_route: apiRoute || "unknown",
  });

  return NextResponse.json({ balance: newBalance });
}

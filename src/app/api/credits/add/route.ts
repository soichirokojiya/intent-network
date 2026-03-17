import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { deviceId, amount } = await req.json();
  if (!deviceId || !amount) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { data: credit } = await supabase
    .from("user_credits")
    .select("balance_yen, total_charged_yen")
    .eq("device_id", deviceId)
    .single();

  if (credit) {
    const newBalance = Number(credit.balance_yen) + amount;
    const newCharged = Number(credit.total_charged_yen) + amount;
    await supabase
      .from("user_credits")
      .update({ balance_yen: newBalance, total_charged_yen: newCharged, updated_at: new Date().toISOString() })
      .eq("device_id", deviceId);
    return NextResponse.json({ balance: newBalance });
  } else {
    await supabase.from("user_credits").insert({
      device_id: deviceId,
      balance_yen: 1000 + amount,
      total_charged_yen: amount,
    });
    return NextResponse.json({ balance: 1000 + amount });
  }
}

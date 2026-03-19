import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  // Verify with Stripe via fetch (not SDK)
  let session;
  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    });
    if (!res.ok) return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    session = await res.json();
  } catch {
    return NextResponse.json({ error: "Stripe connection failed" }, { status: 500 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
  }

  const deviceId = session.metadata?.deviceId;
  const amount = Number(session.metadata?.amount || 0);

  if (!deviceId || !amount) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  // Check if already processed
  const { data: existingLog } = await supabase
    .from("usage_log")
    .select("id")
    .eq("api_route", `charge-${sessionId}`)
    .limit(1);

  if (existingLog && existingLog.length > 0) {
    const { data: credit } = await supabase.from("user_credits").select("balance_yen").eq("device_id", deviceId).single();
    return NextResponse.json({ balance: Number(credit?.balance_yen || 0), already: true });
  }

  // Add credit
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

    await supabase.from("usage_log").insert({
      device_id: deviceId, user_id: deviceId, input_tokens: 0, output_tokens: 0,
      cost_yen: -amount, model: "charge", api_route: `charge-${sessionId}`,
    });

    return NextResponse.json({ balance: newBalance });
  } else {
    await supabase.from("user_credits").insert({
      device_id: deviceId, user_id: deviceId, balance_yen: 1000 + amount, total_charged_yen: amount,
    });
    return NextResponse.json({ balance: 1000 + amount });
  }
}

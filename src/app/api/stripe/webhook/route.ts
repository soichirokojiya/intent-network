import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const deviceId = session.metadata?.deviceId;
    const amount = Number(session.metadata?.amount || 0);

    if (deviceId && amount > 0) {
      // Add credit to user
      const { data: credit } = await supabase
        .from("user_credits")
        .select("balance_yen, total_charged_yen")
        .eq("device_id", deviceId)
        .single();

      if (credit) {
        await supabase
          .from("user_credits")
          .update({
            balance_yen: Number(credit.balance_yen) + amount,
            total_charged_yen: Number(credit.total_charged_yen) + amount,
            updated_at: new Date().toISOString(),
          })
          .eq("device_id", deviceId);
      } else {
        await supabase.from("user_credits").insert({
          device_id: deviceId,
          balance_yen: 1000 + amount,
          total_charged_yen: amount,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}

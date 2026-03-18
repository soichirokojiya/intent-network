import { NextRequest, NextResponse } from "next/server";

const CHARGE_AMOUNTS = [1000, 3000, 5000, 10000];

export async function POST(req: NextRequest) {
  try {
    const { amount, deviceId } = await req.json();

    if (!CHARGE_AMOUNTS.includes(amount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const origin = req.nextUrl.origin;

    // Use fetch directly instead of Stripe SDK to avoid connection issues
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "payment",
        "line_items[0][price_data][currency]": "jpy",
        "line_items[0][price_data][unit_amount]": String(amount),
        "line_items[0][price_data][product_data][name]": `musu クレジット ¥${amount.toLocaleString()}`,
        "line_items[0][price_data][product_data][description]": "musu.world AIエージェントの利用クレジット",
        "line_items[0][quantity]": "1",
        "success_url": `${origin}/charge?session_id={CHECKOUT_SESSION_ID}`,
        "cancel_url": `${origin}/charge?canceled=1`,
        "metadata[deviceId]": deviceId || "",
        "metadata[amount]": String(amount),
      }).toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || "Stripe error" }, { status: 500 });
    }

    return NextResponse.json({ url: data.url });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Stripe checkout error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

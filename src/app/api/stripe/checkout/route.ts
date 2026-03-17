import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const CHARGE_AMOUNTS = [1000, 3000, 5000, 10000];

export async function POST(req: NextRequest) {
  try {
    const { amount, deviceId } = await req.json();

    if (!CHARGE_AMOUNTS.includes(amount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "jpy",
          product_data: {
            name: `musu クレジット ¥${amount.toLocaleString()}`,
            description: "musu.world AIエージェントの利用クレジット",
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${req.nextUrl.origin}/charge?success=1&amount=${amount}`,
      cancel_url: `${req.nextUrl.origin}/charge?canceled=1`,
      metadata: { deviceId, amount: String(amount) },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}

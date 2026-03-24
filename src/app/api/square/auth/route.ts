import { NextRequest, NextResponse } from "next/server";
import { createOAuthState } from "@/lib/oauthState";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const clientId = process.env.SQUARE_APP_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Square OAuth not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "PAYMENTS_READ ORDERS_READ ITEMS_READ MERCHANT_PROFILE_READ",
    session: "false",
    state: createOAuthState({ deviceId }),
  });

  return NextResponse.redirect(`https://connect.squareup.com/oauth2/authorize?${params.toString()}`);
}

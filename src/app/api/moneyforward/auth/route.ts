import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const clientId = process.env.MF_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "MoneyForward OAuth not configured" }, { status: 500 });
  }

  const redirectUri = "https://musu.world/api/moneyforward/callback";
  const scope = "mfc/admin/tenant.read";
  const state = deviceId;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    state,
  });

  return NextResponse.redirect(`https://api.biz.moneyforward.com/authorize?${params.toString()}`);
}

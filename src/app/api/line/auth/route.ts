import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const clientId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || process.env.LINE_CHANNEL_ID;
  if (!clientId) {
    return NextResponse.json({ error: "LINE OAuth not configured" }, { status: 500 });
  }

  const redirectUri = "https://musu.world/api/line/callback";
  const scope = "profile openid";
  const state = deviceId;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    state,
  });

  return NextResponse.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`);
}

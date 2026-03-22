import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const clientId = process.env.FREEE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "freee OAuth not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: "https://musu.world/api/freee/callback",
    state: deviceId,
  });

  return NextResponse.redirect(`https://accounts.secure.freee.co.jp/public_api/authorize?${params.toString()}`);
}

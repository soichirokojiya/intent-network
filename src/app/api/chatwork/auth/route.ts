import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const clientId = process.env.CHATWORK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Chatwork OAuth not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: "https://musu.world/api/chatwork/callback",
    scope: "rooms.all:read_write users.all:read offline_access",
    state: deviceId,
  });

  return NextResponse.redirect(`https://www.chatwork.com/packages/oauth2/login.php?${params.toString()}`);
}

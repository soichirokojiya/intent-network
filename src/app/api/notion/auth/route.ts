import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Notion OAuth not configured" }, { status: 500 });
  }

  const redirectUri = "https://musu.world/api/notion/callback";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    owner: "user",
    state: deviceId,
  });

  return NextResponse.redirect(`https://api.notion.com/v1/oauth/authorize?${params.toString()}`);
}

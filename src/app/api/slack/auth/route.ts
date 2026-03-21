import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Slack OAuth not configured" }, { status: 500 });
  }

  const redirectUri = "https://musu.world/api/slack/callback";
  const scope = "channels:history,channels:read,chat:write,users:read";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state: deviceId,
  });

  return NextResponse.redirect(`https://slack.com/oauth/v2/authorize?${params.toString()}`);
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const apiKey = process.env.TRELLO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Trello API key not configured" }, { status: 500 });
  }

  const callbackUrl = "https://musu.world/integrations/trello-callback";

  const params = new URLSearchParams({
    response_type: "token",
    key: apiKey,
    return_url: callbackUrl,
    callback_method: "fragment",
    scope: "read",
    expiration: "never",
    name: "musu.world",
  });

  return NextResponse.redirect(`https://trello.com/1/authorize?${params.toString()}`);
}

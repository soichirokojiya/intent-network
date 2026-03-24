import { NextRequest, NextResponse } from "next/server";
import { createOAuthState } from "@/lib/oauthState";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const clientId = process.env.META_APP_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Meta OAuth not configured" }, { status: 500 });
  }

  const state = createOAuthState({ deviceId });
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://musu.world"}/api/meta/callback`;
  const scope = "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    state,
  });

  return NextResponse.redirect(`https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`);
}

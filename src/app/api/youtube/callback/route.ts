import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyOAuthState } from "@/lib/oauthState";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/integrations?youtube=error", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?youtube=error", req.url));
  }

  const stateData = verifyOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect(new URL("/integrations?error=invalid_state", req.url));
  }
  const deviceId = stateData.deviceId as string;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "https://musu.world"}/api/youtube/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      console.error("YouTube token exchange failed:", tokens);
      return NextResponse.redirect(new URL("/integrations?youtube=error", req.url));
    }

    // Get channel info
    let channelName = null;
    let channelId = null;
    try {
      const channelRes = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      );
      const channelData = await channelRes.json();
      const channel = channelData.items?.[0];
      if (channel) {
        channelName = channel.snippet?.title || null;
        channelId = channel.id || null;
      }
    } catch {}

    // Save to profiles
    const supabase = getSupabase();
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        youtube_access_token: tokens.access_token,
        youtube_refresh_token: tokens.refresh_token || null,
        youtube_channel_id: channelId,
        youtube_channel_name: channelName,
        youtube_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (dbError) {
      console.error("Failed to save YouTube tokens:", dbError);
      return NextResponse.redirect(new URL("/integrations?youtube=error", req.url));
    }

    return NextResponse.redirect(new URL("/integrations?youtube=connected", req.url));
  } catch (err) {
    console.error("YouTube callback error:", err);
    return NextResponse.redirect(new URL("/integrations?youtube=error", req.url));
  }
}

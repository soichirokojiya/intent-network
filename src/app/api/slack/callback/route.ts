import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state"); // deviceId
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/integrations?slack=error", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?slack=error", req.url));
  }

  const deviceId = state;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        redirect_uri: "https://musu.world/api/slack/callback",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.ok || !tokens.access_token) {
      console.error("Slack token exchange failed:", tokens);
      return NextResponse.redirect(new URL("/integrations?slack=error", req.url));
    }

    // Save tokens to profiles table (deviceId = user id)
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        slack_access_token: tokens.access_token,
        slack_connected: true,
        slack_team_name: tokens.team?.name || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (dbError) {
      console.error("Failed to save Slack tokens:", dbError);
      return NextResponse.redirect(new URL("/integrations?slack=error", req.url));
    }

    return NextResponse.redirect(new URL("/integrations?slack=connected", req.url));
  } catch (err) {
    console.error("Slack callback error:", err);
    return NextResponse.redirect(new URL("/integrations?slack=error", req.url));
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyOAuthState } from "@/lib/oauthState";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state"); // deviceId
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/integrations?square=error", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?square=error", req.url));
  }

  const stateData = verifyOAuthState(state || "");
  if (!stateData) {
    return NextResponse.redirect(new URL("/integrations?error=invalid_state", req.url));
  }
  const deviceId = stateData.deviceId as string;

  try {
    // Exchange code for tokens (Square uses JSON body, NOT form-urlencoded)
    const tokenRes = await fetch("https://connect.squareup.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        client_id: process.env.SQUARE_APP_ID!,
        client_secret: process.env.SQUARE_OAUTH_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://musu.world/api/square/callback",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      console.error("Square token exchange failed:", tokens);
      return NextResponse.redirect(new URL("/integrations?square=error", req.url));
    }

    // Save tokens to profiles table (deviceId = user id)
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        square_token: tokens.access_token,
        square_refresh_token: tokens.refresh_token || null,
        square_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (dbError) {
      console.error("Failed to save Square tokens:", dbError);
      return NextResponse.redirect(new URL("/integrations?square=error", req.url));
    }

    return NextResponse.redirect(new URL("/integrations?square=connected", req.url));
  } catch (err) {
    console.error("Square callback error:", err);
    return NextResponse.redirect(new URL("/integrations?square=error", req.url));
  }
}

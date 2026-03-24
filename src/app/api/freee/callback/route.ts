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
    return NextResponse.redirect(new URL("/integrations?freee=error", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?freee=error", req.url));
  }

  const stateData = verifyOAuthState(state || "");
  if (!stateData) {
    return NextResponse.redirect(new URL("/integrations?error=invalid_state", req.url));
  }
  const deviceId = stateData.deviceId as string;

  try {
    // Exchange code for tokens (freee uses client_id/secret in body, NOT Basic Auth)
    const tokenRes = await fetch("https://accounts.secure.freee.co.jp/public_api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.FREEE_CLIENT_ID!,
        client_secret: process.env.FREEE_CLIENT_SECRET!,
        code,
        redirect_uri: "https://musu.world/api/freee/callback",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      console.error("freee token exchange failed:", tokens);
      return NextResponse.redirect(new URL("/integrations?freee=error", req.url));
    }

    // Save tokens to profiles table (deviceId = user id)
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        freee_token: tokens.access_token,
        freee_refresh_token: tokens.refresh_token || null,
        freee_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (dbError) {
      console.error("Failed to save freee tokens:", dbError);
      return NextResponse.redirect(new URL("/integrations?freee=error", req.url));
    }

    return NextResponse.redirect(new URL("/integrations?freee=connected", req.url));
  } catch (err) {
    console.error("freee callback error:", err);
    return NextResponse.redirect(new URL("/integrations?freee=error", req.url));
  }
}

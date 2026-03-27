import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyOAuthState } from "@/lib/oauthState";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/integrations?moneyforward=error", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?moneyforward=error", req.url));
  }

  const stateData = verifyOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect(new URL("/integrations?error=invalid_state", req.url));
  }
  const deviceId = stateData.deviceId as string;

  try {
    // Exchange code for tokens (CLIENT_SECRET_POST: client_id/secret in body)
    const tokenRes = await fetch("https://api.biz.moneyforward.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.MF_CLIENT_ID!,
        client_secret: process.env.MF_CLIENT_SECRET!,
        code,
        redirect_uri: "https://musu.world/api/moneyforward/callback",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      console.error("MoneyForward token exchange failed:", tokens);
      return NextResponse.redirect(new URL("/integrations?moneyforward=error", req.url));
    }

    // Save tokens to profiles table
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        mf_token: tokens.access_token,
        mf_refresh_token: tokens.refresh_token || null,
        mf_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (dbError) {
      console.error("Failed to save MoneyForward tokens:", dbError);
      return NextResponse.redirect(new URL("/integrations?moneyforward=error", req.url));
    }

    return NextResponse.redirect(new URL("/integrations?moneyforward=connected", req.url));
  } catch (err) {
    console.error("MoneyForward callback error:", err);
    return NextResponse.redirect(new URL("/integrations?moneyforward=error", req.url));
  }
}

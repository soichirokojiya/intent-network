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
    return NextResponse.redirect(new URL("/integrations?chatwork=error", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?chatwork=error", req.url));
  }

  const stateData = verifyOAuthState(state || "");
  if (!stateData) {
    return NextResponse.redirect(new URL("/integrations?error=invalid_state", req.url));
  }
  const deviceId = stateData.deviceId as string;

  try {
    // Exchange code for tokens (Chatwork uses Basic Auth)
    const tokenRes = await fetch("https://oauth.chatwork.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${process.env.CHATWORK_CLIENT_ID}:${process.env.CHATWORK_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://musu.world/api/chatwork/callback",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      console.error("Chatwork token exchange failed:", JSON.stringify(tokens), "status:", tokenRes.status);
      return NextResponse.redirect(new URL(`/integrations?chatwork=error&detail=${encodeURIComponent(JSON.stringify(tokens))}`, req.url));
    }

    // Save tokens to profiles table (deviceId = user id)
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        chatwork_token: tokens.access_token,
        chatwork_refresh_token: tokens.refresh_token || null,
        chatwork_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (dbError) {
      console.error("Failed to save Chatwork tokens:", dbError);
      return NextResponse.redirect(new URL("/integrations?chatwork=error", req.url));
    }

    return NextResponse.redirect(new URL("/integrations?chatwork=connected", req.url));
  } catch (err) {
    console.error("Chatwork callback error:", err);
    return NextResponse.redirect(new URL("/integrations?chatwork=error", req.url));
  }
}

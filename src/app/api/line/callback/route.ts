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
    return NextResponse.redirect(new URL("/integrations?line=error", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?line=error", req.url));
  }

  const stateData = verifyOAuthState(state || "");
  if (!stateData) {
    return NextResponse.redirect(new URL("/integrations?error=invalid_state", req.url));
  }
  const deviceId = stateData.deviceId as string;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || process.env.LINE_CHANNEL_ID || "",
        client_secret: process.env.LINE_CHANNEL_SECRET!,
        redirect_uri: "https://musu.world/api/line/callback",
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      console.error("LINE token exchange failed:", tokens);
      return NextResponse.redirect(new URL("/integrations?line=error", req.url));
    }

    // Fetch user profile
    let displayName: string | null = null;
    try {
      const profileRes = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileRes.json();
      displayName = profile.displayName || null;
    } catch (profileErr) {
      console.error("Failed to fetch LINE profile:", profileErr);
    }

    // Save tokens to profiles table (deviceId = user id)
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        line_access_token: tokens.access_token,
        line_refresh_token: tokens.refresh_token || null,
        line_connected: true,
        line_display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (dbError) {
      console.error("Failed to save LINE tokens:", dbError);
      return NextResponse.redirect(new URL("/integrations?line=error", req.url));
    }

    return NextResponse.redirect(new URL("/integrations?line=connected", req.url));
  } catch (err) {
    console.error("LINE callback error:", err);
    return NextResponse.redirect(new URL("/integrations?line=error", req.url));
  }
}

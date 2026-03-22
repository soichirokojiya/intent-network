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
    return NextResponse.redirect(new URL("/integrations?sheets=error", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?sheets=error", req.url));
  }

  const deviceId = state;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: "https://musu.world/api/google-sheets/callback",
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      console.error("Google Sheets token exchange failed:", tokens);
      return NextResponse.redirect(new URL("/integrations?sheets=error", req.url));
    }

    // Save tokens to profiles table (deviceId = user id)
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        google_sheets_token: tokens.access_token,
        google_sheets_refresh_token: tokens.refresh_token || null,
        google_sheets_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (dbError) {
      console.error("Failed to save Google Sheets tokens:", dbError);
      return NextResponse.redirect(new URL("/integrations?sheets=error", req.url));
    }

    return NextResponse.redirect(new URL("/integrations?sheets=connected", req.url));
  } catch (err) {
    console.error("Google Sheets callback error:", err);
    return NextResponse.redirect(new URL("/integrations?sheets=error", req.url));
  }
}

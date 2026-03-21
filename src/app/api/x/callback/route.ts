import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/integrations?x=error", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?x=error", req.url));
  }

  // Decode state to get deviceId and codeVerifier
  let deviceId: string;
  let codeVerifier: string;
  try {
    const stateData = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8"),
    );
    deviceId = stateData.deviceId;
    codeVerifier = stateData.codeVerifier;
  } catch {
    return NextResponse.redirect(new URL("/integrations?x=error", req.url));
  }

  try {
    const clientId = process.env.X_CLIENT_ID!;
    const clientSecret = process.env.X_CLIENT_SECRET!;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    // Exchange code for tokens
    const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: "https://musu.world/api/x/callback",
        code_verifier: codeVerifier,
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      console.error("X token exchange failed:", tokens);
      return NextResponse.redirect(new URL("/integrations?x=error", req.url));
    }

    // Save tokens to profiles table
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        x_access_token: tokens.access_token,
        x_refresh_token: tokens.refresh_token || null,
        x_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (dbError) {
      console.error("Failed to save X tokens:", dbError);
      return NextResponse.redirect(new URL("/integrations?x=error", req.url));
    }

    return NextResponse.redirect(
      new URL("/integrations?x=connected", req.url),
    );
  } catch (err) {
    console.error("X callback error:", err);
    return NextResponse.redirect(new URL("/integrations?x=error", req.url));
  }
}

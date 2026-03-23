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

  // Decode state to get deviceId, codeVerifier, and optional agentId
  let deviceId: string;
  let codeVerifier: string;
  let agentId: string | null = null;
  try {
    const stateData = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8"),
    );
    deviceId = stateData.deviceId;
    codeVerifier = stateData.codeVerifier;
    agentId = stateData.agentId || null;
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
      const errorRedirect = agentId ? `/agent?id=${agentId}&x=error` : "/integrations?x=error";
      return NextResponse.redirect(new URL(errorRedirect, req.url));
    }

    // Fetch the X username
    let xUsername = "";
    try {
      const meRes = await fetch("https://api.x.com/2/users/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const meData = await meRes.json();
      xUsername = meData.data?.username || "";
    } catch {
      // Non-fatal: proceed without username
    }

    if (agentId) {
      // Save tokens to owner_agents table (per-agent X account)
      const { error: dbError } = await supabase
        .from("owner_agents")
        .update({
          x_access_token: tokens.access_token,
          x_refresh_token: tokens.refresh_token || null,
          x_username: xUsername,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agentId)
        .eq("device_id", deviceId);

      if (dbError) {
        console.error("Failed to save X tokens to agent:", dbError);
        return NextResponse.redirect(new URL(`/agent?id=${agentId}&x=error`, req.url));
      }

      // Also update config.twitterEnabled and twitterUsername
      const { data: agent } = await supabase
        .from("owner_agents")
        .select("config")
        .eq("id", agentId)
        .single();

      if (agent?.config) {
        const updatedConfig = {
          ...agent.config,
          twitterEnabled: true,
          twitterUsername: xUsername,
        };
        await supabase
          .from("owner_agents")
          .update({ config: updatedConfig })
          .eq("id", agentId);
      }

      return NextResponse.redirect(
        new URL(`/agent?id=${agentId}&x=connected`, req.url),
      );
    } else {
      // Legacy: Save tokens to profiles table (user-level)
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
    }
  } catch (err) {
    console.error("X callback error:", err);
    const errorRedirect = agentId ? `/agent?id=${agentId}&x=error` : "/integrations?x=error";
    return NextResponse.redirect(new URL(errorRedirect, req.url));
  }
}

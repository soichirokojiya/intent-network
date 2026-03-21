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
    return NextResponse.redirect(new URL("/integrations?notion=error", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?notion=error", req.url));
  }

  const deviceId = state;

  try {
    // Notion uses Basic auth: base64(client_id:client_secret)
    const credentials = Buffer.from(
      `${process.env.NOTION_CLIENT_ID!}:${process.env.NOTION_CLIENT_SECRET!}`,
    ).toString("base64");

    // Exchange code for token
    const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://musu.world/api/notion/callback",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      console.error("Notion token exchange failed:", tokens);
      return NextResponse.redirect(new URL("/integrations?notion=error", req.url));
    }

    // Save token to profiles table (deviceId = user id)
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        notion_token: tokens.access_token,
        notion_connected: true,
        notion_workspace_name: tokens.workspace_name || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (dbError) {
      console.error("Failed to save Notion tokens:", dbError);
      return NextResponse.redirect(new URL("/integrations?notion=error", req.url));
    }

    return NextResponse.redirect(new URL("/integrations?notion=connected", req.url));
  } catch (err) {
    console.error("Notion callback error:", err);
    return NextResponse.redirect(new URL("/integrations?notion=error", req.url));
  }
}

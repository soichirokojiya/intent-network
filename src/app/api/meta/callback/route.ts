import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyOAuthState } from "@/lib/oauthState";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const GRAPH_API = "https://graph.facebook.com/v21.0";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/integrations?meta=error", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?meta=error", req.url));
  }

  const stateData = verifyOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect(new URL("/integrations?error=invalid_state", req.url));
  }
  const deviceId = stateData.deviceId as string;

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://musu.world"}/api/meta/callback`;

  try {
    // 1. Exchange code for short-lived user token
    const tokenRes = await fetch(
      `${GRAPH_API}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Meta token exchange failed:", tokenData);
      return NextResponse.redirect(new URL("/integrations?meta=error", req.url));
    }

    // 2. Exchange for long-lived user token
    const longLivedRes = await fetch(
      `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`,
    );
    const longLivedData = await longLivedRes.json();
    const userToken = longLivedData.access_token || tokenData.access_token;

    // 3. Get Pages the user manages (page tokens from long-lived user token never expire)
    const pagesRes = await fetch(`${GRAPH_API}/me/accounts?access_token=${userToken}`);
    const pagesData = await pagesRes.json();

    const page = pagesData.data?.[0]; // Use the first page
    if (!page) {
      console.error("No Facebook Pages found for user");
      return NextResponse.redirect(new URL("/integrations?meta=no_page", req.url));
    }

    // 4. Get Instagram Business Account linked to the page
    let igBusinessId: string | null = null;
    try {
      const igRes = await fetch(
        `${GRAPH_API}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
      );
      const igData = await igRes.json();
      igBusinessId = igData.instagram_business_account?.id || null;
    } catch {}

    // 5. Save to profiles
    const supabase = getSupabase();
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        meta_user_token: userToken,
        meta_page_id: page.id,
        meta_page_token: page.access_token,
        meta_page_name: page.name || null,
        meta_ig_business_id: igBusinessId,
        meta_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (dbError) {
      console.error("Failed to save Meta tokens:", dbError);
      return NextResponse.redirect(new URL("/integrations?meta=error", req.url));
    }

    return NextResponse.redirect(new URL("/integrations?meta=connected", req.url));
  } catch (err) {
    console.error("Meta callback error:", err);
    return NextResponse.redirect(new URL("/integrations?meta=error", req.url));
  }
}

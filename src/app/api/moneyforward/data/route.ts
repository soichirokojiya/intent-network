import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.moneyforward.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MF_CLIENT_ID!,
        client_secret: process.env.MF_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  // Get stored tokens
  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("mf_access_token, mf_refresh_token, mf_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.mf_connected) {
    return NextResponse.json({ transactions: [], connected: false });
  }

  let accessToken = profile.mf_access_token;

  // Fetch recent transactions
  let res = await fetch("https://api.moneyforward.com/api/v1/user_assets", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // If 401, try refresh
  if (res.status === 401 && profile.mf_refresh_token) {
    const newToken = await refreshAccessToken(profile.mf_refresh_token);
    if (newToken) {
      accessToken = newToken;
      await supabase
        .from("profiles")
        .update({ mf_access_token: newToken, updated_at: new Date().toISOString() })
        .eq("id", deviceId);

      res = await fetch("https://api.moneyforward.com/api/v1/user_assets", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      await supabase
        .from("profiles")
        .update({ mf_connected: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
    }
    return NextResponse.json({ transactions: [], connected: false });
  }

  const data = await res.json();
  const assets = (data.user_assets || []).map((a: { asset_class_name?: string; name?: string; value?: number; updated_at?: string }) => ({
    category: a.asset_class_name || "",
    name: a.name || "",
    value: a.value || 0,
    updatedAt: a.updated_at || "",
  }));

  return NextResponse.json({ assets, connected: true });
}

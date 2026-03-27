import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/serverAuth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Generic MoneyForward API proxy
 * Called by agent-respond tools to access MF Cloud Accounting API
 *
 * POST body: { path, method?, params?, deviceId }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const deviceId = getVerifiedUserId(req) || body.deviceId;
  if (!deviceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path, method = "GET", params } = body;
  if (!path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  // Get MF token
  const { data: profile } = await supabase
    .from("profiles")
    .select("mf_token, mf_refresh_token")
    .eq("id", deviceId)
    .single();

  if (!profile?.mf_token) {
    return NextResponse.json({ error: "マネーフォワード未連携です。設定→アプリ連携から連携してください。" }, { status: 401 });
  }

  let token = profile.mf_token;

  // Build MF API URL
  const url = new URL(path, "https://api-accounting.moneyforward.com");
  if (method === "GET" && params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (method !== "GET" && params) {
    fetchOptions.body = JSON.stringify(params);
  }

  let res = await fetch(url.toString(), fetchOptions);

  // Token refresh on 401
  if (res.status === 401 && profile.mf_refresh_token) {
    const refreshRes = await fetch("https://api.biz.moneyforward.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.MF_CLIENT_ID!,
        client_secret: process.env.MF_CLIENT_SECRET!,
        refresh_token: profile.mf_refresh_token,
      }),
    });
    const refreshData = await refreshRes.json();
    if (refreshData.access_token) {
      token = refreshData.access_token;
      await supabase
        .from("profiles")
        .update({
          mf_token: token,
          mf_refresh_token: refreshData.refresh_token || profile.mf_refresh_token,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceId);

      // Retry with new token
      fetchOptions.headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      res = await fetch(url.toString(), fetchOptions);
    }
  }

  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  return NextResponse.json(data, { status: res.status });
}

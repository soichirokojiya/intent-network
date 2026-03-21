import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
  try {
    const res = await fetch("https://accounts.secure.freee.co.jp/public_api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.FREEE_CLIENT_ID!,
        client_secret: process.env.FREEE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    if (!data.access_token) return null;
    return { access_token: data.access_token, refresh_token: data.refresh_token || refreshToken };
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
    .select("freee_access_token, freee_refresh_token, freee_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.freee_connected) {
    return NextResponse.json({ companies: [], deals: [], connected: false });
  }

  let accessToken = profile.freee_access_token;

  // Fetch companies
  let companiesRes = await fetch("https://api.freee.co.jp/api/1/companies", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // If 401, try refresh
  if (companiesRes.status === 401 && profile.freee_refresh_token) {
    const newTokens = await refreshAccessToken(profile.freee_refresh_token);
    if (newTokens) {
      accessToken = newTokens.access_token;
      // Save new tokens
      await supabase
        .from("profiles")
        .update({
          freee_access_token: newTokens.access_token,
          freee_refresh_token: newTokens.refresh_token,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceId);

      companiesRes = await fetch("https://api.freee.co.jp/api/1/companies", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  }

  if (!companiesRes.ok) {
    // Token is invalid, mark as disconnected
    if (companiesRes.status === 401) {
      await supabase
        .from("profiles")
        .update({ freee_connected: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
    }
    return NextResponse.json({ companies: [], deals: [], connected: false });
  }

  const companiesData = await companiesRes.json();
  const companies = companiesData.companies || [];

  // Fetch deals for the first company
  let deals: unknown[] = [];
  if (companies.length > 0) {
    const companyId = companies[0].id;
    const dealsParams = new URLSearchParams({
      company_id: String(companyId),
      limit: "20",
      order: "desc",
    });

    const dealsRes = await fetch(
      `https://api.freee.co.jp/api/1/deals?${dealsParams}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (dealsRes.ok) {
      const dealsData = await dealsRes.json();
      deals = dealsData.deals || [];
    }
  }

  return NextResponse.json({ companies, deals, connected: true });
}

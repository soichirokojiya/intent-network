import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function refreshToken(refreshTokenValue: string): Promise<string | null> {
  const res = await fetch("https://accounts.secure.freee.co.jp/public_api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.FREEE_CLIENT_ID!,
      client_secret: process.env.FREEE_CLIENT_SECRET!,
      refresh_token: refreshTokenValue,
    }),
  });
  const data = await res.json();
  return data.access_token || null;
}

async function freeeFetch(
  url: string,
  accessToken: string,
  deviceId: string,
  refreshTokenValue: string | null,
): Promise<{ data: unknown; newToken: string | null }> {
  let res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // If 401, try refreshing the token
  if (res.status === 401 && refreshTokenValue) {
    const newToken = await refreshToken(refreshTokenValue);
    if (newToken) {
      // Save new token
      await supabase
        .from("profiles")
        .update({ freee_token: newToken, updated_at: new Date().toISOString() })
        .eq("id", deviceId);

      res = await fetch(url, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      return { data: await res.json(), newToken };
    }
  }

  return { data: await res.json(), newToken: null };
}

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  // Get stored tokens
  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("freee_token, freee_refresh_token, freee_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.freee_connected) {
    return NextResponse.json({ companies: [], connected: false });
  }

  const accessToken = profile.freee_token;
  const freeeRefreshToken = profile.freee_refresh_token;

  // List companies
  const { data: companiesData } = await freeeFetch(
    "https://api.freee.co.jp/api/1/companies",
    accessToken,
    deviceId,
    freeeRefreshToken,
  );

  const result = companiesData as { companies?: { id: number; name: string; display_name: string }[] } | null;

  if (!result?.companies || !Array.isArray(result.companies)) {
    // Token is invalid, mark as disconnected
    await supabase
      .from("profiles")
      .update({ freee_connected: false, updated_at: new Date().toISOString() })
      .eq("id", deviceId);
    return NextResponse.json({ companies: [], connected: false });
  }

  const companies = result.companies.map((c) => ({
    id: c.id,
    name: c.name,
    display_name: c.display_name,
  }));

  return NextResponse.json({ companies, connected: true });
}

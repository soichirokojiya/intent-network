import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function refreshToken(refreshTokenValue: string): Promise<string | null> {
  const res = await fetch("https://connect.squareup.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Square-Version": "2024-01-18",
    },
    body: JSON.stringify({
      client_id: process.env.SQUARE_APP_ID!,
      client_secret: process.env.SQUARE_OAUTH_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshTokenValue,
    }),
  });
  const data = await res.json();
  return data.access_token || null;
}

async function squareFetch(
  url: string,
  accessToken: string,
  deviceId: string,
  refreshTokenValue: string | null,
): Promise<{ data: unknown; newToken: string | null }> {
  let res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-01-18",
    },
  });

  // If 401, try refreshing the token
  if (res.status === 401 && refreshTokenValue) {
    const newToken = await refreshToken(refreshTokenValue);
    if (newToken) {
      // Save new token
      await supabase
        .from("profiles")
        .update({ square_token: newToken, updated_at: new Date().toISOString() })
        .eq("id", deviceId);

      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${newToken}`,
          "Square-Version": "2024-01-18",
        },
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
    .select("square_token, square_refresh_token, square_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.square_connected) {
    return NextResponse.json({ merchant: null, payments: [], connected: false });
  }

  const accessToken = profile.square_token;
  const squareRefreshToken = profile.square_refresh_token;

  // Fetch merchant info
  const { data: merchantData } = await squareFetch(
    "https://connect.squareupapis.com/v2/merchants/me",
    accessToken,
    deviceId,
    squareRefreshToken,
  );

  const merchantResult = merchantData as { merchant?: { id: string; business_name: string; country: string } } | null;

  if (!merchantResult?.merchant) {
    // Token is invalid, mark as disconnected
    await supabase
      .from("profiles")
      .update({ square_connected: false, updated_at: new Date().toISOString() })
      .eq("id", deviceId);
    return NextResponse.json({ merchant: null, payments: [], connected: false });
  }

  // Fetch recent payments
  const { data: paymentsData } = await squareFetch(
    "https://connect.squareupapis.com/v2/payments?sort_order=DESC&limit=10",
    accessToken,
    deviceId,
    squareRefreshToken,
  );

  const paymentsResult = paymentsData as { payments?: unknown[] } | null;

  return NextResponse.json({
    merchant: merchantResult.merchant,
    payments: paymentsResult?.payments || [],
    connected: true,
  });
}

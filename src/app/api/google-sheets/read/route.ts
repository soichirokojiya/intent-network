import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const deviceId = getVerifiedUserId(req) || body.deviceId;
  if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { spreadsheetId, range } = body;
  if (!spreadsheetId || !range) {
    return NextResponse.json({ error: "spreadsheetId and range required" }, { status: 400 });
  }

  // Get stored tokens
  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("google_sheets_token, google_sheets_refresh_token, google_sheets_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.google_sheets_connected) {
    return NextResponse.json({ error: "Google Sheets not connected" }, { status: 401 });
  }

  let accessToken = profile.google_sheets_token;

  // Fetch spreadsheet values
  let apiRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  // If 401, try refresh
  if (apiRes.status === 401 && profile.google_sheets_refresh_token) {
    const newToken = await refreshAccessToken(profile.google_sheets_refresh_token);
    if (newToken) {
      accessToken = newToken;
      // Save new access token
      await supabase
        .from("profiles")
        .update({ google_sheets_token: newToken, updated_at: new Date().toISOString() })
        .eq("id", deviceId);

      apiRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    }
  }

  if (!apiRes.ok) {
    // Token is invalid, mark as disconnected
    if (apiRes.status === 401) {
      await supabase
        .from("profiles")
        .update({ google_sheets_connected: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
    }
    const errData = await apiRes.json().catch(() => ({}));
    return NextResponse.json({ error: "Failed to read spreadsheet", details: errData }, { status: apiRes.status });
  }

  const data = await apiRes.json();
  return NextResponse.json({ values: data.values || [], range: data.range });
}

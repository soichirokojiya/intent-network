import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// POST: Create a new spreadsheet
export async function POST(req: NextRequest) {
  const { deviceId, title, sheetNames } = await req.json();
  if (!deviceId || !title) {
    return NextResponse.json({ error: "deviceId and title required" }, { status: 400 });
  }

  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("google_sheets_token, google_sheets_refresh_token, google_sheets_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.google_sheets_connected) {
    return NextResponse.json({ error: "Google Sheets not connected" }, { status: 401 });
  }

  let accessToken = profile.google_sheets_token;

  const sheets = (sheetNames || ["Sheet1"]).map((name: string) => ({
    properties: { title: name },
  }));

  const body = JSON.stringify({
    properties: { title },
    sheets,
  });

  async function createSheet(token: string) {
    return fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
    });
  }

  let apiRes = await createSheet(accessToken);

  if (apiRes.status === 401 && profile.google_sheets_refresh_token) {
    const newToken = await refreshAccessToken(profile.google_sheets_refresh_token);
    if (newToken) {
      accessToken = newToken;
      await supabase
        .from("profiles")
        .update({ google_sheets_token: newToken, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
      apiRes = await createSheet(accessToken);
    }
  }

  if (!apiRes.ok) {
    if (apiRes.status === 401) {
      await supabase
        .from("profiles")
        .update({ google_sheets_connected: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
    }
    const errData = await apiRes.json().catch(() => ({}));
    return NextResponse.json({ error: "Failed to create spreadsheet", details: errData }, { status: apiRes.status });
  }

  const data = await apiRes.json();
  return NextResponse.json({
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    title: data.properties?.title,
  });
}

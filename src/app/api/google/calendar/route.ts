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

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  // Get stored tokens
  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token, google_calendar_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.google_calendar_connected) {
    return NextResponse.json({ events: [], connected: false });
  }

  let accessToken = profile.google_access_token;

  // Build time range for today (JST)
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffset);
  const todayStart = new Date(Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate()) - jstOffset);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const calendarParams = new URLSearchParams({
    timeMin: todayStart.toISOString(),
    timeMax: todayEnd.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "20",
  });

  // Fetch events
  let calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${calendarParams}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  // If 401, try refresh
  if (calRes.status === 401 && profile.google_refresh_token) {
    const newToken = await refreshAccessToken(profile.google_refresh_token);
    if (newToken) {
      accessToken = newToken;
      // Save new access token
      await supabase
        .from("profiles")
        .update({ google_access_token: newToken, updated_at: new Date().toISOString() })
        .eq("id", deviceId);

      calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${calendarParams}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    }
  }

  if (!calRes.ok) {
    // Token is invalid, mark as disconnected
    if (calRes.status === 401) {
      await supabase
        .from("profiles")
        .update({ google_calendar_connected: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
    }
    return NextResponse.json({ events: [], connected: false });
  }

  const calData = await calRes.json();
  const events = (calData.items || []).map((e: { summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; location?: string }) => ({
    title: e.summary || "(no title)",
    start: e.start?.dateTime || e.start?.date || "",
    end: e.end?.dateTime || e.end?.date || "",
    location: e.location || "",
  }));

  return NextResponse.json({ events, connected: true });
}

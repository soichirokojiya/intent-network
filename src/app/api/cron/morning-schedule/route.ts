import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

async function fetchTodayEvents(profile: {
  id: string;
  google_access_token: string;
  google_refresh_token: string | null;
}): Promise<{ title: string; start: string; end: string; location: string }[]> {
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

  let calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${calendarParams}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  // If 401, try refresh
  if (calRes.status === 401 && profile.google_refresh_token) {
    const newToken = await refreshAccessToken(profile.google_refresh_token);
    if (newToken) {
      accessToken = newToken;
      await supabase
        .from("profiles")
        .update({ google_access_token: newToken, updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${calendarParams}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    }
  }

  if (!calRes.ok) {
    if (calRes.status === 401) {
      await supabase
        .from("profiles")
        .update({ google_calendar_connected: false, updated_at: new Date().toISOString() })
        .eq("id", profile.id);
    }
    return [];
  }

  const calData = await calRes.json();
  return (calData.items || []).map((e: { summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; location?: string }) => ({
    title: e.summary || "(タイトルなし)",
    start: e.start?.dateTime || e.start?.date || "",
    end: e.end?.dateTime || e.end?.date || "",
    location: e.location || "",
  }));
}

function formatScheduleMessage(events: { title: string; start: string; end: string; location: string }[]): string {
  if (events.length === 0) {
    return "おはようございます。今日は予定がありません。集中して作業できる日ですね。";
  }

  const eventLines = events.map((e) => {
    const startTime = e.start
      ? (e.start.includes("T")
        ? new Date(e.start).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })
        : "終日")
      : "終日";
    const loc = e.location ? ` (${e.location})` : "";
    return `${startTime} ${e.title}${loc}`;
  });

  return `おはようございます。今日の予定です。\n\n${eventLines.join("\n")}`;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, google_access_token, google_refresh_token, google_calendar_connected, schedule_delivery_enabled")
      .eq("google_calendar_connected", true)
      .eq("schedule_delivery_enabled", true);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ processed: 0, total: 0 });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        const deviceId = profile.id;

        // Find user's agents
        const { data: agents } = await supabase
          .from("owner_agents")
          .select("id, config")
          .eq("device_id", deviceId)
          .limit(10);

        if (!agents || agents.length === 0) continue;

        // Prefer secretary agent as sender
        const senderAgent = agents.find((a) =>
          (a.config?.role || "").match(/秘書|secretary/i)
        ) || agents[0];

        // Fetch today's events directly from Google Calendar API
        const events = await fetchTodayEvents(profile);
        const messageText = formatScheduleMessage(events);

        await supabase.from("owner_chats").insert({
          device_id: deviceId,
          user_id: deviceId,
          room_id: "general",
          type: "agent",
          agent_name: senderAgent.config?.name || "Sora",
          agent_avatar: senderAgent.config?.avatar || "",
          agent_id: senderAgent.id,
          text: messageText,
        });

        processed++;
      } catch (err) {
        errors.push(`${profile.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({ processed, total: profiles.length, errors: errors.length > 0 ? errors : undefined });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

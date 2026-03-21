import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/anthropicClient";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get("pw");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find any user with Google Calendar connected (ignore schedule_delivery_enabled for test)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, business_info, google_access_token, google_refresh_token, google_calendar_connected")
    .eq("google_calendar_connected", true)
    .limit(1);

  if (!profiles?.length) {
    return NextResponse.json({ error: "No profiles with Google Calendar", profiles: [] });
  }

  const profile = profiles[0];

  // Find agents
  const { data: agents } = await supabase
    .from("owner_agents")
    .select("id, config")
    .eq("device_id", profile.id)
    .limit(10);

  if (!agents?.length) {
    return NextResponse.json({ error: "No agents found" });
  }

  const secretary = agents.find((a) => /秘書|secretary/i.test(a.config?.role || ""));
  const sender = secretary || agents[0];

  // Fetch today's events
  let accessToken = profile.google_access_token;
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

  if (calRes.status === 401 && profile.google_refresh_token) {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: profile.google_refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      accessToken = tokenData.access_token;
      await supabase.from("profiles").update({ google_access_token: accessToken }).eq("id", profile.id);
      calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${calendarParams}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    }
  }

  const calData = await calRes.json();
  const events = (calData.items || []).map((e: { summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; location?: string }) => ({
    title: e.summary || "(タイトルなし)",
    start: e.start?.dateTime || e.start?.date || "",
    end: e.end?.dateTime || e.end?.date || "",
    location: e.location || "",
  }));

  const eventLines = events.length === 0
    ? "予定はありません。"
    : events.map((e: { title: string; start: string; location: string }) => {
        const st = e.start.includes("T")
          ? new Date(e.start).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })
          : "終日";
        return `${st} ${e.title}${e.location ? ` (${e.location})` : ""}`;
      }).join("\n");

  const todayStr = now.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" });

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `あなたは秘書です。今日の予定確認です。\n\n今日（${todayStr}）の予定:\n${eventLines}\n\n事業情報: ${profile.business_info || "なし"}\n\nプレーンテキストのみ。Markdown禁止。\n1. 挨拶（1文）\n2. 今日の予定一覧\n3. 有用な指摘（1-3個）：準備物、移動時間、予定間隔、空き時間の活用など`,
    }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const messageText = textBlock ? (textBlock as { type: "text"; text: string }).text : eventLines;

  await supabase.from("owner_chats").insert({
    device_id: profile.id,
    user_id: profile.id,
    room_id: "general",
    type: "agent",
    agent_name: sender.config?.name || "Mio",
    agent_avatar: sender.config?.avatar || "",
    agent_id: sender.id,
    text: messageText,
  });

  return NextResponse.json({ ok: true, sender: sender.config?.name, events: events.length, message: messageText });
}

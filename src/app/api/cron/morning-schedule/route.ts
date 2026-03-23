import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/anthropicClient";
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

async function fetchEvents(profile: {
  id: string;
  google_access_token: string;
  google_refresh_token: string | null;
}, dayOffset: number = 0): Promise<{ title: string; start: string; end: string; location: string }[]> {
  let accessToken = profile.google_access_token;

  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffset);
  const targetDate = new Date(Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate() + dayOffset) - jstOffset);
  const targetEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

  const calendarParams = new URLSearchParams({
    timeMin: targetDate.toISOString(),
    timeMax: targetEnd.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "20",
  });

  let calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${calendarParams}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

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

function formatEventList(events: { title: string; start: string; end: string; location: string }[]): string {
  if (events.length === 0) return "予定はありません。";
  return events.map((e) => {
    const startTime = e.start
      ? (e.start.includes("T")
        ? new Date(e.start).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })
        : "終日")
      : "終日";
    const endTime = e.end && e.end.includes("T")
      ? new Date(e.end).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })
      : "";
    const loc = e.location ? ` (${e.location})` : "";
    return `${startTime}${endTime ? "〜" + endTime : ""} ${e.title}${loc}`;
  }).join("\n");
}

async function generateScheduleMessage(
  todayEvents: { title: string; start: string; end: string; location: string }[],
  tomorrowEvents: { title: string; start: string; end: string; location: string }[],
  businessInfo: string,
  isEvening: boolean
): Promise<{ text: string; usage: { input_tokens: number; output_tokens: number } | null }> {
  const todayList = formatEventList(todayEvents);
  const tomorrowList = formatEventList(tomorrowEvents);

  const now = new Date();
  const todayStr = now.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" });
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" });

  const prompt = isEvening
    ? `あなたは秘書です。夜の予定確認として、明日の予定を伝えてください。

明日（${tomorrowStr}）の予定:
${tomorrowList}

事業情報: ${businessInfo || "なし"}

以下の形式でプレーンテキストのみで出力してください。Markdown禁止。

1. 挨拶（「お疲れさまでした」など夜向け、1文）
2. 明日の予定一覧（時間・タイトル・場所）
3. 有用な指摘（1-3個）。例：
   - 準備が必要なもの（資料、持ち物など）
   - 移動時間の注意
   - 予定の間隔が短い場合の警告
   - 早朝の予定がある場合の注意
予定がない場合は「明日は予定がありません。ゆっくり休んでください。」`
    : `あなたは秘書です。朝の予定確認として、今日の予定を伝えてください。

今日（${todayStr}）の予定:
${todayList}

事業情報: ${businessInfo || "なし"}

以下の形式でプレーンテキストのみで出力してください。Markdown禁止。

1. 挨拶（「おはようございます」など朝向け、1文）
2. 今日の予定一覧（時間・タイトル・場所）
3. 有用な指摘（1-3個）。例：
   - 準備が必要なもの（資料、持ち物など）
   - 移動時間の注意
   - 予定の間隔が短い場合の警告
   - 集中作業できる空き時間の提案
予定がない場合は「今日は予定がありません。集中して作業できる日ですね。」`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content.find((b) => b.type === "text");
    return { text: text ? (text as { type: "text"; text: string }).text : formatEventList(todayEvents), usage: response.usage };
  } catch {
    // Fallback to simple format
    if (isEvening) {
      return { text: tomorrowEvents.length === 0
        ? "お疲れさまでした。明日は予定がありません。ゆっくり休んでください。"
        : `お疲れさまでした。明日の予定です。\n\n${tomorrowList}`, usage: null };
    }
    return { text: todayEvents.length === 0
      ? "おはようございます。今日は予定がありません。集中して作業できる日ですね。"
      : `おはようございます。今日の予定です。\n\n${todayList}`, usage: null };
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, business_info, google_access_token, google_refresh_token, google_calendar_connected, schedule_delivery_enabled, schedule_times")
      .eq("google_calendar_connected", true)
      .eq("schedule_delivery_enabled", true);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ processed: 0, total: 0 });
    }

    // Current hour in JST
    const now = new Date();
    const currentHHMM = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" });
    const currentHour = currentHHMM.split(":")[0];

    let processed = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        // Check if current hour matches user's schedule times
        let scheduleTimes: string[] = [];
        if (profile.schedule_times) {
          try { scheduleTimes = JSON.parse(profile.schedule_times); } catch { scheduleTimes = []; }
        }
        if (scheduleTimes.length === 0) scheduleTimes = ["07:00"]; // default

        const matchingTime = scheduleTimes.find((t: string) => t.split(":")[0] === currentHour);
        if (!matchingTime) continue;

        const deviceId = profile.id;
        const matchHour = parseInt(matchingTime.split(":")[0], 10);
        const isEvening = matchHour >= 17; // 17時以降は夜モード（明日の予定）

        // Find user's agents
        const { data: agents } = await supabase
          .from("owner_agents")
          .select("id, config")
          .eq("device_id", deviceId)
          .limit(10);

        if (!agents || agents.length === 0) continue;

        // Prefer secretary agent
        const senderAgent = agents.find((a) =>
          /秘書|secretary/i.test(a.config?.role || "")
        ) || agents[0];

        // Fetch events
        const todayEvents = await fetchEvents(profile, 0);
        const tomorrowEvents = isEvening ? await fetchEvents(profile, 1) : [];

        // Skip AI call if no events — use simple static message
        const relevantEvents = isEvening ? tomorrowEvents : todayEvents;
        let messageText: string;
        if (relevantEvents.length === 0) {
          messageText = isEvening
            ? "お疲れさまでした。明日は予定がありません。ゆっくり休んでください。"
            : "おはようございます。今日は予定がありません。集中して作業できる日ですね。";
        } else {
          // Generate message with AI analysis only when events exist
          const result = await generateScheduleMessage(
            todayEvents,
            tomorrowEvents,
            profile.business_info || "",
            isEvening
          );
          messageText = result.text;

          // Billing
          if (result.usage) {
            const modelUsed = "claude-haiku-4-5-20251001";
            const usage = result.usage;
            const inputTokens = (usage?.input_tokens || 0) + ((usage as unknown as Record<string, number>).cache_creation_input_tokens || 0) + ((usage as unknown as Record<string, number>).cache_read_input_tokens || 0);
            const outputTokens = usage?.output_tokens || 0;
            const pricing: Record<string, { input: number; output: number }> = {
              "claude-opus-4-6": { input: 5 / 1_000_000, output: 25 / 1_000_000 },
              "claude-sonnet-4-6": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
              "claude-haiku-4-5-20251001": { input: 1 / 1_000_000, output: 5 / 1_000_000 },
            };
            const modelPricing = pricing[modelUsed] || pricing["claude-haiku-4-5-20251001"];
            const baseCost = (usage?.input_tokens || 0) * modelPricing.input;
            const cacheCost = ((usage as unknown as Record<string, number>).cache_creation_input_tokens || 0) * modelPricing.input * 1.25
              + ((usage as unknown as Record<string, number>).cache_read_input_tokens || 0) * modelPricing.input * 0.1;
            const outputCost = outputTokens * modelPricing.output;
            const costUsd = baseCost + cacheCost + outputCost;
            const costYen = Math.ceil(costUsd * 150 * 1.5);
            if (deviceId && costYen > 0) {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://musu.world";
              fetch(`${baseUrl}/api/credits`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!, "x-verified-user-id": deviceId },
                body: JSON.stringify({ inputTokens, outputTokens, costYen, model: modelUsed, apiRoute: "morning-schedule" }),
              }).catch(() => {});
            }
          }
        }

        await supabase.from("owner_chats").insert({
          device_id: deviceId,
          user_id: deviceId,
          room_id: "general",
          type: "agent",
          agent_name: senderAgent.config?.name || "Mio",
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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// POST: Cron job — runs every hour, checks if current time matches any user's X post schedule
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://musu.world";

  // Current hour in JST
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffset);
  const currentHour = jstNow.getUTCHours().toString().padStart(2, "0") + ":00";

  // Find users with X post schedule enabled
  const { data: users } = await supabase
    .from("profiles")
    .select("id, x_post_schedule")
    .eq("x_post_schedule_enabled", true)
    .not("x_post_schedule", "is", null);

  if (!users || users.length === 0) {
    return NextResponse.json({ skipped: true, reason: "no_scheduled_users", currentHour });
  }

  const results = [];

  for (const user of users) {
    const deviceId = user.id;
    let scheduleTimes: string[] = [];
    try {
      scheduleTimes = JSON.parse(user.x_post_schedule || "[]");
    } catch {
      continue;
    }

    // Check if current hour matches any scheduled time
    if (!scheduleTimes.some((t: string) => t === currentHour)) {
      continue;
    }

    try {
      // Skip if there's already a pending draft
      const { data: pendingDrafts } = await supabase
        .from("x_post_drafts")
        .select("id")
        .eq("device_id", deviceId)
        .eq("status", "pending")
        .limit(1);

      if (pendingDrafts && pendingDrafts.length > 0) {
        results.push({ deviceId, skipped: true, reason: "pending_draft_exists" });
        continue;
      }

      // Generate draft via the drafts API
      const draftRes = await fetch(`${baseUrl}/api/x/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, source: "scheduled" }),
      });

      const draft = await draftRes.json();

      if (!draftRes.ok || !draft?.text) {
        results.push({ deviceId, error: draft?.error || "Draft generation failed" });
        continue;
      }

      // Find the marketing agent (Kai) for this user
      const { data: agents } = await supabase
        .from("owner_agents")
        .select("id, config")
        .eq("device_id", deviceId)
        .limit(10);

      const kaiAgent = agents?.find(
        (a) => a.config?.role === "マーケティング" || a.config?.name === "Kai",
      );

      const agentName = kaiAgent?.config?.name || "Kai";
      const agentAvatar = kaiAgent?.config?.avatar || "";
      const agentId = kaiAgent?.id || "";

      // Post as chat message with draft ID
      await supabase.from("owner_chats").insert({
        device_id: deviceId,
        user_id: deviceId,
        room_id: "general",
        type: "agent",
        agent_name: agentName,
        agent_avatar: agentAvatar,
        agent_id: agentId,
        text: `投稿案です！\n\n「${draft.text}」\n[x-draft:${draft.id}]`,
      });

      results.push({ deviceId, ok: true, draftId: draft.id, time: currentHour });
    } catch (err) {
      results.push({ deviceId, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ results, currentHour });
}

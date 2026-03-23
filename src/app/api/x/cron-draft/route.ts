import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// POST: Cron job — Kai generates a daily tweet draft and posts it as a chat proposal
// Called by Vercel Cron at 9:00 JST
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://musu.world";

  // Find all users who have X connected (or just the admin for now)
  const adminDeviceId = process.env.ADMIN_DEVICE_ID;
  if (!adminDeviceId) {
    return NextResponse.json({ error: "ADMIN_DEVICE_ID not set" }, { status: 500 });
  }

  const deviceIds = [adminDeviceId];

  const results = [];

  for (const deviceId of deviceIds) {
    try {
      // Check if already generated today (JST)
      const now = new Date();
      const jstOffset = 9 * 60 * 60 * 1000;
      const jstNow = new Date(now.getTime() + jstOffset);
      const todayStart = new Date(
        Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate()) - jstOffset,
      );

      const { data: todayDrafts } = await supabase
        .from("x_post_drafts")
        .select("id")
        .eq("device_id", deviceId)
        .gte("created_at", todayStart.toISOString())
        .limit(1);

      if (todayDrafts && todayDrafts.length > 0) {
        results.push({ deviceId, skipped: true, reason: "already_generated_today" });
        continue;
      }

      // Generate draft via the drafts API
      const draftRes = await fetch(`${baseUrl}/api/x/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, source: "daily_cron" }),
      });

      const draft = await draftRes.json();

      if (!draftRes.ok || !draft?.text) {
        results.push({ deviceId, error: draft?.error || "Draft generation failed" });
        continue;
      }

      // Find Kai agent for this user
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
        text: `今日の投稿案です！\n\n「${draft.text}」\n[x-draft:${draft.id}]`,
      });

      results.push({ deviceId, ok: true, draftId: draft.id });
    } catch (err) {
      results.push({ deviceId, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ results });
}

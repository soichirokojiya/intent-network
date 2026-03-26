import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/anthropicClient";
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/serverAuth";

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Trigger proactive insight for a single user (called on login)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId = getVerifiedUserId(req) || body.deviceId;
  if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Check if already sent a proactive message today (JST)
    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstNow = new Date(now.getTime() + jstOffset);
    const todayStart = new Date(Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate()) - jstOffset);

    const { data: todayMessages } = await supabase
      .from("owner_chats")
      .select("id")
      .eq("device_id", deviceId)
      .eq("type", "agent")
      .gte("created_at", todayStart.toISOString())
      .like("text", "%[proactive]%")
      .limit(1);

    if (todayMessages && todayMessages.length > 0) {
      return NextResponse.json({ sent: false, reason: "already_sent_today" });
    }

    // Load profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("memory_summary, business_info, google_calendar_connected")
      .eq("id", deviceId)
      .single();

    if (!profile?.memory_summary) {
      return NextResponse.json({ sent: false, reason: "no_memory" });
    }

    // Find user's agents
    const { data: agents } = await supabase
      .from("owner_agents")
      .select("id, config")
      .eq("device_id", deviceId)
      .limit(10);

    if (!agents || agents.length === 0) {
      return NextResponse.json({ sent: false, reason: "no_agents" });
    }

    // Pick a random agent
    const senderAgent = agents[Math.floor(Math.random() * agents.length)];

    // Load project_facts (separate actions from other facts)
    const { data: facts } = await supabase
      .from("project_facts")
      .select("category, content, created_at")
      .eq("device_id", deviceId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(30);

    const actionFacts = (facts || []).filter(f => f.category === "action").slice(0, 10);
    const otherFacts = (facts || []).filter(f => f.category !== "action").slice(0, 15);

    const factsText = otherFacts.length > 0
      ? otherFacts.map((f) => `[${f.category}] ${f.content}`).join("\n")
      : "";

    const actionText = actionFacts.length > 0
      ? actionFacts.map((f) => f.content).join("\n")
      : "";

    // Load recent chat history
    const { data: recentChats } = await supabase
      .from("owner_chats")
      .select("type, agent_name, text")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(30);

    const chatHistory = recentChats && recentChats.length > 0
      ? recentChats
          .reverse()
          .map((c) => {
            const sender = c.type === "user" ? "ユーザー" : (c.agent_name || "エージェント");
            return `${sender}: ${(c.text || "").slice(0, 200)}`;
          })
          .join("\n")
      : "";

    // Load today's calendar events if connected
    let calendarText = "";
    if (profile && (profile as Record<string, unknown>).google_calendar_connected) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://musu.world";
        const calRes = await fetch(`${baseUrl}/api/google/calendar?deviceId=${deviceId}`, {
          headers: { "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!, "x-verified-user-id": deviceId },
        });
        if (calRes.ok) {
          const calData = await calRes.json();
          if (calData.connected && calData.events?.length > 0) {
            calendarText = calData.events.slice(0, 5).map((e: { title: string; start: string }) => {
              const time = e.start ? new Date(e.start).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }) : "終日";
              return `${time} ${e.title}`;
            }).join("\n");
          }
        }
      } catch { /* ignore */ }
    }

    if (!profile.memory_summary && !factsText && !chatHistory) {
      return NextResponse.json({ sent: false, reason: "no_context" });
    }

    const agentName = senderAgent.config?.name || "エージェント";
    const agentRole = senderAgent.config?.role || "";

    const prompt = `あなたは「${agentName}」というAIエージェント${agentRole ? `（役割: ${agentRole}）` : ""}です。
ユーザーのチームメイトとして、声かけ＋気づき1つを伝えてください。

【ユーザーの記憶・事業情報】
${profile.memory_summary || "(なし)"}
${(profile as Record<string, unknown>).business_info ? `事業: ${(profile as Record<string, unknown>).business_info}` : ""}

【プロジェクトファクト】
${factsText || "(なし)"}

【最近の行動履歴】
${actionText || "(なし)"}
${calendarText ? `\n【今日の予定】\n${calendarText}` : ""}

【最近の会話（直近30件）】
${chatHistory || "(なし)"}

【出力ルール】
声かけ＋気づきを合わせて2〜3文で。LINEで同僚に送る感覚で。

声かけ: 「前に話してた〇〇」「そういえば〇〇」みたいな切り出し。
気づき: 以下のどれか1つだけ添える。無理に全部入れなくていい。
- 行動パターンから: 同じ作業を何度もやっていたら「自動化できそう」と提案
- 予定から: 今日の予定に関連する準備や資料の提案
- 事業データから: 売上や問い合わせの傾向、異常値の指摘
- 最近の会話から: 話していた課題の進捗確認や別角度の提案
- 行動履歴から: 最近やったことの振り返りや次のアクション提案

【禁止事項】
- 挨拶（おはよう、こんにちは等）
- レポート形式、箇条書き
- 汎用的な応援メッセージ（「頑張って！」等）
- Markdown
- 4文以上`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    // Billing
    {
      const modelUsed = "claude-haiku-4-5-20251001";
      const usage = response.usage;
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
          body: JSON.stringify({ inputTokens, outputTokens, costYen, model: modelUsed, apiRoute: "proactive-insight" }),
        }).catch(() => {});
      }
    }

    const textBlock = response.content.find((b) => b.type === "text");
    const messageText = textBlock ? (textBlock as { type: "text"; text: string }).text.trim() : "";

    if (!messageText) {
      return NextResponse.json({ sent: false, reason: "empty_response" });
    }

    // Insert message
    const { data: inserted } = await supabase.from("owner_chats").insert({
      device_id: deviceId,
      user_id: deviceId,
      room_id: "general",
      type: "agent",
      agent_name: senderAgent.config?.name || "エージェント",
      agent_avatar: senderAgent.config?.avatar || "",
      agent_id: senderAgent.id,
      text: messageText + "\n[proactive]",
    }).select("id, agent_name, agent_avatar, agent_id, text, created_at").single();

    return NextResponse.json({
      sent: true,
      message: inserted,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

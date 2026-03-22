import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/anthropicClient";
import { NextResponse } from "next/server";

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch users who have memory_summary (something to be proactive about)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, memory_summary, business_info")
      .not("memory_summary", "is", null)
      .neq("memory_summary", "");

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ processed: 0, total: 0, skipped_reason: "no profiles with memory" });
    }

    // Today's date range in JST for dedup check
    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstNow = new Date(now.getTime() + jstOffset);
    const todayStart = new Date(Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate()) - jstOffset);

    let processed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        const deviceId = profile.id;

        // Check if already sent a proactive message today
        const { data: todayMessages } = await supabase
          .from("owner_chats")
          .select("id")
          .eq("device_id", deviceId)
          .eq("type", "agent")
          .gte("created_at", todayStart.toISOString())
          .like("text", "%[proactive]%")
          .limit(1);

        if (todayMessages && todayMessages.length > 0) {
          skipped++;
          continue;
        }

        // Find user's agents
        const { data: agents } = await supabase
          .from("owner_agents")
          .select("id, config")
          .eq("device_id", deviceId)
          .limit(10);

        if (!agents || agents.length === 0) continue;

        // Pick a random agent
        const senderAgent = agents[Math.floor(Math.random() * agents.length)];

        // Load project_facts for this user
        const { data: facts } = await supabase
          .from("project_facts")
          .select("category, content, created_at")
          .eq("device_id", deviceId)
          .order("created_at", { ascending: false })
          .limit(20);

        const factsText = facts && facts.length > 0
          ? facts.map((f) => `[${f.category}] ${f.content}`).join("\n")
          : "";

        // Load recent chat history (last 30 messages)
        const { data: recentChats } = await supabase
          .from("owner_chats")
          .select("type, agent_name, text, created_at")
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

        // Skip if there's truly nothing to work with
        if (!profile.memory_summary && !factsText && !chatHistory) {
          skipped++;
          continue;
        }

        const agentName = senderAgent.config?.name || "エージェント";
        const agentRole = senderAgent.config?.role || "";

        const prompt = `あなたは「${agentName}」というAIエージェント${agentRole ? `（役割: ${agentRole}）` : ""}です。
ユーザーのチームメイトとして、自然にひとこと声をかけてください。

【ユーザーの記憶サマリー】
${profile.memory_summary || "(なし)"}

【プロジェクトファクト】
${factsText || "(なし)"}

【最近の会話（直近30件）】
${chatHistory || "(なし)"}

【ルール】
- 1〜2文だけ。LINEで同僚に送るくらいカジュアルに。
- 挨拶禁止（おはよう、こんにちは等）。レポート形式禁止。箇条書き禁止。
- 「前に話してた〇〇」「そういえば〇〇」みたいな切り出し方。
- 具体的な内容に触れること（汎用的な応援メッセージはNG）。
- 例: 「前に話してた◯◯、そろそろ期限じゃない？」「最近◯◯についてよく話してるけど、◯◯も考えてみた？」「◯◯の件、その後どうなった？」
- Markdown禁止。プレーンテキストのみ。`;

        const response = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 256,
          messages: [{ role: "user", content: prompt }],
        });

        const textBlock = response.content.find((b) => b.type === "text");
        const messageText = textBlock ? (textBlock as { type: "text"; text: string }).text.trim() : "";

        if (!messageText) continue;

        // Insert with [proactive] tag for dedup (hidden at end)
        await supabase.from("owner_chats").insert({
          device_id: deviceId,
          user_id: deviceId,
          room_id: "general",
          type: "agent",
          agent_name: senderAgent.config?.name || "エージェント",
          agent_avatar: senderAgent.config?.avatar || "",
          agent_id: senderAgent.id,
          text: messageText + "\n[proactive]",
        });

        processed++;
      } catch (err) {
        errors.push(`${profile.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      processed,
      skipped,
      total: profiles.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

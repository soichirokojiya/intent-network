import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/anthropicClient";

export const maxDuration = 120;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUMMARIZE_PROMPT = `あなたはAIエージェントの記憶管理システムです。以下の会話ログを読み、要約を生成してください。

既存の記憶要約:
{existing_memory_summary}

新しい会話ログ:
{conversation_log}

「残すもの」の基準：
・価値観の表明（オーナーの判断基準が現れた発言）
・感情の温度が高い発言（該当する原文は最大3件まで原文のまま保持）
・意思決定とその理由（「AではなくBを選んだ。理由は〜」の構造で記録）
・事業方針やビジョンに関する発言（変遷がある場合は差分を明記）
・エージェントとの関係性の定義や変更
・未解決の問い（方針未決定の話題）

「削除するもの」の基準：
・事実確認のためだけのやりとり
・一時的な作業指示と完了報告
・雑談のうち、価値観・感情・意思決定のいずれにも該当しないもの
・既に要約済みの情報

出力フォーマット：
・冒頭に一文で「この期間で何が起きたか」を書く
・残す情報をカテゴリごとに分類（価値観／感情／意思決定／事業方針／関係性／未解決）
・感情の温度が高い原文は「原文保持：」のラベルをつけてそのまま残す
・削除した情報の概要を一文で書く`;

export async function POST(req: NextRequest) {
  try {
    const { deviceId } = await req.json();
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    // Get current memory_summary from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("memory_summary, memory_updated_at")
      .eq("id", deviceId)
      .single();

    const existingMemory = profile?.memory_summary || "(なし)";

    // Get total message count for this user
    const { count: totalCount } = await supabase
      .from("owner_chats")
      .select("*", { count: "exact", head: true })
      .eq("device_id", deviceId);

    if (!totalCount || totalCount < 20) {
      return NextResponse.json({ skipped: true, reason: "not_enough_messages", count: totalCount || 0 });
    }

    // Get the 15 most recent message IDs (to exclude them)
    const { data: recentMessages } = await supabase
      .from("owner_chats")
      .select("id, created_at")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(15);

    const oldestRecentTime = recentMessages && recentMessages.length > 0
      ? recentMessages[recentMessages.length - 1].created_at
      : null;

    if (!oldestRecentTime) {
      return NextResponse.json({ skipped: true, reason: "no_recent_messages" });
    }

    // Get older messages (before the 15 most recent)
    const { data: oldMessages } = await supabase
      .from("owner_chats")
      .select("type, agent_name, text, created_at")
      .eq("device_id", deviceId)
      .lt("created_at", oldestRecentTime)
      .order("created_at", { ascending: true })
      .limit(200);

    if (!oldMessages || oldMessages.length < 20) {
      return NextResponse.json({ skipped: true, reason: "not_enough_old_messages", count: oldMessages?.length || 0 });
    }

    // Build conversation log
    const conversationLog = oldMessages
      .map((m) => {
        const speaker = m.type === "user" ? "オーナー" : (m.agent_name || "エージェント");
        return `[${m.created_at}] ${speaker}: ${m.text}`;
      })
      .join("\n");

    // Generate summary with Sonnet 4.6
    const prompt = SUMMARIZE_PROMPT
      .replace("{existing_memory_summary}", existingMemory)
      .replace("{conversation_log}", conversationLog);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const summary = message.content[0].type === "text" ? message.content[0].text : "";

    if (!summary) {
      return NextResponse.json({ error: "Empty summary generated" }, { status: 500 });
    }

    // Save to profiles
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        memory_summary: summary,
        memory_updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, summaryLength: summary.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("summarize-memory error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

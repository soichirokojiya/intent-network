import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/anthropicClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET: List drafts
export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  const status = req.nextUrl.searchParams.get("status") || "pending";

  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("x_post_drafts")
    .select("*")
    .eq("device_id", deviceId)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST: Generate a new draft (Kai creates a tweet proposal)
export async function POST(req: NextRequest) {
  const { deviceId, source } = await req.json();

  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  // Load context for Kai
  const [profileRes, factsRes, pastDraftsRes] = await Promise.all([
    supabase.from("profiles").select("memory_summary, business_info").eq("id", deviceId).single(),
    supabase.from("project_facts").select("category, content").eq("device_id", deviceId).eq("status", "active").order("created_at", { ascending: false }).limit(20),
    supabase.from("x_post_drafts").select("text, status, rejection_reason, engagement").eq("device_id", deviceId).order("created_at", { ascending: false }).limit(10),
  ]);

  const profile = profileRes.data;
  const facts = factsRes.data || [];
  const pastDrafts = pastDraftsRes.data || [];

  const factsText = facts.map((f) => `[${f.category}] ${f.content}`).join("\n") || "(なし)";

  const pastContext = pastDrafts.length > 0
    ? pastDrafts.map((d) => {
        const status = d.status === "posted" ? "✅投稿済み" : d.status === "rejected" ? `❌却下: ${d.rejection_reason || "理由なし"}` : "⏳保留";
        const eng = d.engagement && Object.keys(d.engagement).length > 0 ? ` (♥${d.engagement.likes || 0} RT${d.engagement.retweets || 0})` : "";
        return `${status}${eng}: ${d.text}`;
      }).join("\n")
    : "(まだ投稿履歴なし)";

  const prompt = `あなたはmusu.worldの広報担当「Kai」です。
musu公式Xアカウントの投稿案を1つ作成してください。

【musu.worldとは】
AIエージェントチームを持てるサービス。ソロプレナー（ひとり起業家）向け。
コンセプト: 「ひとりだけど、ひとりじゃない。育てるほど、任せられる。あなただけの仲間を持とう。」
機能: AIチームとチャット、Gmail/Sheets/Calendar連携、自動化、記憶・学習

【ユーザーの事業情報】
${profile?.business_info || "(未設定)"}

【プロジェクトファクト（最新情報）】
${factsText}

【過去の投稿と結果】
${pastContext}

【ルール】
- 140文字以内（日本語）
- 宣伝臭を出しすぎない。共感・価値提供ベース
- ソロプレナーの悩みに寄り添う内容
- 過去に反応が良かったトーンを参考にする
- 却下された投稿のパターンは避ける
- ハッシュタグは0〜2個まで
- 絵文字は控えめに（0〜1個）
- URLは含めない

投稿文のみを出力してください。説明不要。`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  // Billing
  const usage = response.usage;
  const inputTokens = (usage?.input_tokens || 0) + ((usage as unknown as Record<string, number>).cache_creation_input_tokens || 0) + ((usage as unknown as Record<string, number>).cache_read_input_tokens || 0);
  const outputTokens = usage?.output_tokens || 0;
  const costUsd = inputTokens * (1 / 1_000_000) + outputTokens * (5 / 1_000_000);
  const costYen = Math.ceil(costUsd * 150 * 1.5);
  if (costYen > 0) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://musu.world";
    fetch(`${baseUrl}/api/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, inputTokens, outputTokens, costYen, model: "claude-haiku-4-5-20251001", apiRoute: "x-drafts" }),
    }).catch(() => {});
  }

  const textBlock = response.content.find((b) => b.type === "text");
  const tweetText = textBlock ? (textBlock as { type: "text"; text: string }).text.trim() : "";

  if (!tweetText) {
    return NextResponse.json({ error: "Empty response from AI" }, { status: 500 });
  }

  // Save draft
  const { data: draft, error } = await supabase
    .from("x_post_drafts")
    .insert({
      device_id: deviceId,
      agent_id: "kai",
      agent_name: "Kai",
      text: tweetText,
      source: source || "ai",
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(draft);
}

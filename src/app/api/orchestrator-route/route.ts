import { anthropic } from "@/lib/anthropicClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { message, agents, conversationHistory } = await req.json();

  if (!message || !agents) {
    return NextResponse.json({ error: "message and agents required" }, { status: 400 });
  }

  const agentList = agents
    .map((a: { name: string; role: string }) => `${a.name}（${a.role}）`)
    .join("、");

  const recentContext = (conversationHistory || [])
    .slice(-5)
    .map((m: { role: string; text: string }) => `${m.role}: ${m.text.slice(0, 100)}`)
    .join("\n");

  const prompt = `あなたはチームリーダーです。ユーザーのメッセージを受けて、どう対応するか判断してください。

チームメンバー: ${agentList}

${recentContext ? `直近の会話:\n${recentContext}\n` : ""}
ユーザーのメッセージ: ${message}

以下のJSON形式で回答してください。他のテキストは不要です。
{
  "action": "self" または "delegate",
  "delegates": ["振り先の名前", "振り先の名前"],
  "reason": "判断理由（1文）"
}

判断基準:
- 簡単な質問、雑談、確認、挨拶 → "self"（自分で回答）
- 専門知識が必要 → "delegate" で該当する1-2名に振る
- 直前の会話の文脈で特定メンバーに向けた内容 → "delegate" でそのメンバーに振る
- 複数の視点が必要 → "delegate" で2名まで振る（それ以上は不要）`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content.find((b) => b.type === "text");
    const rawText = text ? (text as { type: "text"; text: string }).text : "";

    try {
      // Extract JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          action: parsed.action || "self",
          delegates: Array.isArray(parsed.delegates) ? parsed.delegates.slice(0, 2) : [],
          reason: parsed.reason || "",
        });
      }
    } catch {}

    // Fallback: self
    return NextResponse.json({ action: "self", delegates: [], reason: "parse error" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

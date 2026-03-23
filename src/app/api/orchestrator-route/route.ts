import { anthropic } from "@/lib/anthropicClient";
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  const deviceId = getVerifiedUserId(req);
  if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
- 専門知識が必要 → "delegate" で該当する1名だけに振る
- 直前の会話の文脈で特定メンバーに向けた内容 → "delegate" でそのメンバーに振る
- delegatesには必ず1名だけ入れること。2名以上は禁止`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    // Billing
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
      fetch(new URL("/api/credits", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!, "x-verified-user-id": deviceId },
        body: JSON.stringify({ inputTokens, outputTokens, costYen, model: modelUsed, apiRoute: "orchestrator-route" }),
      }).catch(() => {});
    }

    const text = response.content.find((b) => b.type === "text");
    const rawText = text ? (text as { type: "text"; text: string }).text : "";

    try {
      // Extract JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          action: parsed.action || "self",
          delegates: Array.isArray(parsed.delegates) ? parsed.delegates.slice(0, 1) : [],
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

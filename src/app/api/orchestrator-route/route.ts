import { anthropic } from "@/lib/anthropicClient";
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const deviceId = getVerifiedUserId(req) || body.deviceId;
  if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, agents, conversationHistory } = body;

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

判断基準（優先順位順に適用すること）:
1. 直前の会話でメンバーが応答していて、ユーザーの発言がその続きと解釈できる場合 → 必ず "delegate" でそのメンバーに振る。自分（self）で応答してはいけない。これが最優先ルール
2. X投稿、ツイート、ポスト、投稿して等の依頼 → 必ず "delegate" でマーケティング担当に振る
3. メール送信、メール作成の依頼 → 必ず "delegate" で秘書またはマーケティング担当に振る
4. スプレッドシート操作、データ管理 → 必ず "delegate" で該当担当に振る
5. ツール操作・外部サービス連携を伴うタスクは必ず "delegate" にすること。自分では実行しない
6. 専門知識が必要 → "delegate" で該当する1名だけに振る
7. 上記のいずれにも該当しない、かつ直前に会話中のメンバーもいない場合のみ → "self"（自分で回答）
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

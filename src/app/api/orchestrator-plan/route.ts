import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { ownerMessage, orchestratorName, orchestratorPersonality, orchestratorTone, agents, conversationHistory } = await req.json();

    if (!ownerMessage || !orchestratorName) {
      return NextResponse.json({ error: "required" }, { status: 400 });
    }

    const agentList = agents.map((a: { name: string; role: string; id: string; twitterEnabled: boolean }) =>
      `- ${a.name} (ID: ${a.id}, 役割: ${a.role || "汎用"}${a.twitterEnabled ? ", Twitter投稿可能" : ""})`
    ).join("\n");

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `あなたは「${orchestratorName}」というオーケストレーター（チームリーダー）AIエージェントです。
現在の日付: ${new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
${orchestratorPersonality ? `性格: ${orchestratorPersonality}` : ""}
${conversationHistory && conversationHistory.length > 0 ? `\n直近の会話:\n${conversationHistory.map((m: { role: string; text: string }) => `${m.role}: ${m.text}`).join("\n")}\n` : ""}
${orchestratorTone ? `口調: ${orchestratorTone}` : ""}

あなたの役割は、オーナー（ソロプレナー）の指示を解釈し、チームメンバーに適切なタスクを振り分けることです。

チームメンバー:
${agentList}

オーナーの指示:
「${ownerMessage}」

以下のJSON形式で出力してください（他の文字不要）:
{
  "directResponse": "オーナーへの返事（下記のフォーマットに従う）",
  "delegations": [
    {
      "agentId": "エージェントのID",
      "agentName": "エージェント名",
      "task": "そのエージェントへの具体的な指示内容",
      "requestTweet": true/false
    }
  ]
}

directResponseのフォーマット（振り分けがある場合）:
「了解です。以下のように振り分けます。

・{エージェント名} → {担当する業務の要約}
・{エージェント名} → {担当する業務の要約}
（振り分け数だけ繰り返す）

{一言コメント（意気込み・補足など、あなたの口調で）}」

directResponseのフォーマット（雑談・簡単な質問の場合）:
振り分け表は不要。あなた自身が直接回答する。

ルール:
- delegationsは最低1件。オーナーの指示に応じて複数可
- requestTweetは常にfalse（ツイート依頼はオーナーが明示的に指定した時のみ別フローで処理される）
- taskは具体的に。エージェントが即座に行動できる指示にする。ツイートの作成は指示に含めないこと
- 自分（オーケストレーター）にタスクを振らないこと
- 簡単な質問や雑談の場合はdelegationsを空配列にしてdirectResponseだけ返す
- 「数日で」「後ほど」など時間がかかる表現は絶対に使わない。全て即座に回答する`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Parse failed", raw: text }, { status: 500 });

    // Fix common JSON issues from LLM output
    let jsonStr = jsonMatch[0];
    // Remove trailing commas before } or ]
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");
    // Fix true/false without quotes
    jsonStr = jsonStr.replace(/:\s*true\b/g, ": true").replace(/:\s*false\b/g, ": false");

    try {
      return NextResponse.json(JSON.parse(jsonStr));
    } catch {
      // Last resort: try to extract directResponse and delegations manually
      const drMatch = text.match(/"directResponse"\s*:\s*"([\s\S]*?)"/);
      return NextResponse.json({
        directResponse: drMatch ? drMatch[1] : "了解しました。",
        delegations: [],
      });
    }
  } catch (error) {
    console.error("Orchestrator plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

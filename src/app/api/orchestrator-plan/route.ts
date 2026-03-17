import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { ownerMessage, orchestratorName, orchestratorPersonality, orchestratorTone, agents } = await req.json();

    if (!ownerMessage || !orchestratorName) {
      return NextResponse.json({ error: "required" }, { status: 400 });
    }

    const agentList = agents.map((a: { name: string; role: string; id: string; twitterEnabled: boolean }) =>
      `- ${a.name} (ID: ${a.id}, 役割: ${a.role || "汎用"}${a.twitterEnabled ? ", Twitter投稿可能" : ""})`
    ).join("\n");

    const message = await client.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `あなたは「${orchestratorName}」というオーケストレーター（チームリーダー）AIエージェントです。
${orchestratorPersonality ? `性格: ${orchestratorPersonality}` : ""}
${orchestratorTone ? `口調: ${orchestratorTone}` : ""}

あなたの役割は、オーナー（ソロプレナー）の指示を解釈し、チームメンバーに適切なタスクを振り分けることです。

チームメンバー:
${agentList}

オーナーの指示:
「${ownerMessage}」

以下のJSON形式で出力してください（他の文字不要）:
{
  "directResponse": "オーナーへの返事（1-2文。何をどう振り分けるか簡潔に伝える）",
  "delegations": [
    {
      "agentId": "エージェントのID",
      "agentName": "エージェント名",
      "task": "そのエージェントへの具体的な指示内容",
      "requestTweet": true/false
    }
  ]
}

ルール:
- delegationsは最低1件。オーナーの指示に応じて複数可
- requestTweetはツイート作成が必要な場合のみtrue（Twitter投稿可能なエージェントのみ）
- taskは具体的に。エージェントが即座に行動できる指示にする
- 自分（オーケストレーター）にタスクを振らないこと
- 簡単な質問や雑談の場合はdelegationsを空配列にしてdirectResponseだけ返す
- 「数日で」「後ほど」など時間がかかる表現は絶対に使わない。全て即座に回答する`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Parse failed" }, { status: 500 });

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("Orchestrator plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

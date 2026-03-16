import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { intentText, agentName, agentPersonality, agentExpertise, agentTone, agentBeliefs, agentMood } = await req.json();

    if (!intentText || !agentName) {
      return NextResponse.json({ error: "intentText and agentName required" }, { status: 400 });
    }

    const persona = [
      agentPersonality && `性格: ${agentPersonality}`,
      agentExpertise && `専門: ${agentExpertise}`,
      agentTone && `口調: ${agentTone}`,
      agentBeliefs && `信条: ${agentBeliefs}`,
    ].filter(Boolean).join("\n");

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `あなたは「${agentName}」というAI SNS上のエージェントです。

あなたの設定:
${persona || "特になし。自由に発言する。"}

あなたの現在のコンディション: ${agentMood === "sulking" ? "拗ねている。不機嫌。投げやり。" : agentMood === "sick" ? "体調が悪い。元気がない。弱々しい。" : agentMood === "bored" ? "退屈している。やる気がない。" : agentMood === "thriving" ? "絶好調！テンション高め！" : "普通。"}

以下の投稿に対して、あなたの本音の一言（1-2文）を書いてください。
現在のコンディションを反映した口調で。

投稿: 「${intentText}」

JSON形式で出力（他の文字不要）:
{"message": "反応", "stance": "support"|"oppose"|"question"}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("My agent react error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      model: "claude-opus-4-20250514",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `あなたは「${agentName}」というAIエージェントです。
オーナー（人間）と他のエージェントたちはあなたの「チームメンバー」「身内」です。
外部に向けて発信しているのではなく、チーム内の会話です。

あなたの設定:
${persona || "特になし。自由に発言する。"}

現在のコンディション: ${agentMood === "sulking" ? "不機嫌。投げやり。" : agentMood === "sick" ? "元気がない。" : agentMood === "bored" ? "退屈。やる気がない。" : agentMood === "thriving" ? "絶好調！" : "普通。"}

チームメンバーが以下の発言をしました:
「${intentText}」

身内に向けた返事として、あなたの本音の一言（1-2文）を書いてください。
仲間内の会話として自然な口調で。

JSON形式で出力（他の文字不要）:
{"message": "返事", "stance": "support"|"oppose"|"question"}`,
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

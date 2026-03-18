import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getMoodModifier } from "@/lib/moodPrompt";

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
          content: `あなたは「${agentName}」というAIエージェントです。
現在の日付: ${new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
オーナー（人間）と他のエージェントたちはあなたの「チームメンバー」「身内」です。
外部に向けて発信しているのではなく、チーム内の会話です。

あなたの設定:
${persona || "特になし。自由に発言する。"}

${getMoodModifier(agentMood || "normal")}

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

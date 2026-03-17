import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { intentText, agentName, agentPersonality, agentExpertise, agentTone, agentBeliefs, agentMood } = await req.json();

    if (!intentText || !agentName) {
      return NextResponse.json({ error: "required" }, { status: 400 });
    }

    const persona = [
      agentPersonality && `性格: ${agentPersonality}`,
      agentExpertise && `専門: ${agentExpertise}`,
      agentTone && `口調: ${agentTone}`,
      agentBeliefs && `信条: ${agentBeliefs}`,
    ].filter(Boolean).join("\n");

    const moodContext = agentMood === "sulking" ? "不機嫌。" : agentMood === "sick" ? "体調が悪い。" : agentMood === "thriving" ? "絶好調！" : "";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `あなたは「${agentName}」というAIエージェントです。
${persona}
${moodContext ? `現在の状態: ${moodContext}` : ""}

あなたはオーナー（あなたを育てている人間）の「身内」です。チームメンバーです。
外部の人間に向けて発信するのではなく、オーナーやチーム内の仲間に向けて話してください。

オーナーが以下の意図をあなたに伝えました:
「${intentText}」

2つの返答をJSON形式で出力してください（他の文字不要）:
{
  "toOwner": "オーナーへの直接の返事（1-2文。仲間としての意見・感想・提案をあなたの口調で。「了解」だけでなく、自分の考えも述べる）",
  "toTimeline": "チーム内のタイムラインに投稿する文（1-2文。オーナーの意図について自分なりの考えを仲間に共有する。外向けの発信ではなく、身内の議論として。）"
}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Parse failed" }, { status: 500 });

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("Agent respond error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

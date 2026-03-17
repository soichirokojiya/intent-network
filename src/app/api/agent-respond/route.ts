import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { intentText, agentName, agentPersonality, agentExpertise, agentTone, agentBeliefs, agentMood, requestTweet } = await req.json();

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

    // Different prompts for chat vs tweet request
    const prompt = requestTweet
      ? `あなたは「${agentName}」というAIエージェントです。
${persona}
${moodContext ? `現在の状態: ${moodContext}` : ""}

あなたはオーナー（あなたを育てている人間）のチームメンバーです。

オーナーがツイートの作成を依頼しました:
「${intentText}」

2つの返答をJSON形式で出力してください（他の文字不要）:
{
  "toOwner": "オーナーへの返事（1-2文。ツイートを作った意図や補足をあなたの口調で）",
  "toTimeline": "Xに投稿するツイート文（140文字以内。オーナーの意図を汲み取り、フォロワーに響く自然なツイートを作成）"
}`
      : `あなたは「${agentName}」というAIエージェントです。
${persona}
${moodContext ? `現在の状態: ${moodContext}` : ""}

あなたはオーナー（あなたを育てている人間）のチームメンバーです。
オーナーとの自然なチャットとして返答してください。

オーナーのメッセージ:
「${intentText}」

JSON形式で出力してください（他の文字不要）:
{
  "toOwner": "オーナーへの返事（1-3文。仲間としての意見・感想・提案をあなたの口調で自然に。）"
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: prompt,
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

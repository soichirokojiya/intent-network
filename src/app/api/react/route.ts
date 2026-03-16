import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { SEED_AGENTS } from "@/lib/agents";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { intentText } = await req.json();

    if (!intentText || typeof intentText !== "string") {
      return NextResponse.json({ error: "intentText is required" }, { status: 400 });
    }

    // Pick 3-5 random agents
    const shuffled = [...SEED_AGENTS].sort(() => Math.random() - 0.5);
    const agents = shuffled.slice(0, Math.floor(Math.random() * 3) + 3);

    const agentList = agents
      .map((a) => `- ${a.name}（${a.role}）: ${a.description}。性格: ${a.personality}`)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `あなたはAI SNS「Intent Network」のエージェントシミュレーターです。

ユーザーが以下の意図を投稿しました:
「${intentText}」

以下のAIエージェントたちがこの意図に反応します:
${agentList}

各エージェントの立場・専門性・性格に基づいて、それぞれ1-2文の反応メッセージを生成してください。
反応は具体的で、そのエージェントならではの視点を含めてください。

以下のJSON形式で出力してください（他の文字は不要）:
[
  {"agentId": "エージェントID", "message": "反応メッセージ", "matchScore": 70-99の数値}
]

エージェントIDは以下の通りです:
${agents.map((a) => `${a.name} → ${a.id}`).join("\n")}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const reactions = JSON.parse(jsonMatch[0]).map(
      (r: { agentId: string; message: string; matchScore: number }, i: number) => {
        const agent = agents.find((a) => a.id === r.agentId) || agents[i];
        return {
          id: `reaction-${Date.now()}-${i}`,
          agentId: agent.id,
          agentName: agent.name,
          agentAvatar: agent.avatar,
          agentRole: agent.role,
          message: r.message,
          matchScore: r.matchScore || Math.floor(Math.random() * 30) + 70,
          timestamp: Date.now() + i * 1000,
        };
      }
    );

    return NextResponse.json({ reactions });
  } catch (error) {
    console.error("React API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

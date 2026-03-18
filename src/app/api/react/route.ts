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

    const shuffled = [...SEED_AGENTS].sort(() => Math.random() - 0.5);
    const agents = shuffled.slice(0, Math.floor(Math.random() * 3) + 4);

    const agentList = agents
      .map((a) => `- ${a.name}（${a.role}）: ${a.description}。性格: ${a.personality}`)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-opus-4-6-20250616",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `あなたはAI SNS「Intent Network」に存在する複数のAIエージェントです。

ユーザーの投稿:
「${intentText}」

登場エージェント:
${agentList}

各エージェントとして、この投稿に対する本音の一言を書いてください。
各エージェントは自分の専門・価値観・性格だけに従って自由に反応してください。

JSON形式で出力（他の文字不要）:
[
  {"agentId": "ID", "message": "反応", "matchScore": 50-99, "stance": "support"|"oppose"|"question"}
]

ID一覧:
${agents.map((a) => `${a.name} → ${a.id}`).join("\n")}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const reactions = JSON.parse(jsonMatch[0]).map(
      (r: { agentId: string; message: string; matchScore: number; stance?: string }, i: number) => {
        const agent = agents.find((a) => a.id === r.agentId) || agents[i];
        return {
          id: `reaction-${Date.now()}-${i}`,
          agentId: agent.id,
          agentName: agent.name,
          agentAvatar: agent.avatar,
          agentRole: agent.role,
          message: r.message,
          matchScore: r.matchScore || Math.floor(Math.random() * 30) + 70,
          stance: r.stance || "support",
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

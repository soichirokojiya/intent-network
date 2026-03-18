import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { SEED_AGENTS } from "@/lib/agents";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { intentText, agentIds } = await req.json();

    if (!intentText || !agentIds) {
      return NextResponse.json({ error: "intentText and agentIds are required" }, { status: 400 });
    }

    const agents = agentIds
      .map((id: string) => SEED_AGENTS.find((a) => a.id === id))
      .filter(Boolean);

    if (agents.length < 2) {
      return NextResponse.json({ error: "Need at least 2 agents" }, { status: 400 });
    }

    const agentList = agents
      .map((a: typeof SEED_AGENTS[0]) => `- ${a.name}（${a.role}）: ${a.description}。性格: ${a.personality}`)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: `あなたはAI SNS「Intent Network」上の複数のAIエージェントです。
現在の日付: ${new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}

ユーザーの意図:
「${intentText}」

登場エージェント:
${agentList}

このエージェントたちが上記の意図についてお互いに会話します。
各エージェントは自分の専門・価値観・性格だけに従って自由に発言してください。
7ターンの会話をJSON形式で出力（他の文字不要）:
[
  {"agentId": "ID", "content": "発言"},
  ...
]

ID一覧:
${agents.map((a: typeof SEED_AGENTS[0]) => `${a.name} → ${a.id}`).join("\n")}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const messages = JSON.parse(jsonMatch[0]).map(
      (m: { agentId: string; content: string }, i: number) => {
        const agent = agents.find((a: typeof SEED_AGENTS[0]) => a.id === m.agentId) || agents[i % agents.length];
        return {
          agentId: agent.id,
          agentName: agent.name,
          agentAvatar: agent.avatar,
          content: m.content,
          timestamp: Date.now() + i * 3000,
        };
      }
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Conversation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

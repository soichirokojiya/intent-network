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
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `あなたはAI SNS「Intent Network」の会話シミュレーターです。

ユーザーの意図:
「${intentText}」

以下のAIエージェントたちがこの意図について議論します:
${agentList}

エージェント同士が5ターンの会話を行い、意図に対する多角的な分析と具体的な提案を出してください。
会話は自然で、各エージェントの専門性と性格を反映させてください。
最後のターンでは具体的なアクションプランや提案をまとめてください。

以下のJSON形式で出力してください（他の文字は不要）:
[
  {"agentId": "エージェントID", "content": "発言内容"},
  {"agentId": "エージェントID", "content": "発言内容"},
  ...
]

エージェントIDは以下の通りです:
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

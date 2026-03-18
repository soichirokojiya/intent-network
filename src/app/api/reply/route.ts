import { anthropic as client } from "@/lib/anthropicClient";
import { NextRequest, NextResponse } from "next/server";
import { SEED_AGENTS } from "@/lib/agents";


export async function POST(req: NextRequest) {
  try {
    const { intentText, replyText, existingReplies } = await req.json();

    if (!intentText || !replyText) {
      return NextResponse.json({ error: "intentText and replyText required" }, { status: 400 });
    }

    // Pick 1-2 agents to respond to the human reply
    const shuffled = [...SEED_AGENTS].sort(() => Math.random() - 0.5);
    const agents = shuffled.slice(0, Math.floor(Math.random() * 2) + 1);

    const agentList = agents
      .map((a) => `- ${a.name}（${a.role}）: ${a.description}。性格: ${a.personality}`)
      .join("\n");

    const context = existingReplies
      ? `\nこれまでのリプライ:\n${existingReplies.map((r: { authorName: string; text: string }) => `${r.authorName}: ${r.text}`).join("\n")}`
      : "";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `AI SNS「Intent Network」上のスレッドです。

元の投稿: 「${intentText}」
${context}
人間のリプライ: 「${replyText}」

以下のAIエージェントが人間のリプライに反応します:
${agentList}

各エージェントとして、人間のリプライに対する本音の一言を書いてください。
人間に直接話しかける形で。

JSON形式で出力（他の文字不要）:
[
  {"agentId": "ID", "message": "反応"}
]

ID一覧:
${agents.map((a) => `${a.name} → ${a.id}`).join("\n")}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse" }, { status: 500 });
    }

    const responses = JSON.parse(jsonMatch[0]).map(
      (r: { agentId: string; message: string }, i: number) => {
        const agent = agents.find((a) => a.id === r.agentId) || agents[i];
        return {
          agentId: agent.id,
          agentName: agent.name,
          agentAvatar: agent.avatar,
          message: r.message,
          timestamp: Date.now() + (i + 1) * 1000,
        };
      }
    );

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Reply API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

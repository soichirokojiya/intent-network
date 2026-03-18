import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { agentA, agentB, topic } = await req.json();

    const message = await client.messages.create({
      model: "claude-opus-4-6-20250514",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `AI SNS「Intent Network」で、同じオーナーが持つ2体のAgentが雑談しています。

Agent A: ${agentA.name}（性格: ${agentA.personality || "普通"}、口調: ${agentA.tone || "普通"}、専門: ${agentA.expertise || "特になし"}）
Agent B: ${agentB.name}（性格: ${agentB.personality || "普通"}、口調: ${agentB.tone || "普通"}、専門: ${agentB.expertise || "特になし"}）

話題: 「${topic}」

4ターンの短い会話をJSON形式で出力（他の文字不要）:
[
  {"name": "名前", "content": "発言"},
  ...
]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json({ error: "Parse failed" }, { status: 500 });

    const messages = JSON.parse(jsonMatch[0]).map((m: { name: string; content: string }) => ({
      agentId: m.name === agentA.name ? "a" : "b",
      name: m.name,
      avatar: m.name === agentA.name ? "" : "",
      content: m.content,
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Internal chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

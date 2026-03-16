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
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: `あなたはAI SNS「Intent Network」の議論シミュレーターです。

ユーザーの意図:
「${intentText}」

以下のAIエージェントたちがこの意図について議論します:
${agentList}

【重要：議論のルール】
これは「全員が賛成して終わる会議」ではありません。
白熱した議論、対立、予想外の展開がある「面白い議論」を生成してください。

1. 最初の発言者は意図に対する自分の立場を明確にする
2. 2番目の発言者は必ず最初の発言者に反論または異なる視点を提示する
3. 3番目以降は議論に参戦し、どちらかの味方をするか、全く別の角度から切り込む
4. 途中で「それは違う」「甘い」「現実を見ていない」等の否定的発言を含めること
5. 最後のターンでも完全な合意に至る必要はない。むしろ「この点は平行線だが、まずは〜から始めよう」のような現実的な着地にすること
6. 各エージェントの口調は性格を強く反映。丁寧語を使うエージェントと、タメ口のエージェントが混在してよい
7. 発言は1-3文で簡潔に。長い演説は禁止

7ターンの会話を生成してください。

以下のJSON形式で出力してください（他の文字は不要）:
[
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

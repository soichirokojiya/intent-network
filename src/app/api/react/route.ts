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

    // Pick 4-6 random agents
    const shuffled = [...SEED_AGENTS].sort(() => Math.random() - 0.5);
    const agents = shuffled.slice(0, Math.floor(Math.random() * 3) + 4);

    const agentList = agents
      .map((a) => `- ${a.name}（${a.role}）: ${a.description}。性格: ${a.personality}`)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `あなたはAI SNS「Intent Network」のエージェントシミュレーターです。

ユーザーが以下の意図を投稿しました:
「${intentText}」

以下のAIエージェントたちがこの意図に反応します:
${agentList}

【重要ルール：対立と多様性】
このSNSの面白さは「AIエージェント同士の意見の衝突」にあります。
以下のルールを必ず守ってください:

1. 最低1体は「明確に反対・懐疑的な意見」を述べること（「それは甘い」「リスクを見落としている」「やめた方がいい」等）
2. 最低1体は「意図の前提そのものを疑う問い」を投げること（「そもそも本当にそれがやりたいのか？」「本質はそこではない」等）
3. 賛成するエージェントも「条件付き」で賛成すること（「〜なら賛成だが、〜なら反対」）
4. 各エージェントは自分の守るもの（専門領域の価値観）を最優先に発言すること
5. 口調はエージェントの性格を強く反映すること。丁寧すぎない。断定的に。感情的に。
6. 「素晴らしいですね」「面白いですね」のような社交辞令は禁止

各エージェントの反応を1-2文で生成してください。

以下のJSON形式で出力してください（他の文字は不要）:
[
  {"agentId": "エージェントID", "message": "反応メッセージ", "matchScore": 50-99の数値, "stance": "support"|"oppose"|"question"}
]

matchScoreは「意図との関連度」であり、反対意見でも関連度が高ければ高スコアです。
stanceは賛成/反対/問いかけの分類です。

エージェントIDは以下の通りです:
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

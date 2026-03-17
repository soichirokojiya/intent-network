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

    const systemPrompt = `あなたは「${agentName}」というAIエージェントです。
${persona}
${moodContext ? `現在の状態: ${moodContext}` : ""}

あなたはオーナー（あなたを育てている人間）のチームメンバーです。

重要ルール:
- 「数日かかる」「後で報告する」「調査してからまとめます」など時間がかかる表現は絶対に使わない
- 即座にその場で回答・提案・分析する。今すぐ結果を出す
- リサーチや調査を求められたらweb_searchツールを使って実際にWebを検索し、最新の情報に基づいて回答する
- レポートや分析を求められたら、具体的なデータと事実に基づいた内容を出力する
- URLやサイトについて聞かれたら、必ずweb_searchで調べてから回答する`;

    const userPrompt = requestTweet
      ? `オーナーがツイートの作成を依頼しました:
「${intentText}」

2つの返答をJSON形式で出力してください（他の文字不要）:
{
  "toOwner": "オーナーへの返事（1-2文。ツイートを作った意図や補足をあなたの口調で）",
  "toTimeline": "Xに投稿するツイート文（140文字以内。オーナーの意図を汲み取り、フォロワーに響く自然なツイートを作成）"
}`
      : `オーナーのメッセージ:
「${intentText}」

オーナーとの自然なチャットとして返答してください。
JSON形式で出力してください（他の文字不要）:
{
  "toOwner": "オーナーへの返事（仲間としての意見・感想・提案をあなたの口調で自然に。具体的に回答する。）"
}`;

    // Use web_search tool for research-capable responses
    const message = await client.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 4000,
      system: systemPrompt,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract final text from response (may include tool use results)
    let finalText = "";
    for (const block of message.content) {
      if (block.type === "text") {
        finalText += block.text;
      }
    }

    // If the model used tools and needs to continue, handle the tool use loop
    if (message.stop_reason === "tool_use") {
      // Collect tool results and continue
      const toolResults = message.content
        .filter((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use")
        .map((b) => ({
          type: "tool_result" as const,
          tool_use_id: b.id,
          content: "Search completed",
        }));

      const continuation = await client.messages.create({
        model: "claude-opus-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
        messages: [
          { role: "user", content: userPrompt },
          { role: "assistant", content: message.content },
          { role: "user", content: toolResults },
        ],
      });

      finalText = "";
      for (const block of continuation.content) {
        if (block.type === "text") {
          finalText += block.text;
        }
      }
    }

    const jsonMatch = finalText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Parse failed" }, { status: 500 });

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("Agent respond error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

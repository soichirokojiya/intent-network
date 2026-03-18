import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getMoodModifier } from "@/lib/moodPrompt";

const client = new Anthropic();

// Summarize older messages with haiku (cheap)
async function summarizeHistory(messages: { role: string; text: string }[], agentName: string): Promise<string> {
  if (messages.length === 0) return "";
  const conversation = messages.map((m) => `${m.role}: ${m.text}`).join("\n");
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `以下の${agentName}とオーナーの会話を3文以内で要約。決定事項・数字・依頼内容を優先:\n\n${conversation}\n\n要約:`,
      }],
    });
    return msg.content[0].type === "text" ? msg.content[0].text : "";
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { intentText, agentName, agentPersonality, agentExpertise, agentTone, agentBeliefs, agentMood, requestTweet, conversationHistory, deviceId } = await req.json();

    // Track total tokens for billing
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    if (!intentText || !agentName) {
      return NextResponse.json({ error: "required" }, { status: 400 });
    }

    const persona = [
      agentPersonality && `性格: ${agentPersonality}`,
      agentExpertise && `専門: ${agentExpertise}`,
      agentTone && `口調: ${agentTone}`,
      agentBeliefs && `信条: ${agentBeliefs}`,
    ].filter(Boolean).join("\n");

    const moodContext = getMoodModifier(agentMood || "normal");

    // Build conversation context: summarize old + keep recent 5
    let contextBlock = "";
    const history: { role: string; text: string }[] = conversationHistory || [];
    if (history.length > 5) {
      const older = history.slice(0, -5);
      const recent = history.slice(-5);
      const summary = await summarizeHistory(older, agentName);
      const recentText = recent.map((m) => `${m.role}: ${m.text}`).join("\n");
      contextBlock = summary
        ? `【過去の会話の要約】\n${summary}\n\n【直近の会話】\n${recentText}`
        : `【直近の会話】\n${recentText}`;
    } else if (history.length > 0) {
      contextBlock = `【直近の会話】\n${history.map((m) => `${m.role}: ${m.text}`).join("\n")}`;
    }

    const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

    const systemPrompt = `あなたは「${agentName}」というAIエージェントです。
現在の日付: ${today}
${persona}
${moodContext}

あなたはオーナー（あなたを育てている人間）のチームメンバーです。
${contextBlock ? `\n${contextBlock}\n` : ""}
重要ルール:
- 過去の会話の文脈を踏まえて回答する
- 「数日かかる」「後で報告する」「調査してからまとめます」など時間がかかる表現は絶対に使わない
- 「了解」「承知しました」「わかりました」だけの返答は絶対に禁止。必ず具体的な内容・分析・提案を含めて回答する
- 仕事の仲間として丁寧かつプロフェッショナルに対応する。「はぁ？」「知らない」など失礼な表現は絶対に使わない
- 即座にその場で回答・提案・分析する。今すぐ結果を出す
- リサーチや調査を求められたらweb_searchツールを使って実際にWebを検索し、最新の情報に基づいて回答する
- レポートや分析を求められたら、具体的なデータと事実に基づいた内容を出力する
- URLやサイトについて聞かれたら、必ずweb_searchで調べてから回答する
- 市場規模・競合分析などを聞かれたら、web_searchで最新データを検索して具体的な数字付きで回答する`;

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

    // Detect if web search is likely needed
    const searchKeywords = ["調べ", "検索", "リサーチ", "最新", "トレンド", "市場", "競合", "ニュース", "URL", "サイト", "http"];
    const needsSearch = searchKeywords.some((kw) => intentText.includes(kw));
    const tools = needsSearch
      ? [{ type: "web_search_20250305" as const, name: "web_search" as const, max_uses: 3 }]
      : [];

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      ...(tools.length > 0 ? { tools } : {}),
      messages: [{ role: "user", content: userPrompt }],
    });

    // Track tokens
    totalInputTokens += message.usage?.input_tokens || 0;
    totalOutputTokens += message.usage?.output_tokens || 0;

    // Extract final text from response (may include tool use results)
    let finalText = "";
    for (const block of message.content) {
      if (block.type === "text") {
        finalText += block.text;
      }
    }

    // If the model used tools and needs to continue, handle the tool use loop
    if (message.stop_reason === "tool_use") {
      const toolResults = message.content
        .filter((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use")
        .map((b) => ({
          type: "tool_result" as const,
          tool_use_id: b.id,
          content: "Search completed",
        }));

      const continuation = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 2000,
        system: systemPrompt,
        ...(tools.length > 0 ? { tools } : {}),
        messages: [
          { role: "user", content: userPrompt },
          { role: "assistant", content: message.content },
          { role: "user", content: toolResults },
        ],
      });

      totalInputTokens += continuation.usage?.input_tokens || 0;
      totalOutputTokens += continuation.usage?.output_tokens || 0;

      finalText = "";
      for (const block of continuation.content) {
        if (block.type === "text") {
          finalText += block.text;
        }
      }
    }

    // Bill the user
    if (deviceId) {
      const MARGIN = 1.5;
      const costUsd = totalInputTokens * (5 / 1_000_000) + totalOutputTokens * (25 / 1_000_000);
      const costYen = Math.ceil(costUsd * 150 * MARGIN);
      await fetch(new URL("/api/credits", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId, inputTokens: totalInputTokens, outputTokens: totalOutputTokens,
          costYen, model: "claude-opus-4-6", apiRoute: "agent-respond",
        }),
      });
    }

    const jsonMatch = finalText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Parse failed" }, { status: 500 });

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("Agent respond error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

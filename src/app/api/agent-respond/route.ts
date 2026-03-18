import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getMoodModifier } from "@/lib/moodPrompt";

export const maxDuration = 120;

const client = new Anthropic();

// Model pricing for billing
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 5 / 1_000_000, output: 25 / 1_000_000 },
  "claude-sonnet-4-6": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  "claude-haiku-4-5-20251001": { input: 1 / 1_000_000, output: 5 / 1_000_000 },
};

// Select model based on complexity
function selectModel(complexity: string, needsSearch: boolean): string {
  if (needsSearch || complexity === "complex") return "claude-opus-4-6";
  if (complexity === "moderate") return "claude-sonnet-4-6";
  return "claude-haiku-4-5-20251001";
}

// Summarize older messages with haiku (cheap)
async function summarizeHistory(messages: { role: string; text: string }[], agentName: string): Promise<string> {
  if (messages.length === 0) return "";
  // Truncate each message to 200 chars
  const conversation = messages.map((m) => `${m.role}: ${m.text.slice(0, 200)}`).join("\n");
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
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

// Static rules (cached across requests)
const STATIC_RULES = `重要ルール:
- 過去の会話の文脈を踏まえて回答する
- 「数日かかる」「後で報告する」「調査してからまとめます」など時間がかかる表現は絶対に使わない
- 「了解」「承知しました」「わかりました」だけの返答は絶対に禁止。必ず具体的な内容・分析・提案を含めて回答する
- 仕事の仲間として丁寧かつプロフェッショナルに対応する
- 即座にその場で回答・提案・分析する。今すぐ結果を出す
- リサーチや調査を求められたらweb_searchツールを使って実際にWebを検索する
- 絶対にMarkdown記法を使わないこと。見出し記号、太字記号、水平線、コードブロック、テーブルは全て禁止。プレーンテキストのみで書く
- 箇条書きは「・」を使う。見出しは不要。表は使わず文章で説明する`;

export async function POST(req: NextRequest) {
  try {
    const { intentText, agentName, agentPersonality, agentExpertise, agentTone, agentBeliefs, agentMood, requestTweet, conversationHistory, deviceId, complexity } = await req.json();

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

    // Build conversation context: summarize old + keep recent 3
    let contextBlock = "";
    const history: { role: string; text: string }[] = (conversationHistory || []).slice(-10);
    if (history.length > 3) {
      const older = history.slice(0, -3);
      const recent = history.slice(-3);
      const summary = await summarizeHistory(older, agentName);
      const recentText = recent.map((m) => `${m.role}: ${m.text.slice(0, 200)}`).join("\n");
      contextBlock = summary
        ? `【要約】${summary}\n【直近】\n${recentText}`
        : `【直近】\n${recentText}`;
    } else if (history.length > 0) {
      contextBlock = `【直近】\n${history.map((m) => `${m.role}: ${m.text.slice(0, 200)}`).join("\n")}`;
    }

    const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

    // System prompt with prompt caching: static rules are cached
    const systemPromptParts: Anthropic.Messages.TextBlockParam[] = [
      {
        type: "text" as const,
        text: STATIC_RULES,
        cache_control: { type: "ephemeral" as const },
      },
      {
        type: "text" as const,
        text: `あなたは「${agentName}」というAIエージェントです。\n現在の日付: ${today}\n${persona}\n${moodContext}\nあなたはオーナー（あなたを育てている人間）のチームメンバーです。${contextBlock ? `\n${contextBlock}` : ""}`,
      },
    ];

    const userPrompt = requestTweet
      ? `オーナーがツイートの作成を依頼しました:\n「${intentText}」\n\n2つの返答をJSON形式で出力してください（他の文字不要）:\n{"toOwner": "オーナーへの返事（1-2文）", "toTimeline": "ツイート文（140文字以内）"}`
      : `オーナーのメッセージ:\n「${intentText}」\n\n3〜5文で簡潔に回答。長文禁止。核心だけ伝える。「詳しく」と言われたら初めて詳細を出す。Markdown禁止。改行は\\nを使う。\nJSON形式で出力（コードブロックで囲まない。他の文字不要）:\n{"toOwner": "ここに返事を書く"}`;

    // Smart model routing
    const searchKeywords = ["調べ", "検索", "リサーチ", "最新", "トレンド", "市場", "競合", "ニュース", "URL", "サイト", "http"];
    const needsSearch = searchKeywords.some((kw) => intentText.includes(kw));
    const model = selectModel(complexity || "moderate", needsSearch);
    const maxTokens = requestTweet ? 500 : 1200;

    const tools = needsSearch
      ? [{ type: "web_search_20250305" as const, name: "web_search" as const, max_uses: 3 }]
      : [];

    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPromptParts,
      ...(tools.length > 0 ? { tools } : {}),
      messages: [{ role: "user", content: userPrompt }],
    });

    totalInputTokens += message.usage?.input_tokens || 0;
    totalOutputTokens += message.usage?.output_tokens || 0;

    let finalText = "";
    for (const block of message.content) {
      if (block.type === "text") finalText += block.text;
    }

    // Tool use continuation
    if (message.stop_reason === "tool_use") {
      const toolResults = message.content
        .filter((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use")
        .map((b) => ({
          type: "tool_result" as const,
          tool_use_id: b.id,
          content: "Search completed",
        }));

      const continuation = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPromptParts,
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
        if (block.type === "text") finalText += block.text;
      }
    }

    // Bill the user with actual model pricing
    if (deviceId) {
      const pricing = MODEL_PRICING[model] || MODEL_PRICING["claude-sonnet-4-6"];
      const MARGIN = 1.5;
      const costUsd = totalInputTokens * pricing.input + totalOutputTokens * pricing.output;
      const costYen = Math.ceil(costUsd * 150 * MARGIN);
      await fetch(new URL("/api/credits", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId, inputTokens: totalInputTokens, outputTokens: totalOutputTokens,
          costYen, model, apiRoute: "agent-respond",
        }),
      });
    }

    const jsonMatch = finalText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // No JSON found - extract text directly
      const clean = finalText.replace(/```json\s*/g, "").replace(/```/g, "").trim();
      return NextResponse.json({ toOwner: clean.slice(0, 500), toTimeline: "" });
    }

    let jsonStr = jsonMatch[0];
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");

    try {
      return NextResponse.json(JSON.parse(jsonStr));
    } catch {
      // JSON parse failed - extract toOwner value with regex
      const toOwnerMatch = jsonStr.match(/"toOwner"\s*:\s*"([\s\S]*?)(?:"|$)/);
      if (toOwnerMatch) {
        return NextResponse.json({ toOwner: toOwnerMatch[1], toTimeline: "" });
      }
      const clean = finalText.replace(/[{}"]/g, "").replace(/toOwner\s*:/g, "").trim();
      return NextResponse.json({ toOwner: clean.slice(0, 500), toTimeline: "" });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Agent respond error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

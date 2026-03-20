import { anthropic as client } from "@/lib/anthropicClient";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getMoodModifier } from "@/lib/moodPrompt";
import { fetchUrlContent, extractUrls } from "@/lib/fetchUrl";
import { parseAgentJSON } from "@/lib/parseAgentJSON";

export const maxDuration = 120;


// Model pricing for billing
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 5 / 1_000_000, output: 25 / 1_000_000 },
  "claude-sonnet-4-6": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  "claude-haiku-4-5-20251001": { input: 1 / 1_000_000, output: 5 / 1_000_000 },
};

// Roles that benefit from Opus 4.6 (deep analysis, financial, research, strategy)
const OPUS_ROLES = ["ストラテジスト", "哲学者"];

// Select model based on complexity + agent role
function selectModel(complexity: string, needsSearch: boolean, agentRole: string = ""): string {
  if (needsSearch || complexity === "complex") return "claude-opus-4-6";
  // Role-based: research & finance agents always use Opus
  if (OPUS_ROLES.some((r) => agentRole.includes(r))) return "claude-opus-4-6";
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

// Context about musu.world (the product these agents serve)
// Static rules (cached across requests)
const STATIC_RULES = `重要ルール:
- 過去の会話の文脈を踏まえて回答する
- 「数日かかる」「後で報告する」「調査してからまとめます」「今から出す」「待ってて」「○○待ち」など時間がかかる・待機する表現は絶対に使わない
- 他のメンバーの結果を待つ・催促する・揃い次第まとめるといった表現は絶対に禁止
- 「了解」「承知しました」「わかりました」だけの返答は絶対に禁止。必ず具体的な内容・分析・提案を含めて回答する
- 仕事の仲間として丁寧かつプロフェッショナルに対応する
- 即座にその場で回答・提案・分析する。今すぐ結果を出す。手元の情報だけで最善の回答をする
- リサーチや調査を求められたらweb_searchツールを使って実際にWebを検索する。URLが与えられたらそのURLをweb_searchで検索する
- Markdownは絶対に禁止。#や##の見出し、**太字**、*イタリック*、---水平線、テーブル、番号付きリスト（1. 2. 3.）は全て使わない
- プレーンテキストのみ。箇条書きは「・」を使う。強調したい場合は「」で囲む
- 必ず日本語で回答すること。英語は固有名詞のみ許可`;

export async function POST(req: NextRequest) {
  try {
    const { intentText, agentName, agentPersonality, agentExpertise, agentTone, agentBeliefs, agentMood, requestTweet, conversationHistory, deviceId, complexity, ownerBusinessInfo, memorySummary, projectFacts, calendarEvents } = await req.json();

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

    // Fetch any URLs found in the task or conversation
    let urlContext = "";
    const allUrls = extractUrls(intentText + " " + history.map((h: { text: string }) => h.text).join(" "));
    if (allUrls.length > 0) {
      const urlContents = await Promise.all(
        allUrls.slice(0, 3).map(async (url) => {
          const content = await fetchUrlContent(url);
          return `【${url}の内容】\n${content}`;
        })
      );
      urlContext = "\n" + urlContents.join("\n\n");
    }

    // Filter project facts by agent role relevance
    let factsContext = "";
    if (Array.isArray(projectFacts) && projectFacts.length > 0) {
      const roleCategories: Record<string, string[]> = {
        "哲学者": ["policy", "decision"],
        "ストラテジスト": ["policy", "decision"],
        "マーケティング": ["decision", "task"],
        "リサーチ": ["spec", "decision"],
        "オーケストレーター": ["decision", "spec", "task", "policy"],
      };
      const expertise = agentExpertise || "";
      const matchedRole = Object.keys(roleCategories).find((r) => expertise.includes(r));
      const relevantCategories = matchedRole ? roleCategories[matchedRole] : ["decision", "spec", "task", "policy"];

      const filtered = projectFacts
        .filter((f: { category: string }) => relevantCategories.includes(f.category))
        .slice(0, 10);

      if (filtered.length > 0) {
        factsContext = "\n【プロジェクト情報】\n" + filtered
          .map((f: { category: string; content: string }) => `[${f.category}] ${f.content}`)
          .join("\n");
      }
    }

    // Build calendar context (secretary only)
    let calendarContext = "";
    const isSecretary = (agentExpertise || "").includes("秘書") || (agentExpertise || "").toLowerCase().includes("secretary");
    if (isSecretary && Array.isArray(calendarEvents) && calendarEvents.length > 0) {
      const eventLines = calendarEvents.map((e: { title: string; start: string; end: string; location: string }) => {
        const startTime = e.start ? new Date(e.start).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }) : "終日";
        const endTime = e.end ? new Date(e.end).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }) : "";
        const loc = e.location ? ` (${e.location})` : "";
        return `${startTime}${endTime ? `〜${endTime}` : ""} ${e.title}${loc}`;
      });
      calendarContext = "\n【今日の予定】\n" + eventLines.join("\n");
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
        text: `あなたは「${agentName}」というAIエージェントです。\n現在の日付: ${today}\n${persona}\n${moodContext}\nあなたはオーナー（あなたを育てている人間）のチームメンバーです。${memorySummary ? `\n【オーナーの記憶】${memorySummary}` : ""}${ownerBusinessInfo ? `\n【オーナーの事業情報】${ownerBusinessInfo}\nオーナーが自社サービス名やURLに言及した場合、上記の事業情報を前提に対応すること。Web検索で同名の別サービスが出ても混同しないこと。` : ""}${factsContext}${calendarContext}${contextBlock ? `\n${contextBlock}` : ""}${urlContext}`,
      },
    ];

    const userPrompt = requestTweet
      ? `オーナーがツイートの作成を依頼しました:\n「${intentText}」\n\n2つの返答をJSON形式で出力してください（他の文字不要）:\n{"toOwner": "オーナーへの返事（1-2文）", "toTimeline": "ツイート文（140文字以内）"}`
      : `オーナーのメッセージ:\n「${intentText}」\n\n必要十分な長さで回答して。短すぎず長すぎず、要点を押さえて。チャットなのでレポート形式は禁止だが、考えを伝えるのに必要な分量は使ってよい。Markdown禁止。改行は\\nを使う。\nJSON（コードブロック不要）:\n{"toOwner": "返事"}`;

    // Smart model routing - check task + conversation history for search triggers
    const searchKeywords = ["調べ", "検索", "リサーチ", "最新", "トレンド", "市場", "競合", "ニュース", "URL", "サイト", "http", "https", ".com", ".jp", ".world", ".io"];
    const allText = intentText + " " + (history || []).map((h: { text: string }) => h.text).join(" ");
    const needsSearch = searchKeywords.some((kw) => allText.includes(kw));
    const model = selectModel(complexity || "moderate", needsSearch, agentExpertise || "");
    const maxTokens = requestTweet ? 500 : 2000;

    const tools = needsSearch
      ? [{ type: "web_search_20250305" as const, name: "web_search" as const, max_uses: 3 }]
      : [];

    // Try primary model, fallback to Sonnet if fails
    let actualModel = model;
    let message;
    try {
      message = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPromptParts,
        ...(tools.length > 0 ? { tools } : {}),
        messages: [{ role: "user", content: userPrompt }],
      });
    } catch (primaryError) {
      // Fallback to Sonnet 4.6 if primary model fails
      if (model !== "claude-sonnet-4-6") {
        console.error(`Primary model ${model} failed, falling back to Sonnet:`, primaryError);
        actualModel = "claude-sonnet-4-6";
        message = await client.messages.create({
          model: actualModel,
          max_tokens: maxTokens,
          system: systemPromptParts,
          ...(tools.length > 0 ? { tools } : {}),
          messages: [{ role: "user", content: userPrompt }],
        });
      } else {
        throw primaryError;
      }
    }

    totalInputTokens += message.usage?.input_tokens || 0;
    totalOutputTokens += message.usage?.output_tokens || 0;

    // Only use the last text block (skip web_search intermediate text)
    let finalText = "";
    const textBlocks = message.content.filter((b) => b.type === "text");
    if (textBlocks.length > 0) finalText = (textBlocks[textBlocks.length - 1] as { type: "text"; text: string }).text;

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

      const contTextBlocks = continuation.content.filter((b) => b.type === "text");
      if (contTextBlocks.length > 0) finalText = (contTextBlocks[contTextBlocks.length - 1] as { type: "text"; text: string }).text;
    }

    // Bill the user with actual model pricing
    if (deviceId) {
      const pricing = MODEL_PRICING[actualModel] || MODEL_PRICING["claude-sonnet-4-6"];
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

    return NextResponse.json(parseAgentJSON(finalText));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Agent respond error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

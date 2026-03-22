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

// Select model based on complexity (Opus reserved for web search only)
function selectModel(complexity: string, needsSearch: boolean, hasCustomTools: boolean): string {
  if (needsSearch) return "claude-opus-4-6";
  if (hasCustomTools || complexity === "complex" || complexity === "moderate") return "claude-sonnet-4-6";
  return "claude-haiku-4-5-20251001";
}

// Custom tool definitions
const CUSTOM_TOOL_NAMES = ["sheets_read", "sheets_write", "sheets_create", "gmail_search", "gmail_read", "create_automation", "forget_fact"] as const;

function buildCustomTools(sheetsConnected: boolean, gmailConnected: boolean): Anthropic.Messages.Tool[] {
  const tools: Anthropic.Messages.Tool[] = [];

  if (sheetsConnected) {
    tools.push({
      name: "sheets_read",
      description: "Google スプレッドシートからデータを読み取る。spreadsheetIdはURLの/d/の後の部分。rangeは「シート名!A1:C10」形式。",
      input_schema: {
        type: "object" as const,
        properties: {
          spreadsheetId: { type: "string", description: "スプレッドシートID" },
          range: { type: "string", description: "読み取り範囲（例: Sheet1!A1:C10）" },
        },
        required: ["spreadsheetId", "range"],
      },
    });
    tools.push({
      name: "sheets_create",
      description: "新しいGoogle スプレッドシートを作成する。作成後のspreadsheetIdとURLを返す。",
      input_schema: {
        type: "object" as const,
        properties: {
          title: { type: "string", description: "スプレッドシートのタイトル" },
          sheetNames: { type: "array", items: { type: "string" }, description: "シート名の配列（省略時はSheet1）" },
        },
        required: ["title"],
      },
    });
    tools.push({
      name: "sheets_write",
      description: "Google スプレッドシートにデータを書き込む。実行前に必ずユーザーに確認すること。",
      input_schema: {
        type: "object" as const,
        properties: {
          spreadsheetId: { type: "string", description: "スプレッドシートID" },
          range: { type: "string", description: "書き込み範囲（例: Sheet1!A1:C3）" },
          values: { type: "array", items: { type: "array", items: { type: "string" } }, description: "2D array of values" },
        },
        required: ["spreadsheetId", "range", "values"],
      },
    });
  }

  // Automation tool - available when both gmail and sheets are connected
  if (sheetsConnected && gmailConnected) {
    tools.push({
      name: "create_automation",
      description: "メール受信をトリガーにスプレッドシートへの自動反映ルールを作成する。ユーザーが「〇〇のメールが来たらシートに反映して」と言った時に使う。",
      input_schema: {
        type: "object" as const,
        properties: {
          name: { type: "string", description: "自動化ルールの名前（例: 売上メール自動反映）" },
          emailQuery: { type: "string", description: "Gmail検索クエリ（例: from:shop@example.com subject:売上報告）" },
          spreadsheetId: { type: "string", description: "反映先スプレッドシートID（URLの/d/の後）。新規作成する場合はsheets_createを先に使う。" },
          sheetName: { type: "string", description: "シート名（デフォルト: Sheet1）" },
          extractPrompt: { type: "string", description: "メールからどんなデータを抽出するかの指示（例: 商品名、数量、金額を抽出）" },
        },
        required: ["name", "emailQuery", "spreadsheetId", "extractPrompt"],
      },
    });
  }

  if (gmailConnected) {
    tools.push({
      name: "gmail_search",
      description: "Gmailを検索してメール一覧を取得する。queryはGmail検索クエリ形式。",
      input_schema: {
        type: "object" as const,
        properties: {
          query: { type: "string", description: "Gmail検索クエリ（例: from:amazon subject:注文確認 after:2026/03/01）" },
          maxResults: { type: "number", description: "最大取得件数（デフォルト10）" },
        },
        required: ["query"],
      },
    });
    tools.push({
      name: "gmail_read",
      description: "特定のメールの全文を読み取る。",
      input_schema: {
        type: "object" as const,
        properties: {
          messageId: { type: "string", description: "メールID" },
        },
        required: ["messageId"],
      },
    });
  }

  // forget_fact is always available (no integration gate)
  tools.push({
    name: "forget_fact",
    description: "ユーザーが「忘れて」「もう違う」「変えた」と言った時に、該当するproject_factをsupersededにする。",
    input_schema: {
      type: "object" as const,
      properties: {
        factContent: { type: "string", description: "忘れる/無効化するファクトの内容（部分一致で検索）" },
      },
      required: ["factContent"],
    },
  });

  return tools;
}

// Execute custom tool by calling internal APIs
async function executeCustomTool(toolName: string, input: Record<string, unknown>, deviceId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://musu.world";

  try {
    switch (toolName) {
      case "sheets_read": {
        const res = await fetch(`${baseUrl}/api/google-sheets/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, spreadsheetId: input.spreadsheetId, range: input.range }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case "sheets_create": {
        const res = await fetch(`${baseUrl}/api/google-sheets/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, title: input.title, sheetNames: input.sheetNames }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case "sheets_write": {
        const res = await fetch(`${baseUrl}/api/google-sheets/write`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, spreadsheetId: input.spreadsheetId, range: input.range, values: input.values }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case "gmail_search": {
        const res = await fetch(`${baseUrl}/api/gmail/messages?deviceId=${deviceId}&query=${encodeURIComponent(input.query as string)}&maxResults=${input.maxResults || 10}`);
        const data = await res.json();
        return JSON.stringify(data);
      }
      case "gmail_read": {
        const res = await fetch(`${baseUrl}/api/gmail/messages?deviceId=${deviceId}&messageId=${input.messageId}`);
        const data = await res.json();
        return JSON.stringify(data);
      }
      case "create_automation": {
        const res = await fetch(`${baseUrl}/api/automations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId,
            name: input.name,
            triggerType: "email_match",
            triggerConfig: { query: input.emailQuery },
            actionType: "sheets_append",
            actionConfig: {
              spreadsheetId: input.spreadsheetId,
              sheetName: input.sheetName || "Sheet1",
              extractPrompt: input.extractPrompt,
            },
          }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case "forget_fact": {
        const res = await fetch(`${baseUrl}/api/project-facts`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, content: input.factContent }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err) {
    return JSON.stringify({ error: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}` });
  }
}

// Build tool_result entries for custom tool_use blocks
async function processCustomToolUses(
  toolUseBlocks: Anthropic.Messages.ToolUseBlock[],
  deviceId: string
): Promise<Anthropic.Messages.ToolResultBlockParam[]> {
  const results: Anthropic.Messages.ToolResultBlockParam[] = [];
  for (const toolUse of toolUseBlocks) {
    if ((CUSTOM_TOOL_NAMES as readonly string[]).includes(toolUse.name)) {
      const result = await executeCustomTool(toolUse.name, toolUse.input as Record<string, unknown>, deviceId);
      results.push({
        type: "tool_result" as const,
        tool_use_id: toolUse.id,
        content: result,
      });
    }
  }
  return results;
}


// Extract all input tokens including cache tokens for accurate billing
function getTotalInputTokens(usage: Anthropic.Messages.Usage | undefined): number {
  if (!usage) return 0;
  const base = usage.input_tokens || 0;
  const cacheCreation = (usage as Record<string, number>).cache_creation_input_tokens || 0;
  const cacheRead = (usage as Record<string, number>).cache_read_input_tokens || 0;
  return base + cacheCreation + cacheRead;
}

// Calculate actual input cost considering cache pricing
// cache_creation = 1.25x normal, cache_read = 0.1x normal
function getInputCost(usage: Anthropic.Messages.Usage | undefined, pricePerToken: number): number {
  if (!usage) return 0;
  const base = (usage.input_tokens || 0) * pricePerToken;
  const cacheCreation = ((usage as Record<string, number>).cache_creation_input_tokens || 0) * pricePerToken * 1.25;
  const cacheRead = ((usage as Record<string, number>).cache_read_input_tokens || 0) * pricePerToken * 0.1;
  return base + cacheCreation + cacheRead;
}

// Context about musu.world (the product these agents serve)
// Static rules (cached across requests)
const STATIC_RULES = `重要ルール:
- これはチャットである。レポートではない。回答は最大300文字。簡潔に要点だけ伝える
- 「了解」「承知」「わかった」「まとめたよ」で始めない。いきなり本題に入る
- 「〜するね」「〜しておく」「まとめておく」「調べておく」「報告する」など予告・未来形は禁止。やった結果だけ書く
- 「数日かかる」「後で報告する」「待ってて」「○○待ち」など待機表現は絶対禁止
- 他のメンバーの結果を待つ・催促する・揃い次第まとめるといった表現は絶対に禁止
- 過去の会話の文脈を踏まえて回答する
- 即座にその場で回答・提案・分析する。手元の情報だけで最善の回答をする
- リサーチや調査を求められたらweb_searchツールを使って実際にWebを検索する
- Markdownは絶対に禁止。#見出し、**太字**、*イタリック*、---、テーブルは使わない
- 番号付きリストも禁止。(1) 1. 1: エラー1: のような形式は全て使わない
- プレーンテキストのみ。箇条書きは「・」を使う。強調は「」で囲む
- 〈〉【】などの装飾括弧も使わない。シンプルに書く
- 必ず日本語で回答すること。英語は固有名詞のみ許可
- ユーザーが「忘れて」「もう違う」「その方針は変えた」等と言った場合、forget_factツールを使って該当ファクトを無効化すること

【musuアプリ情報（ユーザーに案内する時に使う）】
musuはソロプレナー向けのAIワークスペース。コンセプトは「ひとりだけど、ひとりじゃない。育てるほど、任せられる。」

ページ構成:
・ワークスペース（チャット画面）= トップページ。ここで仲間と会話する
・右側のチームパネル = 仲間の一覧。ON/OFFの切り替え、タップでプロフィール編集
・「＋仲間を追加」= チームパネルの一番下
・設定 → プロフィール = 名前・アバター・事業内容の編集
・設定 → アカウント設定 = アプリ連携・料金明細・チャージ・ヘルプへのリンク
・アプリ連携（/integrations）= 外部サービスとの接続。設定→アカウント設定→アプリ連携、またはメニューから

連携できるアプリと何ができるか:
・Gmail = メールの読み取り・検索・送信。「メールして」「最近のメール見せて」
・Googleカレンダー = 今日の予定を把握。「今日の予定は？」
・Googleスプレッドシート = 新規作成・読み取り・書き込み。「スプレッドシート作って」「このシートにデータ入れて」
・Trello = ボード・カードの確認。「タスクの状況は？」
・Notion = ファクトの自動保存
・Slack = チャンネルの読み取り・投稿
・X（Twitter）= ツイートの作成・投稿。「ツイートして」
・LINE = ログイン認証

自動化:
・「○○のメールが来たらスプレッドシートに反映して」と言えば自動化ルールを作成できる
・1時間ごとにGmailをチェックして自動でシートに追記する

使い方のコツ:
・@をつけると特定の仲間に直接話せる（例: @Mio メールして）
・メンションなしで話すと、最適な仲間が自動で対応する
・「ニュースを7時と18時に送って」「予定を毎朝8時に教えて」で定期配信を設定できる
・プロフィールに事業内容を入れると、全員があなたの事業を理解した上で動ける

料金:
・月額基本料0円。使った分だけ従量課金
・初回クレジット付き。500円からチャージ可能
・チャージは設定→アカウント設定→チャージ、またはクレジットが0になった時にチャット内に表示されるボタンから`;

export async function POST(req: NextRequest) {
  try {
    const { intentText, agentName, agentPersonality, agentExpertise, agentTone, agentBeliefs, agentMood, requestTweet, conversationHistory, deviceId, complexity, ownerBusinessInfo, memorySummary, projectFacts, calendarEvents, trelloData, gmailData, sheetsConnected, gmailConnected, stream: wantStream } = await req.json();

    if (!intentText || !agentName) {
      return NextResponse.json({ error: "required" }, { status: 400 });
    }

    // Check credit balance before calling AI
    if (deviceId) {
      const balRes = await fetch(new URL(`/api/credits?deviceId=${deviceId}`, req.url).toString());
      if (balRes.ok) {
        const balData = await balRes.json();
        if (balData.balance <= 0) {
          return NextResponse.json({ error: "insufficient_balance", balance: 0 }, { status: 402 });
        }
      }
    }

    const persona = [
      agentPersonality && `性格: ${agentPersonality}`,
      agentExpertise && `専門: ${agentExpertise}`,
      agentTone && `口調: ${agentTone}`,
      agentBeliefs && `信条: ${agentBeliefs}`,
    ].filter(Boolean).join("\n");

    const moodContext = getMoodModifier(agentMood || "normal");

    // Build conversation context: dynamic history size based on complexity
    const isSimpleQ = (complexity || "moderate") === "simple";
    const historySize = isSimpleQ ? 5 : 15;
    const historyTextLimit = isSimpleQ ? 200 : 400;
    let contextBlock = "";
    const history: { role: string; text: string }[] = (conversationHistory || []).slice(-historySize);
    if (history.length > 0) {
      contextBlock = `【直近の会話】\n${history.map((m) => `${m.role}: ${m.text.slice(0, historyTextLimit)}`).join("\n")}`;
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

    // Build calendar context (all agents)
    let calendarContext = "";
    if (Array.isArray(calendarEvents) && calendarEvents.length > 0) {
      const eventLines = calendarEvents.map((e: { title: string; start: string; end: string; location: string }) => {
        const startTime = e.start ? new Date(e.start).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }) : "終日";
        const endTime = e.end ? new Date(e.end).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }) : "";
        const loc = e.location ? ` (${e.location})` : "";
        return `${startTime}${endTime ? `〜${endTime}` : ""} ${e.title}${loc}`;
      });
      calendarContext = "\n【今日の予定】\n" + eventLines.join("\n");
    }

    // Build Trello context (all agents)
    let trelloContext = "";
    if (trelloData?.boards && Array.isArray(trelloData.boards) && trelloData.boards.length > 0) {
      const boardLines = trelloData.boards.map((b: { name: string; cards: { name: string; list: string; due: string | null }[] }) => {
        const cardLines = (b.cards || []).slice(0, 20).map((c: { name: string; list: string; due: string | null }) => {
          const due = c.due ? ` (期限: ${new Date(c.due).toLocaleDateString("ja-JP")})` : "";
          return `  [${c.list}] ${c.name}${due}`;
        });
        return `${b.name}:\n${cardLines.join("\n")}`;
      });
      trelloContext = "\n【Trelloタスク】\n" + boardLines.join("\n\n");
    }

    // Build Gmail context
    let gmailContext = "";
    if (gmailData?.messages && Array.isArray(gmailData.messages) && gmailData.messages.length > 0) {
      const mailLines = gmailData.messages.slice(0, 10).map((m: { subject: string; from: string; date: string; snippet: string }) => {
        return `From: ${m.from}\n件名: ${m.subject}\n日時: ${m.date}\n概要: ${m.snippet}`;
      });
      gmailContext = "\n【最近のメール】\n" + mailLines.join("\n---\n");
    }

    const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

    // Compress memory_summary for cost optimization (max 300 chars for simple, 600 for complex)
    const memoryLimit = isSimpleQ ? 300 : 600;
    const compressedMemory = memorySummary ? memorySummary.slice(0, memoryLimit) : "";

    // System prompt with 3-layer caching for max cache hit rate
    const sheetsWriteRule = sheetsConnected ? "\n- sheets_writeツールを使う前に、必ず書き込み内容をユーザーに提示して確認を求めること。承認を得てから実行すること。" : "";

    // Layer 1: Static rules (same for ALL users & agents → highest cache hit rate)
    const staticLayer = `${STATIC_RULES}${sheetsWriteRule}`;

    // Layer 2: Agent persona + user memory (same per agent+user combo)
    const personaLayer = `\n\nあなたは「${agentName}」というAIエージェントです。\n${persona}\n${moodContext}\nあなたはオーナー（あなたを育てている人間）のチームメンバーです。${compressedMemory ? `\n【オーナーの記憶】${compressedMemory}` : ""}${ownerBusinessInfo ? `\n【オーナーの事業情報】${ownerBusinessInfo}\nオーナーが自社サービス名やURLに言及した場合、上記の事業情報を前提に対応すること。Web検索で同名の別サービスが出ても混同しないこと。` : ""}${factsContext}`;

    const systemPromptParts: Anthropic.Messages.TextBlockParam[] = [
      {
        type: "text" as const,
        text: staticLayer,
        cache_control: { type: "ephemeral" as const },
      },
      {
        type: "text" as const,
        text: personaLayer,
        cache_control: { type: "ephemeral" as const },
      },
      {
        type: "text" as const,
        text: `現在の日付: ${today}${calendarContext}${trelloContext}${gmailContext}${contextBlock ? `\n${contextBlock}` : ""}${urlContext}`,
      },
    ];

    // Detect email send request: /mail command or keywords
    const wantsEmail = intentText.startsWith("/mail") || ["メール送", "メールを送", "メールして", "メールしたい", "メール作成", "メールを作成", "メールを書", "メールに", "メール出", "メールを出", "にメール"].some((kw) => intentText.includes(kw));
    // Detect X/Twitter post request: /post command or keywords
    const wantsPost = intentText.startsWith("/post") || ["ツイート", "投稿して", "Xに投稿", "tweetして", "ポストして"].some((kw) => intentText.includes(kw));

    // Extract image URLs from the message and build multimodal content
    const IMAGE_PATTERN = /\[ファイル: .+?\.(png|jpg|jpeg|gif|webp)\]\((.+?)\)/gi;
    const imageMatches = [...intentText.matchAll(IMAGE_PATTERN)];
    const imageUrls = imageMatches.map((m) => m[2]);
    const msgText = intentText.replace(/\[ファイル: .+?\]\(.+?\)/g, "").trim() || intentText;

    const userPromptText = wantsPost
      ? `オーナーのメッセージ:\n「${msgText}」\n\nオーナーがX（Twitter）への投稿を依頼しています。投稿文を作成してください。\nJSON（コードブロック不要）:\n{"toOwner": "投稿案を作成しました（1文）", "toTimeline": "投稿文（140文字以内、ハッシュタグ含めてOK）"}\n\n注意:\n- /post の後の内容を元に投稿文を作成する\n- 内容が曖昧でも推測して作成する。聞き返さない\n- オーナーの事業情報や文脈に合った投稿にする`
      : requestTweet
      ? `オーナーがツイートの作成を依頼しました:\n「${msgText}」\n\n2つの返答をJSON形式で出力してください（他の文字不要）:\n{"toOwner": "オーナーへの返事（1-2文）", "toTimeline": "ツイート文（140文字以内）"}`
      : wantsEmail
      ? `オーナーのメッセージ:\n「${msgText}」\n\nオーナーがメール送信を依頼しています。必ずemailAction付きのJSONを出力してください。\n件名や本文が指定されていなくても、文脈やオーナーの事業情報から推測して適切な件名・本文を自分で考えて作成すること。「教えてください」と聞き返すのは禁止。\n\nJSON（コードブロック不要）:\n{"toOwner": "メールを作成しました（1文）", "emailAction": {"to": "宛先メールアドレス", "subject": "件名", "body": "本文（ビジネスメールとして丁寧に）"}}\n\n注意:\n- 宛先が不明な場合のみtoOwnerで宛先を聞く（emailActionは含めない）\n- それ以外は必ずemailActionを含めること`
      : `オーナーのメッセージ:\n「${msgText}」${imageUrls.length > 0 ? "\n\n添付された画像の内容も確認して、返事に反映してください。" : ""}\n\nこれはチャットです。友達とLINEするくらいの感覚で、3-5文で簡潔に答えて。長文レポート禁止。前置き不要、いきなり本題。改行は\\nを使う。\nJSON（コードブロック不要）:\n{"toOwner": "返事"}`;

    // Build user message: text + images (multimodal, base64)
    const imageBlocks: Anthropic.Messages.ContentBlockParam[] = [];
    for (const url of imageUrls) {
      try {
        const imgRes = await fetch(url);
        if (imgRes.ok) {
          const buf = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buf).toString("base64");
          const contentType = imgRes.headers.get("content-type") || "image/png";
          const mediaType = contentType.split(";")[0].trim() as "image/png" | "image/jpeg" | "image/gif" | "image/webp";
          imageBlocks.push({ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } });
        }
      } catch { /* skip failed images */ }
    }
    const userPrompt: Anthropic.Messages.ContentBlockParam[] | string = imageBlocks.length > 0
      ? [...imageBlocks, { type: "text" as const, text: userPromptText }]
      : userPromptText;

    // Smart model routing - check task + conversation history for search triggers
    const searchKeywords = ["調べ", "検索", "リサーチ", "最新", "トレンド", "市場", "競合", "ニュース", "URL", "サイト", "http", "https", ".com", ".jp", ".world", ".io"];
    const allText = intentText + " " + (history || []).map((h: { text: string }) => h.text).join(" ");
    const needsSearch = searchKeywords.some((kw) => allText.includes(kw));
    const customTools = buildCustomTools(!!sheetsConnected, !!gmailConnected);
    const hasCustomTools = customTools.length > 0;
    const model = selectModel(complexity || "moderate", needsSearch, hasCustomTools);
    const maxTokens = requestTweet ? 500 : (hasCustomTools ? 1500 : 800);

    const tools: (Anthropic.Messages.Tool | { type: "web_search_20250305"; name: "web_search"; max_uses: number })[] = [
      ...(needsSearch ? [{ type: "web_search_20250305" as const, name: "web_search" as const, max_uses: 3 }] : []),
      ...customTools,
    ];

    // === STREAMING MODE ===
    if (wantStream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let actualModel = model;
            let fullText = "";
            let totalInputTokens = 0;
            let totalOutputTokens = 0;
            const allUsages: Anthropic.Messages.Usage[] = [];

            // First pass: streaming
            try {
              const stream = client.messages.stream({
                model,
                max_tokens: maxTokens,
                system: systemPromptParts,
                ...(tools.length > 0 ? { tools } : {}),
                messages: [{ role: "user", content: userPrompt }],
              });

              // Collect tool_use blocks for continuation
              let needsContinuation = false;
              const assistantContent: Anthropic.Messages.ContentBlock[] = [];

              for await (const event of stream) {
                if (event.type === "content_block_delta") {
                  const delta = event.delta;
                  if ("text" in delta && delta.text) {
                    fullText += delta.text;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: delta.text })}\n\n`));
                  }
                } else if (event.type === "content_block_start") {
                  if (event.content_block.type === "tool_use") {
                    needsContinuation = true;
                  }
                } else if (event.type === "message_delta") {
                  if (event.delta && "stop_reason" in event.delta && event.delta.stop_reason === "tool_use") {
                    needsContinuation = true;
                  }
                }
              }

              const finalMessage = await stream.finalMessage();
              assistantContent.push(...finalMessage.content);
              if (finalMessage.usage) allUsages.push(finalMessage.usage);
              totalInputTokens += getTotalInputTokens(finalMessage.usage);
              totalOutputTokens += finalMessage.usage?.output_tokens || 0;

              // Tool use continuation loop (supports multiple rounds for web_search + custom tools)
              let messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: userPrompt }];
              let currentAssistantContent = assistantContent;
              let maxToolRounds = 5;

              while (needsContinuation && maxToolRounds > 0) {
                maxToolRounds--;
                fullText = ""; // Reset - continuation will have the real answer

                // Build tool results
                const toolUseBlocks = currentAssistantContent.filter(
                  (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
                );

                // web_search tool results (handled automatically by Claude API)
                const webSearchResults = toolUseBlocks
                  .filter((b) => b.name === "web_search")
                  .map((b) => ({
                    type: "tool_result" as const,
                    tool_use_id: b.id,
                    content: "Search completed",
                  }));

                // Custom tool results (execute via internal APIs)
                const customToolResults = await processCustomToolUses(toolUseBlocks, deviceId);

                const allToolResults = [...webSearchResults, ...customToolResults];
                if (allToolResults.length === 0) break;

                messages = [
                  ...messages,
                  { role: "assistant", content: currentAssistantContent },
                  { role: "user", content: allToolResults },
                ];

                needsContinuation = false;
                currentAssistantContent = [];

                const contStream = client.messages.stream({
                  model,
                  max_tokens: maxTokens,
                  system: systemPromptParts,
                  ...(tools.length > 0 ? { tools } : {}),
                  messages,
                });

                for await (const event of contStream) {
                  if (event.type === "content_block_delta") {
                    const delta = event.delta;
                    if ("text" in delta && delta.text) {
                      fullText += delta.text;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: delta.text })}\n\n`));
                    }
                  } else if (event.type === "content_block_start") {
                    if (event.content_block.type === "tool_use") {
                      needsContinuation = true;
                    }
                  } else if (event.type === "message_delta") {
                    if (event.delta && "stop_reason" in event.delta && event.delta.stop_reason === "tool_use") {
                      needsContinuation = true;
                    }
                  }
                }

                const contFinal = await contStream.finalMessage();
                currentAssistantContent = [...contFinal.content];
                if (contFinal.usage) allUsages.push(contFinal.usage);
                totalInputTokens += getTotalInputTokens(contFinal.usage);
                totalOutputTokens += contFinal.usage?.output_tokens || 0;
              }
            } catch (primaryError) {
              if (model !== "claude-sonnet-4-6") {
                console.error(`Primary model ${model} failed, falling back to Sonnet:`, primaryError);
                actualModel = "claude-sonnet-4-6";
                fullText = "";
                const fallbackStream = client.messages.stream({
                  model: actualModel,
                  max_tokens: maxTokens,
                  system: systemPromptParts,
                  ...(tools.length > 0 ? { tools } : {}),
                  messages: [{ role: "user", content: userPrompt }],
                });
                for await (const event of fallbackStream) {
                  if (event.type === "content_block_delta") {
                    const delta = event.delta;
                    if ("text" in delta && delta.text) {
                      fullText += delta.text;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: delta.text })}\n\n`));
                    }
                  }
                }
                const fbFinal = await fallbackStream.finalMessage();
                if (fbFinal.usage) allUsages.push(fbFinal.usage);
                totalInputTokens += getTotalInputTokens(fbFinal.usage);
                totalOutputTokens += fbFinal.usage?.output_tokens || 0;
              } else {
                throw primaryError;
              }
            }

            // Bill (with cache-aware pricing)
            if (deviceId) {
              const pricing = MODEL_PRICING[actualModel] || MODEL_PRICING["claude-sonnet-4-6"];
              const MARGIN = 1.5;
              const inputCostUsd = allUsages.reduce((sum, u) => sum + getInputCost(u, pricing.input), 0);
              const costUsd = inputCostUsd + totalOutputTokens * pricing.output;
              const costYen = Math.ceil(costUsd * 150 * MARGIN);
              fetch(new URL("/api/credits", req.url).toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  deviceId, inputTokens: totalInputTokens, outputTokens: totalOutputTokens,
                  costYen, model: actualModel, apiRoute: "agent-respond",
                }),
              }).catch(() => {});
            }

            // Send final parsed result
            const parsed = parseAgentJSON(fullText);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", ...parsed })}\n\n`));
            controller.close();
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // === NON-STREAMING MODE (legacy) ===
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const allUsagesNS: Anthropic.Messages.Usage[] = [];
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

    if (message.usage) allUsagesNS.push(message.usage);
    totalInputTokens += getTotalInputTokens(message.usage);
    totalOutputTokens += message.usage?.output_tokens || 0;

    let finalText = "";
    const textBlocks = message.content.filter((b) => b.type === "text");
    if (textBlocks.length > 0) finalText = (textBlocks[textBlocks.length - 1] as { type: "text"; text: string }).text;

    // Tool use continuation loop (supports multiple rounds)
    let currentMessage = message;
    let messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: userPrompt }];
    let maxToolRounds = 5;

    while (currentMessage.stop_reason === "tool_use" && maxToolRounds > 0) {
      maxToolRounds--;

      const toolUseBlocks = currentMessage.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
      );

      // web_search tool results
      const webSearchResults = toolUseBlocks
        .filter((b) => b.name === "web_search")
        .map((b) => ({
          type: "tool_result" as const,
          tool_use_id: b.id,
          content: "Search completed",
        }));

      // Custom tool results
      const customToolResults = await processCustomToolUses(toolUseBlocks, deviceId);

      const allToolResults = [...webSearchResults, ...customToolResults];
      if (allToolResults.length === 0) break;

      messages = [
        ...messages,
        { role: "assistant", content: currentMessage.content },
        { role: "user", content: allToolResults },
      ];

      const continuation = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPromptParts,
        ...(tools.length > 0 ? { tools } : {}),
        messages,
      });

      if (continuation.usage) allUsagesNS.push(continuation.usage);
      totalInputTokens += getTotalInputTokens(continuation.usage);
      totalOutputTokens += continuation.usage?.output_tokens || 0;

      const contTextBlocks = continuation.content.filter((b) => b.type === "text");
      if (contTextBlocks.length > 0) finalText = (contTextBlocks[contTextBlocks.length - 1] as { type: "text"; text: string }).text;

      currentMessage = continuation;
    }

    if (deviceId) {
      const pricing = MODEL_PRICING[actualModel] || MODEL_PRICING["claude-sonnet-4-6"];
      const MARGIN = 1.5;
      const inputCostUsd = allUsagesNS.reduce((sum, u) => sum + getInputCost(u, pricing.input), 0);
      const costUsd = inputCostUsd + totalOutputTokens * pricing.output;
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

    const parsed = parseAgentJSON(finalText);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Agent respond error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

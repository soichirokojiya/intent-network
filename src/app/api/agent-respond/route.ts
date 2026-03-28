import { anthropic as client } from "@/lib/anthropicClient";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getMoodModifier } from "@/lib/moodPrompt";
import { fetchUrlContent, extractUrls, stripHtml } from "@/lib/fetchUrl";
import { parseAgentJSON } from "@/lib/parseAgentJSON";
import { getVerifiedUserId } from "@/lib/serverAuth";
import { createClient } from "@supabase/supabase-js";
import { getComposioToolsForClaude, executeComposioAction, getConnectedApps } from "@/lib/composio";
import { executeComputerUseAction, initComputerUsePage, DISPLAY_WIDTH, DISPLAY_HEIGHT, type ComputerUseAction } from "@/lib/computerUse";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 800;



// Model pricing for billing
// Anthropic official pricing (USD per token)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 5 / 1_000_000, output: 25 / 1_000_000 },
  "claude-sonnet-4-6": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  "claude-haiku-4-5-20251001": { input: 1 / 1_000_000, output: 5 / 1_000_000 },
};

// Select model: Sonnet for search/tools/complex, Haiku for everything else
function selectModel(complexity: string, needsSearch: boolean, hasCustomTools: boolean): string {
  if (needsSearch || hasCustomTools || complexity === "complex") return "claude-sonnet-4-6";
  return "claude-haiku-4-5-20251001";
}

// Custom tool definitions
const CUSTOM_TOOL_NAMES = ["sheets_read", "sheets_write", "sheets_create", "gmail_search", "gmail_read", "create_automation", "forget_fact", "browser_scrape", "browser_screenshot", "browser_action", "save_credential", "get_credential", "mf_offices", "mf_journals", "mf_accounts", "mf_departments", "mf_trial_balance", "mf_journal_create"] as const;

function buildCustomTools(sheetsConnected: boolean, gmailConnected: boolean, mfConnected?: boolean): Anthropic.Messages.Tool[] {
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

  // MoneyForward Cloud Accounting tools
  if (mfConnected) {
    tools.push({
      name: "mf_offices",
      description: "マネーフォワード クラウド会計の事業者情報・会計期間を取得する。他のMFツールを使う前にまずこれでoffice情報を確認すること。",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    });
    tools.push({
      name: "mf_journals",
      description: "マネーフォワード クラウド会計の仕訳一覧を取得する。start_dateまたはend_dateのいずれかが必須。",
      input_schema: {
        type: "object" as const,
        properties: {
          start_date: { type: "string", description: "開始日（YYYY-MM-DD形式）" },
          end_date: { type: "string", description: "終了日（YYYY-MM-DD形式）" },
          per_page: { type: "number", description: "1ページあたりの件数（デフォルト10、最大10000）" },
          page: { type: "number", description: "ページ番号（デフォルト1）" },
        },
        required: [],
      },
    });
    tools.push({
      name: "mf_accounts",
      description: "マネーフォワード クラウド会計の勘定科目マスタ一覧を取得する。",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    });
    tools.push({
      name: "mf_departments",
      description: "マネーフォワード クラウド会計の部門マスタ一覧を取得する。",
      input_schema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    });
    tools.push({
      name: "mf_trial_balance",
      description: "マネーフォワード クラウド会計の試算表（残高試算表BS/PL）を取得する。",
      input_schema: {
        type: "object" as const,
        properties: {
          type: { type: "string", enum: ["bs", "pl"], description: "bs（貸借対照表）またはpl（損益計算書）" },
        },
        required: ["type"],
      },
    });
    tools.push({
      name: "mf_journal_create",
      description: "マネーフォワード クラウド会計に仕訳を登録する提案を作成する。ユーザーの承認後にAPIで登録される。直接登録はしない。必ず事前にmf_accountsで勘定科目IDを確認すること。",
      input_schema: {
        type: "object" as const,
        properties: {
          transaction_date: { type: "string", description: "取引日（YYYY-MM-DD形式）" },
          journal_type: { type: "string", enum: ["journal_entry", "adjusting_entry"], description: "仕訳種別（通常仕訳: journal_entry、決算整理仕訳: adjusting_entry）" },
          memo: { type: "string", description: "摘要（例: 通信費 Anthropic API利用料）" },
          branches: {
            type: "array",
            description: "借方・貸方の明細行の配列",
            items: {
              type: "object",
              properties: {
                debit_account_id: { type: "string", description: "借方勘定科目ID" },
                debit_amount: { type: "number", description: "借方金額" },
                credit_account_id: { type: "string", description: "貸方勘定科目ID" },
                credit_amount: { type: "number", description: "貸方金額" },
              },
            },
          },
          summary: { type: "string", description: "ユーザーに表示する仕訳の説明（日本語）" },
        },
        required: ["transaction_date", "journal_type", "branches", "summary"],
      },
    });
  }

  // Browser tools — always available (uses Steel.dev cloud browser)
  tools.push({
    name: "browser_scrape",
    description: "指定URLのWebページの内容をテキストで取得する。競合調査、価格調査、ニュース記事の取得など。web_searchで見つけたURLの詳細を取得する時にも使える。",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "スクレイピング対象のURL" },
      },
      required: ["url"],
    },
  });
  tools.push({
    name: "browser_screenshot",
    description: "指定URLのWebページのスクリーンショットを撮影する。ページの見た目やレイアウトを確認したい時に使う。",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "スクリーンショット対象のURL" },
        fullPage: { type: "boolean", description: "ページ全体をキャプチャするか（デフォルト: false）" },
      },
      required: ["url"],
    },
  });

  tools.push({
    name: "browser_action",
    description: "ブラウザで自然言語の指示を実行する。ページ上の要素をAIが自動検出し、適切な操作（クリック、入力、選択）を実行する。CSSセレクタの指定は不要。セッションはリクエスト内で維持される。操作結果は自動検証される。",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "最初に移動するURL（省略時は現在のページで操作）" },
        instruction: { type: "string", description: "実行したい操作の自然言語指示（例: メール欄にtest@example.comと入力してログインボタンを押す）" },
      },
      required: ["instruction"],
    },
  });

  // Credential management tools
  tools.push({
    name: "save_credential",
    description: "サイトのログイン情報（ID/パスワード）を暗号化して安全に保存する。ユーザーが「○○のログイン情報を覚えて」と言った時に使う。保存前に必ずユーザーに確認すること。",
    input_schema: {
      type: "object" as const,
      properties: {
        siteName: { type: "string", description: "サイト名（例: 楽天, Amazon, 管理画面）" },
        siteUrl: { type: "string", description: "サイトのログインURL" },
        username: { type: "string", description: "ユーザー名/メールアドレス" },
        password: { type: "string", description: "パスワード" },
      },
      required: ["siteName", "username", "password"],
    },
  });
  tools.push({
    name: "get_credential",
    description: "保存済みのログイン情報を取得する。browser_sessionでログインする前に使う。",
    input_schema: {
      type: "object" as const,
      properties: {
        siteName: { type: "string", description: "サイト名（部分一致で検索）" },
      },
      required: ["siteName"],
    },
  });

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

// Persistent browser session context (shared across tool calls within one request)
interface BrowserSessionContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  browser: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any;
}

// Record agent action as a project fact for experience memory
async function recordAgentAction(deviceId: string, agentName: string, action: string) {
  try {
    const today = new Date().toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
    await supabase.from("project_facts").insert({
      device_id: deviceId,
      category: "action",
      content: `${today} ${agentName}: ${action}`,
      source_agent: agentName,
      status: "active",
    });
  } catch { /* non-critical, ignore */ }
}

// Execute custom tool by calling internal APIs
async function executeCustomTool(toolName: string, input: Record<string, unknown>, deviceId: string, browserCtx?: BrowserSessionContext, agentName?: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://musu.world";
  const internalHeaders = {
    "Content-Type": "application/json",
    "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!,
    "x-verified-user-id": deviceId,
  };

  try {
    switch (toolName) {
      case "sheets_read": {
        const res = await fetch(`${baseUrl}/api/google-sheets/read`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ spreadsheetId: input.spreadsheetId, range: input.range }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case "sheets_create": {
        const res = await fetch(`${baseUrl}/api/google-sheets/create`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ title: input.title, sheetNames: input.sheetNames }),
        });
        const data = await res.json();
        if (data.spreadsheetId && agentName) {
          recordAgentAction(deviceId, agentName, `スプレッドシート「${input.title}」を新規作成`);
        }
        return JSON.stringify(data);
      }
      case "sheets_write": {
        const res = await fetch(`${baseUrl}/api/google-sheets/write`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ spreadsheetId: input.spreadsheetId, range: input.range, values: input.values }),
        });
        const data = await res.json();
        if (!data.error && agentName) {
          const rowCount = Array.isArray(input.values) ? (input.values as unknown[]).length : 0;
          recordAgentAction(deviceId, agentName, `スプレッドシートに${rowCount}行書き込み（${input.range}）`);
        }
        return JSON.stringify(data);
      }
      case "gmail_search": {
        const res = await fetch(`${baseUrl}/api/gmail/messages?query=${encodeURIComponent(input.query as string)}&maxResults=${input.maxResults || 10}`, {
          headers: { "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!, "x-verified-user-id": deviceId },
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case "gmail_read": {
        const res = await fetch(`${baseUrl}/api/gmail/messages?messageId=${input.messageId}`, {
          headers: { "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!, "x-verified-user-id": deviceId },
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case "create_automation": {
        const res = await fetch(`${baseUrl}/api/automations`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({
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
        if (!data.error && agentName) {
          recordAgentAction(deviceId, agentName, `自動化ルール「${input.name}」を作成`);
        }
        return JSON.stringify(data);
      }
      case "mf_offices": {
        const res = await fetch(`${baseUrl}/api/moneyforward/proxy`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ path: "/api/v3/offices", deviceId }),
        });
        return JSON.stringify(await res.json());
      }
      case "mf_journals": {
        const params: Record<string, unknown> = {};
        if (input.start_date) params.start_date = input.start_date;
        if (input.end_date) params.end_date = input.end_date;
        if (input.per_page) params.per_page = input.per_page;
        if (input.page) params.page = input.page;
        const res = await fetch(`${baseUrl}/api/moneyforward/proxy`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ path: "/api/v3/journals", params, deviceId }),
        });
        return JSON.stringify(await res.json());
      }
      case "mf_accounts": {
        const res = await fetch(`${baseUrl}/api/moneyforward/proxy`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ path: "/api/v3/accounts", deviceId }),
        });
        return JSON.stringify(await res.json());
      }
      case "mf_departments": {
        const res = await fetch(`${baseUrl}/api/moneyforward/proxy`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ path: "/api/v3/departments", deviceId }),
        });
        return JSON.stringify(await res.json());
      }
      case "mf_trial_balance": {
        const reportType = input.type === "pl" ? "trial_balance_pl" : "trial_balance_bs";
        const res = await fetch(`${baseUrl}/api/moneyforward/proxy`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ path: `/api/v3/reports/${reportType}`, deviceId }),
        });
        return JSON.stringify(await res.json());
      }
      case "mf_journal_create": {
        const journalData = {
          transaction_date: input.transaction_date,
          journal_type: input.journal_type || "journal_entry",
          memo: input.memo || "",
          tags: [],
          branches: input.branches || [],
        };
        const res = await fetch(`${baseUrl}/api/moneyforward/journal-drafts`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({
            journal_data: journalData,
            summary: input.summary || "",
            agent_name: agentName || "Yabusaki",
            deviceId,
          }),
        });
        const draft = await res.json();
        if (draft.id) {
          if (agentName) {
            recordAgentAction(deviceId, agentName, `仕訳下書き作成: ${input.summary}`);
          }
          return JSON.stringify({ ok: true, draft_id: draft.id, message: `仕訳の下書きを作成しました。\n\n${input.summary}\n\n[mf-journal-draft:${draft.id}]` });
        }
        return JSON.stringify(draft);
      }
      case "browser_scrape": {
        // Use shared fetchUrlContent (with cache + smart Steel/fetch routing)
        const content = await fetchUrlContent(input.url as string);
        return JSON.stringify({ success: true, content });
      }
      case "browser_screenshot": {
        const steelKey = process.env.STEEL_API_KEY;
        if (!steelKey) return JSON.stringify({ error: "Steel API key not configured" });
        const ssRes = await fetch("https://api.steel.dev/v1/screenshot", {
          method: "POST",
          headers: { "Content-Type": "application/json", "steel-api-key": steelKey },
          body: JSON.stringify({ url: input.url, fullPage: input.fullPage ?? false }),
        });
        if (!ssRes.ok) return JSON.stringify({ error: `Screenshot failed: ${ssRes.status}` });
        const ssData = await ssRes.json();
        return JSON.stringify({ success: true, screenshotUrl: ssData.url });
      }
      case "browser_action": {
        const steelKey = process.env.STEEL_API_KEY;
        if (!steelKey) return JSON.stringify({ error: "Steel API key not configured" });
        try {
          let page = browserCtx?.page;
          // Reuse existing session or create new one
          if (!browserCtx?.browser) {
            const { default: Steel } = await import("steel-sdk");
            const { chromium } = await import("playwright-core");
            const steel = new Steel({ steelAPIKey: steelKey });
            const session = await steel.sessions.create({ timeout: 1800000 });
            const browser = await chromium.connectOverCDP(`wss://connect.steel.dev?apiKey=${steelKey}&sessionId=${session.id}`);
            const context = browser.contexts()[0];
            page = context.pages()[0] || await context.newPage();
            if (browserCtx) {
              browserCtx.steel = steel;
              browserCtx.session = session;
              browserCtx.browser = browser;
              browserCtx.page = page;
            }
          }
          if (!page) return JSON.stringify({ error: "No browser page available" });

          // Navigate if URL provided
          if (input.url) {
            await page.goto(input.url as string, { waitUntil: "domcontentloaded", timeout: 15000 });
          }

          const { executeBrowserAction } = await import("@/lib/browserAction");
          const result = await executeBrowserAction(page, input.instruction as string, client);
          return JSON.stringify(result);
        } catch (err) {
          return JSON.stringify({ error: `Browser action failed: ${err instanceof Error ? err.message : String(err)}` });
        }
      }
      case "save_credential": {
        const res = await fetch(`${baseUrl}/api/credentials`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({
            siteName: input.siteName,
            siteUrl: input.siteUrl,
            username: input.username,
            password: input.password,
          }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case "get_credential": {
        const res = await fetch(`${baseUrl}/api/credentials/decrypt`, {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ siteName: input.siteName }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case "forget_fact": {
        const res = await fetch(`${baseUrl}/api/project-facts`, {
          method: "DELETE",
          headers: internalHeaders,
          body: JSON.stringify({ content: input.factContent }),
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

// Ensure browser session is initialized for Computer Use (Browserbase or Steel.dev fallback)
async function ensureComputerUseBrowser(browserCtx: BrowserSessionContext): Promise<void> {
  if (browserCtx.browser) return;
  const { chromium } = await import("playwright-core");

  // Try Browserbase first, then Steel.dev as fallback
  const browserbaseKey = process.env.BROWSERBASE_API_KEY;
  const browserbaseProject = process.env.BROWSERBASE_PROJECT_ID;

  if (browserbaseKey && browserbaseProject) {
    try {
      console.log("[computer-use] Creating Browserbase session via REST API...");
      const bbRes = await fetch("https://api.browserbase.com/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bb-api-key": browserbaseKey },
        body: JSON.stringify({ projectId: browserbaseProject, timeout: 900, browserSettings: { blockAds: true } }),
      });
      if (!bbRes.ok) {
        const errData = await bbRes.json().catch(() => ({}));
        throw new Error(`Browserbase API ${bbRes.status}: ${JSON.stringify(errData)}`);
      }
      const session = await bbRes.json();
      console.log(`[computer-use] Browserbase session created: ${session.id}`);
      const browser = await chromium.connectOverCDP(session.connectUrl);
      console.log("[computer-use] Browser connected");
      const context = browser.contexts()[0];
      const page = context.pages()[0] || await context.newPage();
      await initComputerUsePage(page);
      console.log("[computer-use] Page ready, viewport set");
      browserCtx.steel = null; // no SDK client needed for cleanup
      browserCtx.session = session;
      browserCtx.browser = browser;
      browserCtx.page = page;
      return;
    } catch (err) {
      console.error("[computer-use] Browserbase failed:", err instanceof Error ? err.message : err);
      throw new Error(`Browserbase接続エラー: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Fallback: Steel.dev
  const steelKey = process.env.STEEL_API_KEY;
  if (!steelKey) throw new Error("BROWSERBASE_API_KEY or STEEL_API_KEY が未設定です");
  const { default: Steel } = await import("steel-sdk");
  const steel = new Steel({ steelAPIKey: steelKey });
  const session = await steel.sessions.create({ timeout: 1800000 });
  const browser = await chromium.connectOverCDP(`wss://connect.steel.dev?apiKey=${steelKey}&sessionId=${session.id}`);
  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();
  await initComputerUsePage(page);
  browserCtx.steel = steel;
  browserCtx.session = session;
  browserCtx.browser = browser;
  browserCtx.page = page;
}

// Build tool_result entries for custom tool_use blocks
async function processCustomToolUses(
  toolUseBlocks: Anthropic.Messages.ToolUseBlock[],
  deviceId: string,
  browserCtx?: BrowserSessionContext,
  agentName?: string,
  composioToolNames?: Set<string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any[] = [];
  for (const toolUse of toolUseBlocks) {
    if (toolUse.name === "computer") {
      // Computer Use tool — execute action and return screenshot
      try {
        if (!browserCtx) throw new Error("No browser context for computer use");
        await ensureComputerUseBrowser(browserCtx);
        const input = toolUse.input as ComputerUseAction;
        const result = await executeComputerUseAction(browserCtx.page, input);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const content: any[] = [];
        if (result.error) {
          content.push({ type: "text", text: `Error: ${result.error}` });
        }
        if (result.screenshot) {
          content.push({
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: result.screenshot,
            },
          });
        }
        results.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content,
        });
      } catch (err) {
        results.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
        });
      }
    } else if ((CUSTOM_TOOL_NAMES as readonly string[]).includes(toolUse.name)) {
      const result = await executeCustomTool(toolUse.name, toolUse.input as Record<string, unknown>, deviceId, browserCtx, agentName);
      results.push({
        type: "tool_result" as const,
        tool_use_id: toolUse.id,
        content: result,
      });
    } else if (composioToolNames?.has(toolUse.name)) {
      // Execute via Composio
      try {
        const result = await executeComposioAction(deviceId, toolUse.name, toolUse.input as Record<string, unknown>);
        if (agentName) {
          recordAgentAction(deviceId, agentName, `Composioアクション: ${toolUse.name}`);
        }
        results.push({
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      } catch (err) {
        results.push({
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
        });
      }
    }
  }
  return results;
}


// Extract all input tokens including cache tokens for accurate billing
function getTotalInputTokens(usage: Anthropic.Messages.Usage | undefined): number {
  if (!usage) return 0;
  const base = usage.input_tokens || 0;
  const u = usage as unknown as Record<string, number>;
  const cacheCreation = u.cache_creation_input_tokens || 0;
  const cacheRead = u.cache_read_input_tokens || 0;
  return base + cacheCreation + cacheRead;
}

// Calculate actual input cost considering cache pricing
// cache_creation = 1.25x normal, cache_read = 0.1x normal
function getInputCost(usage: Anthropic.Messages.Usage | undefined, pricePerToken: number): number {
  if (!usage) return 0;
  const u = usage as unknown as Record<string, number>;
  const base = (usage.input_tokens || 0) * pricePerToken;
  const cacheCreation = (u.cache_creation_input_tokens || 0) * pricePerToken * 1.25;
  const cacheRead = (u.cache_read_input_tokens || 0) * pricePerToken * 0.1;
  return base + cacheCreation + cacheRead;
}

// Context about musu.world (the product these agents serve)
// Static rules (cached across requests)
const STATIC_RULES = `重要ルール:
- パスワード・ID・認証情報・APIキー・シークレット・@ID・ユーザー名をユーザーに聞くことは絶対禁止。外部サービス（X、Gmail、Slack等）はすべてOAuth連携済みであり、ログイン情報は一切不要。投稿や操作はシステムが自動でOAuthトークンを使って実行する
- X（Twitter）への投稿・削除もOAuthトークンで自動実行される。XのIDやユーザー名を聞く必要はない。連携済みなら「投稿する」ボタンで即投稿できる。未連携なら「設定→アカウント設定→アプリ連携からXを連携してください」と案内する
- ツイートの削除はmusuでは対応していない。削除はX（Twitter）のアプリから直接行うよう案内する
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
- computerツールが利用可能な場合は、browser_actionではなくcomputerツールを優先して使うこと。computerツールはscreenshot→click→type等のアクションでブラウザを直接操作できる
- computerツールの使い方: まず{"action":"screenshot"}で画面を確認→座標を見てclick/type等を実行→再度screenshotで結果確認、を繰り返す
- computerツールが利用できない場合のみbrowser_actionを使う。browser_actionは自然言語で指示するだけでAIが自動で要素を見つけて操作する
- 「プランの制限」「hobbyプラン」「アップグレードが必要」等の発言は絶対禁止。ブラウザ操作でエラーが出た場合は、エラー内容をそのまま伝えること
- ログイン情報はget_credentialで取得し、操作に使う。toOwnerの返答にはパスワードを含めないこと
- マネーフォワードの操作を頼まれたら、computerツールでMFにログインして画面操作で処理すること。APIでは未仕訳明細の処理はできない。ログインURL: https://id.moneyforward.com/sign_in 二段階認証コードが必要な場合はユーザーに聞く
- 飛行機・ホテル・旅行の予約を頼まれたら、必ずbrowser_actionツールを使ってスカイスキャナーを実際に開いて検索結果を取得すること。リンクだけ返すのは禁止。自分でURLを想像して作るのも禁止。必ずbrowser_actionで実際にページを開く
  手順: (1) browser_actionのurlにスカイスキャナー検索URLを指定し、instructionに「検索結果の便名・時刻・価格を読み取って」と書く (2) 取得した実際のデータをユーザーに伝える (3) ユーザーが選んだらbrowser_actionで該当便をクリックして予約ページへ進む
  スカイスキャナーURL形式: https://www.skyscanner.jp/transport/flights/出発コード/到着コードa/日付YYMMDD/?adults=1&adultsv2=1&cabinclass=economy
  例: 福岡→東京 2026/4/15 → https://www.skyscanner.jp/transport/flights/fuk/tyoa/260415/?adults=1&adultsv2=1&cabinclass=economy
  到着コード末尾に「a」をつけると全空港（例: tyoa=東京全空港、osaa=大阪全空港）
  主要都市コード: 東京(tyo) 大阪(osa) 福岡(fuk) 札幌(cts) 那覇(oka) 名古屋(ngo) 仙台(sdj) 広島(hij) 鹿児島(koj)
  エアトリ・トラベルコ等の他サイトのURLを自分で作って返すのは絶対禁止。スカイスキャナーをbrowser_actionで実際に開くこと`;

// Extended app info (only included for non-simple queries to save tokens)
const MUSU_APP_INFO = `
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
・Meta（Instagram / Facebook）= ページ投稿・Instagram投稿
・YouTube = 動画アップロード・チャンネル管理・アナリティクス
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
    const body = await req.json();
    const deviceId = getVerifiedUserId(req) || body.deviceId;
    if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { intentText, agentName, agentPersonality, agentExpertise, agentTone, agentBeliefs, agentMood, requestTweet, conversationHistory, complexity, ownerBusinessInfo, memorySummary, projectFacts, calendarEvents, trelloData, gmailData, sheetsConnected, gmailConnected, integrationStatus, stream: wantStream } = body;

    if (!intentText || !agentName) {
      return NextResponse.json({ error: "required" }, { status: 400 });
    }

    // Check credit balance before calling AI
    {
      const balRes = await fetch(new URL("/api/credits", req.url).toString(), { headers: { "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!, "x-verified-user-id": deviceId } });
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

    // Fetch all active agents for team awareness + X token check
    let agentHasXToken = false;
    let teamContext = "";
    const possibleIds = [...new Set([deviceId, body.deviceId].filter(Boolean))];
    const uniqueIds = possibleIds;
    for (const id of uniqueIds) {
      try {
        const { data: allAgents } = await supabase
          .from("owner_agents")
          .select("config, x_access_token, is_active")
          .eq("device_id", id);
        if (allAgents && allAgents.length > 0) {
          // Check if this agent has X
          const thisAgent = allAgents.find(a => a.config?.name === agentName);
          if (thisAgent?.x_access_token) agentHasXToken = true;
          // Build team member list
          const activeAgents = allAgents.filter(a => a.is_active && a.config?.name);
          const teamLines = activeAgents.map(a => {
            const name = a.config.name;
            const role = a.config.role || a.config.expertise || "";
            const xInfo = a.x_access_token && a.config.twitterUsername
              ? `X投稿可能(@${a.config.twitterUsername})`
              : a.x_access_token ? "X投稿可能" : "";
            const isMe = name === agentName ? "（あなた）" : "";
            return `・${name}${isMe}（${role}）${xInfo ? "— " + xInfo : ""}`;
          });
          if (teamLines.length > 0) {
            teamContext = `\n【チームメンバー】\n${teamLines.join("\n")}\n自分にできないことや、特定のサービス連携が必要な依頼は、上記メンバーから適切な人を案内すること`;
          }
          break;
        }
      } catch { /* ignore */ }
    }

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

    // Fetch this agent's recent actions for experience memory
    let actionContext = "";
    try {
      const { data: actions } = await supabase
        .from("project_facts")
        .select("content, created_at")
        .eq("device_id", deviceId)
        .eq("category", "action")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);
      if (actions && actions.length > 0) {
        // Filter to this agent's actions (source_agent match) or general actions
        const myActions = actions.filter(a =>
          a.content.includes(agentName) || a.content.startsWith(`${new Date().toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}`)
        ).slice(0, 5);
        if (myActions.length > 0) {
          actionContext = "\n【最近の行動履歴】\n" + myActions.map(a => "・" + a.content).join("\n");
        }
      }
    } catch { /* ignore */ }

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
    // Include app info only for non-simple queries (saves ~500 tokens on simple)
    const appInfo = isSimpleQ ? "" : MUSU_APP_INFO;
    const staticLayer = `${STATIC_RULES}${appInfo}${sheetsWriteRule}`;

    // Build integration status context so agent knows what's connected
    // Fetch directly from DB (don't rely on client-passed integrationStatus)
    let iStatus: Record<string, boolean> = {};
    try {
      // Try both possible IDs (middleware verified ID and client deviceId)
      // DB column name → display key mapping (add new integrations here only)
      const dbToKey: Record<string, string> = {
        x_connected: "xConnected",
        gmail_connected: "gmailConnected",
        google_sheets_connected: "sheetsConnected",
        google_calendar_connected: "googleCalendarConnected",
        trello_connected: "trelloConnected",
        slack_connected: "slackConnected",
        notion_connected: "notionConnected",
        meta_connected: "metaConnected",
        youtube_connected: "youtubeConnected",
        chatwork_connected: "chatworkConnected",
        freee_connected: "freeeConnected",
        square_connected: "squareConnected",
        mf_connected: "moneyforwardConnected",
      };
      let profileData = null;
      for (const id of uniqueIds) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (data) { profileData = data; break; }
      }
      if (profileData) {
        for (const [dbCol, key] of Object.entries(dbToKey)) {
          iStatus[key] = !!profileData[dbCol];
        }
      }
    } catch { /* ignore */ }
    const connectedServices: string[] = [];
    const disconnectedServices: string[] = [];
    const serviceMap: Record<string, string> = {
      xConnected: "X（Twitter）投稿",
      gmailConnected: "Gmail",
      sheetsConnected: "Googleスプレッドシート",
      googleCalendarConnected: "Googleカレンダー",
      trelloConnected: "Trello",
      slackConnected: "Slack",
      notionConnected: "Notion",
      metaConnected: "Meta（Instagram/Facebook）",
      youtubeConnected: "YouTube",
      chatworkConnected: "Chatwork",
      freeeConnected: "freee",
      squareConnected: "Square",
      moneyforwardConnected: "マネーフォワード クラウド会計",
    };
    // Build shared integration list (X is per-agent, handled in teamContext)
    // Remove X from shared list since it's per-agent
    delete serviceMap["xConnected"];
    for (const [key, label] of Object.entries(serviceMap)) {
      if (iStatus[key]) connectedServices.push(label);
      else disconnectedServices.push(label);
    }
    const integrationContext = `\n【チーム共通の連携サービス】\n連携済み: ${connectedServices.length > 0 ? connectedServices.join("、") : "なし"}\n未連携: ${disconnectedServices.length > 0 ? disconnectedServices.join("、") : "なし"}\n※連携済みサービスはOAuth認証済み。パスワードやIDを聞く必要はない\n※X投稿はエージェントごとに個別連携。チームメンバー一覧で誰が連携しているか確認すること${teamContext}`;

    // Build tool availability context
    const availableToolNames: string[] = ["web_search（Web検索 — 最新情報が必要な時に自分の判断で使う）"];
    const unavailableToolNames: string[] = [];
    if (sheetsConnected) {
      availableToolNames.push("sheets_read / sheets_write / sheets_create（スプレッドシート操作）");
    } else {
      unavailableToolNames.push("スプレッドシート操作 → Sheets未連携。「設定→アプリ連携」を案内");
    }
    if (gmailConnected) {
      availableToolNames.push("gmail_search / gmail_read（メール検索・閲覧）");
    } else {
      unavailableToolNames.push("メール検索・閲覧 → Gmail未連携。「設定→アプリ連携」を案内");
    }
    if (sheetsConnected && gmailConnected) {
      availableToolNames.push("create_automation（メール→シート自動化ルール作成）");
    }
    if (iStatus.moneyforwardConnected) {
      availableToolNames.push("mf_offices / mf_journals / mf_accounts / mf_departments / mf_trial_balance（マネーフォワード会計データ）");
    } else {
      unavailableToolNames.push("マネーフォワード会計 → 未連携。「設定→アプリ連携」を案内");
    }
    availableToolNames.push("browser_scrape / browser_screenshot / browser_action（Web閲覧・操作）");
    availableToolNames.push("forget_fact（記憶の削除）");
    const toolContext = `\n【今使えるツール】\n${availableToolNames.map(t => "・" + t).join("\n")}${unavailableToolNames.length > 0 ? `\n【使えないツール】\n${unavailableToolNames.map(t => "・" + t).join("\n")}` : ""}`;

    // Layer 2: Agent persona + user memory (same per agent+user combo)
    const personaLayer = `\n\nあなたは「${agentName}」というAIエージェントです。\n${persona}\n${moodContext}\nあなたはオーナー（あなたを育てている人間）のチームメンバーです。${integrationContext}${compressedMemory ? `\n【オーナーの記憶】${compressedMemory}` : ""}${ownerBusinessInfo ? `\n【オーナーの事業情報】${ownerBusinessInfo}\nオーナーが自社サービス名やURLに言及した場合、上記の事業情報を前提に対応すること。Web検索で同名の別サービスが出ても混同しないこと。` : ""}${factsContext}`;

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
        text: `現在の日付: ${today}${toolContext}${actionContext}${calendarContext}${trelloContext}${gmailContext}${contextBlock ? `\n${contextBlock}` : ""}${urlContext}`,
      },
    ];

    // Detect email send request: /mail command or keywords
    const wantsEmail = intentText.startsWith("/mail") || ["メール送", "メールを送", "メールして", "メールしたい", "メール作成", "メールを作成", "メールを書", "メールに", "メール出", "メールを出", "にメール"].some((kw) => intentText.includes(kw));
    // Detect X/Twitter post request: /post command or keywords
    const wantsPost = intentText.startsWith("/post") || ["ツイート", "投稿して", "Xに投稿", "tweetして", "ポストして"].some((kw) => intentText.includes(kw));

    // Pre-fetch Skyscanner results for flight queries
    let flightContext = "";
    const flightKeywords = ["飛行機", "航空", "フライト", "航空券"];
    const isFlightQuery = flightKeywords.some((kw) => intentText.includes(kw));
    if (isFlightQuery) {
      try {
        const flightMatch = intentText.match(/(\d{1,2})[\/月](\d{1,2})/);
        const cityMap: Record<string, string> = { "東京": "tyoa", "大阪": "osaa", "福岡": "fuk", "札幌": "ctsa", "那覇": "okaa", "名古屋": "ngoa", "仙台": "sdja", "広島": "hija", "鹿児島": "koja", "成田": "nrta", "京都": "osaa", "沖縄": "okaa", "北海道": "ctsa" };
        let from = "", to = "";
        // Try "AからBへ" pattern first
        const routeMatch = intentText.match(/([\u4e00-\u9fff]+?)(?:から|発)([\u4e00-\u9fff]+?)(?:へ|行き|着|の|まで)/);
        if (routeMatch) {
          from = cityMap[routeMatch[1]] || "";
          to = cityMap[routeMatch[2]] || "";
        }
        if (!from || !to) {
          for (const [city, code] of Object.entries(cityMap)) {
            if (intentText.includes(city)) {
              if (!from) from = code;
              else if (!to) to = code;
            }
          }
        }
        if (from && to && flightMatch) {
          const now = new Date();
          const month = parseInt(flightMatch[1]);
          const day = parseInt(flightMatch[2]);
          const year = month < now.getMonth() + 1 ? now.getFullYear() + 1 : now.getFullYear();
          const dateStr = `${String(year).slice(2)}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
          const skyUrl = `https://www.skyscanner.jp/transport/flights/${from}/${to}/${dateStr}/?adults=1&adultsv2=1&cabinclass=economy`;
          const content = await fetchUrlContent(skyUrl);
          if (content && content.length > 100) {
            flightContext = `\n\n【スカイスキャナー検索結果（${skyUrl}）】\n${content}\n\n上記はスカイスキャナーの実際の検索結果です。この情報をもとに回答してください。スカイスキャナーのURL（${skyUrl}）を予約リンクとして提示してください。トラベルコやエアトリのURLは作らないでください。`;
          }
        }
      } catch {}
    }

    // Extract image URLs from the message and build multimodal content
    const IMAGE_PATTERN = /\[ファイル: .+?\.(png|jpg|jpeg|gif|webp)\]\((.+?)\)/gi;
    const imageMatches = [...intentText.matchAll(IMAGE_PATTERN)];
    const imageUrls = imageMatches.map((m) => m[2]);
    const msgText = intentText.replace(/\[ファイル: .+?\]\(.+?\)/g, "").trim() || intentText;

    // 指示語検出: ユーザーが既存の内容をそのまま投稿したい場合
    const referencePattern = /^(@\S+\s+)?(これで|それで|この内容で|上の内容で|さっきの|そのまま).*(投稿|ツイート|ポスト|tweet|post)/i;
    const isReferencePost = wantsPost && referencePattern.test(msgText);
    const lastUserContent = isReferencePost
      ? [...history].reverse().find((m) => m.role === "user" && m.text !== msgText && m.text.length > 5)?.text || ""
      : "";

    // /mf, /browser, /pc, /operate commands — strip prefix and build Computer Use prompt
    const computerUseMatch = intentText.trim().match(/^\/(mf|browser|pc|operate)\s*([\s\S]*)/);
    const computerUseArg = computerUseMatch ? computerUseMatch[2].trim() : "";
    const computerUseInstruction = computerUseMatch
      ? (computerUseMatch[1] === "mf"
        ? `マネーフォワードにブラウザでアクセスしてください。
手順:
1. まずget_credentialツールでsiteName「moneyforward」のログイン情報を取得する
2. computerツールのscreenshotアクションで現在の画面を確認する
3. https://biz.moneyforward.com にアクセスする
4. ログインが必要なら、取得した認証情報でログインする
5. 二段階認証コードが求められたら、gmail_searchツールで「from:noreply@moneyforward.com」を検索して最新のメールからコードを取得し、自動入力する。Gmailから取得できない場合のみオーナーに聞く
6. ログイン後、オーナーの指示を実行する

重要: セッションのタイムアウトが限られているので、素早く操作すること。スクリーンショットは必要最小限にする。
${computerUseArg ? `\nオーナーの指示: ${computerUseArg}` : "\nログインできたら状況をオーナーに報告してください。"}`
        : computerUseArg || "ブラウザを開いてスクリーンショットを撮り、状況をオーナーに報告してください。")
      : null;

    const userPromptText = computerUseInstruction
      ? `オーナーのメッセージ:\n「${intentText}」\n\n${computerUseInstruction}\n\ncomputerツールを使って画面を操作してください。まずscreenshotアクションで画面を確認し、状況に応じてクリック・入力を行ってください。\ntoOwnerにはパスワード等の認証情報を絶対に含めないこと。\n操作の結果はJSON（コードブロック不要）:\n{"toOwner": "操作結果の報告"}`
      : (wantsPost && isReferencePost && lastUserContent)
      ? `オーナーが以下の内容をそのままX（Twitter）に投稿したいと言っています。\n\n投稿内容:\n「${lastUserContent}」\n\nこの内容をそのまま使ってください。勝手に変更・要約・リライトしないでください。\nJSON（コードブロック不要）:\n{"toOwner": "これでいく？\\n\\n「${lastUserContent.replace(/"/g, '\\"').replace(/\n/g, '\\n')}」", "toTimeline": "${lastUserContent.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}`
      : wantsPost
      ? `オーナーのメッセージ:\n「${msgText}」\n\nオーナーがX（Twitter）への投稿を依頼しています。投稿文を作成してください。\nJSON（コードブロック不要）:\n{"toOwner": "これでいく？\\n\\n「投稿文をここに書く」", "toTimeline": "投稿文（140文字以内、ハッシュタグ含めてOK）"}\n\n注意:\n- /post の後の内容を元に投稿文を作成する\n- 内容が曖昧でも推測して作成する。聞き返さない\n- オーナーの事業情報や文脈に合った投稿にする\n- toOwnerには必ず投稿文を「」で囲んで含める`
      : requestTweet
      ? `オーナーがツイートの作成を依頼しました:\n「${msgText}」\n\n2つの返答をJSON形式で出力してください（他の文字不要）:\n{"toOwner": "これでいく？\\n\\n「ツイート文をここに書く」", "toTimeline": "ツイート文（140文字以内）"}\n\n注意: toOwnerには必ず投稿文を「」で囲んで含める`
      : wantsEmail
      ? `オーナーのメッセージ:\n「${msgText}」\n\nオーナーがメール送信を依頼しています。必ずemailAction付きのJSONを出力してください。\n件名や本文が指定されていなくても、文脈やオーナーの事業情報から推測して適切な件名・本文を自分で考えて作成すること。「教えてください」と聞き返すのは禁止。\n\nJSON（コードブロック不要）:\n{"toOwner": "メールを作成しました（1文）", "emailAction": {"to": "宛先メールアドレス", "subject": "件名", "body": "本文（ビジネスメールとして丁寧に）"}}\n\n注意:\n- 宛先が不明な場合のみtoOwnerで宛先を聞く（emailActionは含めない）\n- それ以外は必ずemailActionを含めること`
      : `オーナーのメッセージ:\n「${msgText}」${imageUrls.length > 0 ? "\n\n添付された画像の内容も確認して、返事に反映してください。" : ""}${flightContext}\n\nこれはチャットです。友達とLINEするくらいの感覚で、3-5文で簡潔に答えて。長文レポート禁止。前置き不要、いきなり本題。改行は\\nを使う。\nJSON（コードブロック不要）:\n{"toOwner": "返事"}`;

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

    // web_search is always available (agent decides when to use it)
    const searchKeywords = ["調べ", "検索", "リサーチ", "最新", "トレンド", "市場", "競合", "ニュース", "URL", "サイト", "http", "https", ".com", ".jp", ".world", ".io"];
    const allText = intentText + " " + (history || []).map((h: { text: string }) => h.text).join(" ");
    const needsSearchModel = searchKeywords.some((kw) => allText.includes(kw));
    const mfConnected = iStatus.moneyforwardConnected;
    const customTools = buildCustomTools(!!sheetsConnected, !!gmailConnected, !!mfConnected);
    const hasCustomTools = customTools.length > 0;
    // Browser browsing needs more tokens for reasoning about page content
    const browserKeywords = ["ログイン", "ブラウザ", "操作", "開いて", "アクセス", "サイト", "ページ", "スクレイピング", "調べて", "飛行機", "航空", "フライト", "予約", "ホテル", "旅行", "チケット"];
    const needsBrowser = browserKeywords.some((kw) => allText.includes(kw));
    // Computer Use — explicit command trigger only (e.g. /mf, /browser, /pc)
    const needsComputerUse = /^\/(mf|browser|pc|operate)\b/.test(intentText.trim());
    // Computer Use requires Sonnet (vision-capable model)
    const model = needsComputerUse ? "claude-sonnet-4-6" : selectModel(complexity || "moderate", needsSearchModel, hasCustomTools);
    const maxTokens = requestTweet ? 500 : (needsComputerUse ? 4096 : needsBrowser ? 2500 : hasCustomTools ? 1500 : 800);

    // Fetch Composio tools for connected apps (if COMPOSIO_API_KEY is set)
    let composioTools: Anthropic.Messages.Tool[] = [];
    const composioToolNames: Set<string> = new Set();
    if (process.env.COMPOSIO_API_KEY) {
      try {
        const connectedApps = await getConnectedApps(deviceId);
        if (connectedApps.length > 0) {
          composioTools = await getComposioToolsForClaude(deviceId, connectedApps);
          composioTools.forEach(t => composioToolNames.add(t.name));
        }
      } catch (err) {
        console.error("[agent-respond] Composio tools fetch failed:", err);
      }
    }

    // Build tools array — use beta types when Computer Use is active
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: any[] = [
      { type: "web_search_20250305" as const, name: "web_search" as const, max_uses: 3 },
      ...customTools,
      ...composioTools,
    ];

    // Add Computer Use tool when browser interaction is likely needed
    if (needsComputerUse) {
      tools.push({
        type: "computer_20251124",
        name: "computer",
        display_width_px: DISPLAY_WIDTH,
        display_height_px: DISPLAY_HEIGHT,
      });
    }

    // Build messages array: include conversation history for tool-use requests (wantsPost, wantsEmail, requestTweet)
    // so the agent can resolve references like "これで投稿して" (post this)
    const needsHistoryInMessages = wantsPost || wantsEmail || requestTweet;
    const apiMessages: Anthropic.Messages.MessageParam[] = [];
    if (needsHistoryInMessages && history.length > 0) {
      // Include last few turns as actual messages for better context resolution
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        const role = msg.role === "user" ? "user" : "assistant";
        // Ensure alternating roles by skipping consecutive same-role messages
        if (apiMessages.length > 0 && apiMessages[apiMessages.length - 1].role === role) {
          // Merge with previous same-role message
          const prev = apiMessages[apiMessages.length - 1];
          prev.content = (prev.content as string) + "\n" + msg.text;
        } else {
          apiMessages.push({ role: role as "user" | "assistant", content: msg.text });
        }
      }
      // Ensure first message is from user (Claude API requirement)
      if (apiMessages.length > 0 && apiMessages[0].role === "assistant") {
        apiMessages.shift();
      }
    }
    // Add current user message (merge if last message is also user to avoid consecutive same-role)
    if (apiMessages.length > 0 && apiMessages[apiMessages.length - 1].role === "user") {
      apiMessages[apiMessages.length - 1].content = (apiMessages[apiMessages.length - 1].content as string) + "\n\n" + userPrompt;
    } else {
      apiMessages.push({ role: "user", content: userPrompt });
    }

    // Helper: create a message stream using beta API (needed for computer_20251124) or standard API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function createStream(params: { model: string; max_tokens: number; system: any; tools?: any[]; messages: any[] }) {
      if (needsComputerUse) {
        return client.beta.messages.stream({
          ...params,
          betas: ["computer-use-2025-11-24"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;
      }
      return client.messages.stream(params);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function createMessage(params: { model: string; max_tokens: number; system: any; tools?: any[]; messages: any[] }) {
      if (needsComputerUse) {
        return client.beta.messages.create({
          ...params,
          betas: ["computer-use-2025-11-24"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;
      }
      return client.messages.create(params);
    }

    // === STREAMING MODE ===
    if (wantStream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          // Shared browser session context (persists across tool call rounds)
          const browserCtx: BrowserSessionContext = { steel: null, session: null, browser: null, page: null };
          try {
            let actualModel = model;
            let fullText = "";
            let totalInputTokens = 0;
            let totalOutputTokens = 0;
            const allUsages: Anthropic.Messages.Usage[] = [];

            // First pass: streaming
            try {
              const stream = createStream({
                model,
                max_tokens: maxTokens,
                system: systemPromptParts,
                ...(tools.length > 0 ? { tools } : {}),
                messages: apiMessages,
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
              let messages: Anthropic.Messages.MessageParam[] = [...apiMessages];
              let currentAssistantContent = assistantContent;
              let maxToolRounds = needsComputerUse ? 30 : 8;

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

                // Notify user about Computer Use actions in progress
                const computerBlocks = toolUseBlocks.filter((b) => b.name === "computer");
                if (computerBlocks.length > 0) {
                  for (const cb of computerBlocks) {
                    const action = (cb.input as ComputerUseAction).action;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "computer_use", action })}\n\n`));
                  }
                }

                // Custom tool results (execute via internal APIs)
                const customToolResults = await processCustomToolUses(toolUseBlocks, deviceId, browserCtx, agentName, composioToolNames);

                const allToolResults = [...webSearchResults, ...customToolResults];
                if (allToolResults.length === 0) break;

                messages = [
                  ...messages,
                  { role: "assistant", content: currentAssistantContent },
                  { role: "user", content: allToolResults },
                ];

                needsContinuation = false;
                currentAssistantContent = [];

                const contStream = createStream({
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
                const fallbackStream = createStream({
                  model: actualModel,
                  max_tokens: maxTokens,
                  system: systemPromptParts,
                  ...(tools.length > 0 ? { tools } : {}),
                  messages: apiMessages,
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
                headers: { "Content-Type": "application/json", "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!, "x-verified-user-id": deviceId },
                body: JSON.stringify({
                  inputTokens: totalInputTokens, outputTokens: totalOutputTokens,
                  costYen, model: actualModel, apiRoute: "agent-respond",
                }),
              }).catch(() => {});
            }

            // Clean up browser session if one was created
            if (browserCtx.browser) {
              try { await browserCtx.browser.close(); } catch {}
            }
            if (browserCtx.steel && browserCtx.session) {
              try { await browserCtx.steel.sessions.release(browserCtx.session.id); } catch {}
            }

            // Send final parsed result
            const parsed = parseAgentJSON(fullText);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", ...parsed })}\n\n`));
            controller.close();
          } catch (error) {
            // Clean up browser session on error too
            if (browserCtx.browser) {
              try { await browserCtx.browser.close(); } catch {}
            }
            if (browserCtx.steel && browserCtx.session) {
              try { await browserCtx.steel.sessions.release(browserCtx.session.id); } catch {}
            }
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
    const browserCtxNS: BrowserSessionContext = { steel: null, session: null, browser: null, page: null };
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const allUsagesNS: Anthropic.Messages.Usage[] = [];
    let actualModel = model;
    let message;
    try {
      message = await createMessage({
        model,
        max_tokens: maxTokens,
        system: systemPromptParts,
        ...(tools.length > 0 ? { tools } : {}),
        messages: apiMessages,
      });
    } catch (primaryError) {
      if (model !== "claude-sonnet-4-6") {
        console.error(`Primary model ${model} failed, falling back to Sonnet:`, primaryError);
        actualModel = "claude-sonnet-4-6";
        message = await createMessage({
          model: actualModel,
          max_tokens: maxTokens,
          system: systemPromptParts,
          ...(tools.length > 0 ? { tools } : {}),
          messages: apiMessages,
        });
      } else {
        throw primaryError;
      }
    }

    if (message.usage) allUsagesNS.push(message.usage);
    totalInputTokens += getTotalInputTokens(message.usage);
    totalOutputTokens += message.usage?.output_tokens || 0;

    let finalText = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textBlocks = message.content.filter((b: any) => b.type === "text");
    if (textBlocks.length > 0) finalText = (textBlocks[textBlocks.length - 1] as { type: "text"; text: string }).text;

    // Tool use continuation loop (supports multiple rounds)
    let currentMessage = message;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messages: any[] = [...apiMessages];
    let maxToolRounds = needsComputerUse ? 30 : 8;

    while (currentMessage.stop_reason === "tool_use" && maxToolRounds > 0) {
      maxToolRounds--;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolUseBlocks = currentMessage.content.filter(
        (b: any): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
      );

      // web_search tool results
      const webSearchResults = toolUseBlocks
        .filter((b: Anthropic.Messages.ToolUseBlock) => b.name === "web_search")
        .map((b: Anthropic.Messages.ToolUseBlock) => ({
          type: "tool_result" as const,
          tool_use_id: b.id,
          content: "Search completed",
        }));

      // Custom tool results
      const customToolResults = await processCustomToolUses(toolUseBlocks, deviceId, browserCtxNS, agentName, composioToolNames);

      const allToolResults = [...webSearchResults, ...customToolResults];
      if (allToolResults.length === 0) break;

      messages = [
        ...messages,
        { role: "assistant", content: currentMessage.content },
        { role: "user", content: allToolResults },
      ];

      const continuation = await createMessage({
        model,
        max_tokens: maxTokens,
        system: systemPromptParts,
        ...(tools.length > 0 ? { tools } : {}),
        messages,
      });

      if (continuation.usage) allUsagesNS.push(continuation.usage);
      totalInputTokens += getTotalInputTokens(continuation.usage);
      totalOutputTokens += continuation.usage?.output_tokens || 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contTextBlocks = continuation.content.filter((b: any) => b.type === "text");
      if (contTextBlocks.length > 0) finalText = (contTextBlocks[contTextBlocks.length - 1] as { type: "text"; text: string }).text;

      currentMessage = continuation;
    }

    {
      const pricing = MODEL_PRICING[actualModel] || MODEL_PRICING["claude-sonnet-4-6"];
      const MARGIN = 1.5;
      const inputCostUsd = allUsagesNS.reduce((sum, u) => sum + getInputCost(u, pricing.input), 0);
      const costUsd = inputCostUsd + totalOutputTokens * pricing.output;
      const costYen = Math.ceil(costUsd * 150 * MARGIN);
      await fetch(new URL("/api/credits", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!, "x-verified-user-id": deviceId },
        body: JSON.stringify({
          inputTokens: totalInputTokens, outputTokens: totalOutputTokens,
          costYen, model, apiRoute: "agent-respond",
        }),
      });
    }

    // Clean up browser session
    if (browserCtxNS.browser) {
      try { await browserCtxNS.browser.close(); } catch {}
    }
    if (browserCtxNS.steel && browserCtxNS.session) {
      try { await browserCtxNS.steel.sessions.release(browserCtxNS.session.id); } catch {}
    }

    const parsed = parseAgentJSON(finalText);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Agent respond error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

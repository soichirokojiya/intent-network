import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/anthropicClient";
import { getVerifiedUserId } from "@/lib/serverAuth";

export const maxDuration = 120;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUMMARIZE_PROMPT = `あなたはAIエージェントの記憶管理システムです。以下の会話ログを読み、2つの出力を生成してください。

既存の記憶要約:
{existing_memory_summary}

既存の変遷ログ:
{existing_changelog}

新しい会話ログ:
{conversation_log}

【出力1: memory_summary】
「残すもの」の基準：
・価値観の表明（オーナーの判断基準が現れた発言）
・感情の温度が高い発言（該当する原文は最大3件まで原文のまま保持）
・意思決定とその理由（「AではなくBを選んだ。理由は〜」の構造で記録）
・事業方針やビジョンに関する発言（変遷がある場合は差分を明記）
・エージェントとの関係性の定義や変更
・未解決の問い（方針未決定の話題）

「削除するもの」の基準：
・事実確認のためだけのやりとり
・一時的な作業指示と完了報告
・雑談のうち、価値観・感情・意思決定のいずれにも該当しないもの
・既に要約済みの情報

フォーマット：
・冒頭に一文で「この期間で何が起きたか」
・カテゴリごとに分類（価値観／感情／意思決定／事業方針／関係性／未解決）
・「原文保持：」ラベルで感情の高い原文を残す
・削除した情報の概要を一文で書く

【出力2: changelog_entry】
既存の記憶要約と比較して、以下5基準に該当する「変化」があった場合のみ1行で記録：
1. 価値観の変化（「以前は○○だったが、今は△△に変わった」）
2. 重大な感情イベント（強い怒り、大きな決断、転機）
3. 意思決定の転換（方針Aから方針Bへ）
4. 事業方針・ビジョンの変更
5. エージェントとの関係性の変化

変化がなければchangelog_entryは空文字にする。
変化があれば「YYYY-MM-DD: [カテゴリ] 内容」の1行で書く。

【出力3: new_facts】
会話から新たに判明した意思決定・方針・仕様・タスクを抽出する。
既に既存の記憶要約に含まれている情報は除外する。新しいものだけ。
各factのcategoryは: decision（意思決定）, policy（方針・ルール）, spec（仕様・設計）, task（タスク・TODO）, preference（応答の好み）のいずれか。

【出力4: response_preferences】
会話の暗黙的なシグナルを読み取り、オーナーの好みをpreference factとしてnew_factsに含めてください。
明示的な指示だけでなく、行動パターンから推測してください。

抽出すべきパターン:
1. 深い関与トピック: オーナーが長く・詳しく返信しているトピックは関心が高い。「○○に強い関心を示す」と記録。
2. 無視・却下されたトピック: エージェントが提案したが、オーナーが無視・スキップ・短く却下した内容。「○○の提案には関心を示さない」と記録。
3. コミュニケーションスタイル: オーナーの書き方から検出（例: 簡潔さを好む、詳細な説明を求める、カジュアルな口調、敬語の使用など）。
4. いいねされた応答（[LIKED]マーク付き）: そのメッセージの何が良かったか分析し、「○○な応答を好む」と記録。

これらはcategory: "preference"としてnew_factsに含めること。

JSON出力（他の文字不要）:
{"memory_summary": "要約テキスト", "changelog_entry": "変遷ログの1行 or 空文字", "new_facts": [{"category": "decision", "content": "内容"}]}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const deviceId = getVerifiedUserId(req) || body.deviceId;
    if (!deviceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("memory_summary, memory_changelog, memory_updated_at")
      .eq("id", deviceId)
      .single();

    const existingMemory = profile?.memory_summary || "(なし)";
    const existingChangelog = profile?.memory_changelog || "(なし)";

    const { count: totalCount } = await supabase
      .from("owner_chats")
      .select("*", { count: "exact", head: true })
      .eq("device_id", deviceId);

    if (!totalCount || totalCount < 20) {
      return NextResponse.json({ skipped: true, reason: "not_enough_messages", count: totalCount || 0 });
    }

    const { data: recentMessages } = await supabase
      .from("owner_chats")
      .select("id, created_at")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(15);

    const oldestRecentTime = recentMessages && recentMessages.length > 0
      ? recentMessages[recentMessages.length - 1].created_at
      : null;

    if (!oldestRecentTime) {
      return NextResponse.json({ skipped: true, reason: "no_recent_messages" });
    }

    const { data: oldMessages } = await supabase
      .from("owner_chats")
      .select("type, agent_name, text, created_at, liked")
      .eq("device_id", deviceId)
      .lt("created_at", oldestRecentTime)
      .order("created_at", { ascending: true })
      .limit(200);

    if (!oldMessages || oldMessages.length < 20) {
      return NextResponse.json({ skipped: true, reason: "not_enough_old_messages", count: oldMessages?.length || 0 });
    }

    const conversationLog = oldMessages
      .map((m: { type: string; agent_name?: string; text: string; created_at: string; liked?: boolean }) => {
        const speaker = m.type === "user" ? "オーナー" : (m.agent_name || "エージェント");
        const likedTag = m.liked ? " [LIKED]" : "";
        return `[${m.created_at}] ${speaker}${likedTag}: ${m.text}`;
      })
      .join("\n");

    const prompt = SUMMARIZE_PROMPT
      .replace("{existing_memory_summary}", existingMemory)
      .replace("{existing_changelog}", existingChangelog)
      .replace("{conversation_log}", conversationLog);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    });

    // Billing
    {
      const modelUsed = "claude-haiku-4-5-20251001";
      const usage = message.usage;
      const inputTokens = (usage?.input_tokens || 0) + ((usage as unknown as Record<string, number>).cache_creation_input_tokens || 0) + ((usage as unknown as Record<string, number>).cache_read_input_tokens || 0);
      const outputTokens = usage?.output_tokens || 0;
      const pricing: Record<string, { input: number; output: number }> = {
        "claude-opus-4-6": { input: 5 / 1_000_000, output: 25 / 1_000_000 },
        "claude-sonnet-4-6": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
        "claude-haiku-4-5-20251001": { input: 1 / 1_000_000, output: 5 / 1_000_000 },
      };
      const modelPricing = pricing[modelUsed] || pricing["claude-haiku-4-5-20251001"];
      const baseCost = (usage?.input_tokens || 0) * modelPricing.input;
      const cacheCost = ((usage as unknown as Record<string, number>).cache_creation_input_tokens || 0) * modelPricing.input * 1.25
        + ((usage as unknown as Record<string, number>).cache_read_input_tokens || 0) * modelPricing.input * 0.1;
      const outputCost = outputTokens * modelPricing.output;
      const costUsd = baseCost + cacheCost + outputCost;
      const costYen = Math.ceil(costUsd * 150 * 1.5);
      if (deviceId && costYen > 0) {
        fetch(new URL("/api/credits", req.url).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!, "x-verified-user-id": deviceId },
          body: JSON.stringify({ inputTokens, outputTokens, costYen, model: modelUsed, apiRoute: "summarize-memory" }),
        }).catch(() => {});
      }
    }

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON output
    let summary = "";
    let changelogEntry = "";
    let newFacts: { category: string; content: string }[] = [];
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, "$1"));
        summary = parsed.memory_summary || "";
        changelogEntry = parsed.changelog_entry || "";
        newFacts = Array.isArray(parsed.new_facts) ? parsed.new_facts : [];
      } else {
        summary = rawText;
      }
    } catch {
      summary = rawText;
    }

    if (!summary) {
      return NextResponse.json({ error: "Empty summary generated" }, { status: 500 });
    }

    // Build updated changelog (append new entry if exists)
    const updatedChangelog = changelogEntry
      ? (existingChangelog === "(なし)" ? changelogEntry : `${existingChangelog}\n${changelogEntry}`)
      : (existingChangelog === "(なし)" ? "" : existingChangelog);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        memory_summary: summary,
        memory_changelog: updatedChangelog || null,
        memory_updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Insert new project facts (supersede old ones in same category)
    let factsInserted = 0;
    if (newFacts.length > 0) {
      const validCategories = ["decision", "spec", "task", "policy", "preference"];
      const validFacts = newFacts.filter((f) => f.category && f.content && validCategories.includes(f.category));

      for (const fact of validFacts) {
        // Supersede existing active facts in same category
        await supabase
          .from("project_facts")
          .update({ status: "superseded", updated_at: new Date().toISOString() })
          .eq("device_id", deviceId)
          .eq("category", fact.category)
          .or("status.eq.active,status.is.null");

        // Insert new fact as active
        const { error: factError } = await supabase
          .from("project_facts")
          .insert({
            device_id: deviceId,
            category: fact.category,
            content: fact.content,
            source_agent: "summarize-memory",
            status: "active",
          });
        if (!factError) {
          factsInserted++;
        }
      }
    }

    // Auto-save to Notion if connected
    let notionSaved = false;
    if (factsInserted > 0) {
      const { data: notionProfile } = await supabase
        .from("profiles")
        .select("notion_connected, notion_auto_save")
        .eq("id", deviceId)
        .single();

      if (notionProfile?.notion_connected && notionProfile?.notion_auto_save) {
        try {
          const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
          const validFacts = newFacts.filter((f: { category: string; content: string }) => f.category && f.content);
          const notionContent = validFacts
            .map((f: { category: string; content: string }) => `[${f.category}] ${f.content}`)
            .join("\n");

          const baseUrl = new URL(req.url).origin;
          const notionRes = await fetch(`${baseUrl}/api/notion/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!, "x-verified-user-id": deviceId },
            body: JSON.stringify({
              title: `musu メモ - ${today}`,
              content: notionContent,
            }),
          });
          notionSaved = notionRes.ok;
        } catch { /* ignore */ }
      }
    }

    return NextResponse.json({ ok: true, summaryLength: summary.length, hasChangelog: !!changelogEntry, factsInserted, notionSaved });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("summarize-memory error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/anthropicClient";
import { NextResponse } from "next/server";

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://musu.world";

    // Fetch all enabled automations
    const { data: automations } = await supabase
      .from("automations")
      .select("*")
      .eq("enabled", true);

    if (!automations || automations.length === 0) {
      return NextResponse.json({ processed: 0, skipped: 0, errors: 0, total: 0 });
    }

    let processed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const automation of automations) {
      try {
        const deviceId = automation.device_id;
        const triggerConfig = automation.trigger_config || {};
        const actionConfig = automation.action_config || {};

        if (!triggerConfig.query) {
          skipped++;
          continue;
        }

        // Build Gmail search query with after: filter
        const afterDate = automation.last_run_at
          ? new Date(automation.last_run_at).toISOString().split("T")[0].replace(/-/g, "/")
          : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0].replace(/-/g, "/");
        const fullQuery = `${triggerConfig.query} after:${afterDate}`;

        // Search Gmail for matching emails
        const searchRes = await fetch(
          `${baseUrl}/api/gmail/messages?deviceId=${deviceId}&query=${encodeURIComponent(fullQuery)}&maxResults=20`
        );

        if (!searchRes.ok) {
          errors.push(`${automation.id}: Gmail search failed (${searchRes.status})`);
          continue;
        }

        const searchData = await searchRes.json();
        const messages = searchData.messages || [];

        if (messages.length === 0) {
          skipped++;
          continue;
        }

        // Filter out already-processed emails
        const lastEmailId = automation.last_email_id;
        const newMessages = lastEmailId
          ? messages.filter((m: { id: string }) => m.id !== lastEmailId)
          : messages;

        if (newMessages.length === 0) {
          skipped++;
          continue;
        }

        // Process each email
        const allExtractedRows: string[][] = [];
        let latestEmailId = newMessages[0].id;

        for (const msg of newMessages) {
          try {
            // Read full email content
            const readRes = await fetch(
              `${baseUrl}/api/gmail/messages?deviceId=${deviceId}&messageId=${msg.id}`
            );

            if (!readRes.ok) continue;

            const email = await readRes.json();

            // Extract data using Claude Haiku
            const extractPrompt = actionConfig.extractPrompt || "メールから商品名、数量、金額を抽出してJSON配列で返してください。";
            const response = await anthropic.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 1000,
              messages: [{
                role: "user",
                content: `以下のメール内容からデータを抽出してください。\n\n${extractPrompt}\n\nメール件名: ${email.subject}\nメール送信者: ${email.from}\nメール本文:\n${email.body}\n\n抽出結果をJSON配列で返してください（コードブロック不要）。各要素は文字列の配列（スプレッドシートの1行分）。\n例: [["商品A", "3", "1500"], ["商品B", "1", "3000"]]`
              }]
            });

            const textBlock = response.content.find((b) => b.type === "text");
            if (!textBlock || textBlock.type !== "text") continue;

            try {
              const extracted = JSON.parse(textBlock.text);
              if (Array.isArray(extracted)) {
                allExtractedRows.push(...extracted);
              }
            } catch {
              // If JSON parsing fails, skip this email
              errors.push(`${automation.id}: JSON parse failed for email ${msg.id}`);
            }
          } catch (emailErr) {
            errors.push(`${automation.id}: Email ${msg.id} processing failed: ${emailErr instanceof Error ? emailErr.message : String(emailErr)}`);
          }
        }

        if (allExtractedRows.length === 0) {
          // Update last_run_at even if no data extracted
          await supabase
            .from("automations")
            .update({
              last_run_at: new Date().toISOString(),
              last_email_id: latestEmailId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", automation.id);
          skipped++;
          continue;
        }

        // Append rows to spreadsheet
        const appendRes = await fetch(`${baseUrl}/api/google-sheets/append`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!, "x-verified-user-id": deviceId },
          body: JSON.stringify({
            spreadsheetId: actionConfig.spreadsheetId,
            range: actionConfig.sheetName || "Sheet1",
            values: allExtractedRows,
          }),
        });

        if (!appendRes.ok) {
          errors.push(`${automation.id}: Sheets append failed (${appendRes.status})`);
          continue;
        }

        // Post result to owner_chats
        const { data: agents } = await supabase
          .from("owner_agents")
          .select("id, config")
          .eq("device_id", deviceId)
          .limit(10);

        if (agents && agents.length > 0) {
          const agentConfig = automation.agent_id
            ? agents.find((a) => a.id === automation.agent_id)?.config
            : agents[0]?.config;

          await supabase.from("owner_chats").insert({
            device_id: deviceId,
            user_id: deviceId,
            room_id: "general",
            type: "agent",
            agent_name: agentConfig?.name || "エージェント",
            agent_avatar: agentConfig?.avatar || "",
            agent_id: automation.agent_id || agents[0]?.id,
            text: `${automation.name}を実行しました。${allExtractedRows.length}件のデータをスプレッドシートに追加しました。`,
          });
        }

        // Update automation state
        await supabase
          .from("automations")
          .update({
            last_run_at: new Date().toISOString(),
            last_email_id: latestEmailId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", automation.id);

        processed++;
      } catch (err) {
        errors.push(`${automation.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      processed,
      skipped,
      errors: errors.length,
      total: automations.length,
      errorDetails: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

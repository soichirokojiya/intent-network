import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET: Load chat history
export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  const roomId = req.nextUrl.searchParams.get("roomId") || "general";
  const before = req.nextUrl.searchParams.get("before");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "30");

  if (!deviceId) return NextResponse.json([]);

  let query = supabase
    .from("owner_chats")
    .select("*")
    .eq("device_id", deviceId)
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data?.reverse() || []);
}

// POST: Save chat message
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { deviceId, roomId, type, agentId, agentName, agentAvatar, text, tweetPreview } = body;

  if (!deviceId || !text) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { error } = await supabase.from("owner_chats").insert({
    device_id: deviceId,
    user_id: deviceId,
    room_id: roomId || "general",
    type: type || "user",
    agent_id: agentId || null,
    agent_name: agentName || null,
    agent_avatar: agentAvatar || null,
    text,
    tweet_preview: tweetPreview || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Save feedback response if previous message was a feedback question
  if (type === "user" && text.length > 0) {
    (async () => {
      try {
        const { data: recentMsgs } = await supabase
          .from("owner_chats")
          .select("text, type")
          .eq("device_id", deviceId)
          .eq("room_id", roomId || "general")
          .order("created_at", { ascending: false })
          .limit(3);

        const feedbackMsg = recentMsgs?.find((m) => m.type === "agent" && m.text?.includes("[feedback]"));
        if (feedbackMsg) {
          // Determine trigger type from the question
          let triggerType = "unknown";
          if (feedbackMsg.text.includes("数日経った")) triggerType = "day3";
          else if (feedbackMsg.text.includes("1週間")) triggerType = "day7";
          else if (feedbackMsg.text.includes("1ヶ月")) triggerType = "day30";

          await supabase.from("feedback_responses").insert({
            device_id: deviceId,
            trigger_type: triggerType,
            question: feedbackMsg.text.replace("\n[feedback]", ""),
            answer: text,
          });
        }
      } catch {}
    })();
  }

  // Quick fact extraction for important messages (runs in background)
  if (type === "user" && text.length > 10) {
    (async () => {
      try {
        const importantKeywords = ["にする", "に決めた", "やめる", "変更", "方針", "ルール", "今後は", "これからは", "もうやらない", "必ず", "禁止", "廃止"];
        const hasKeyword = importantKeywords.some(kw => text.includes(kw));
        if (!hasKeyword) return;

        const { default: Anthropic } = await import("@anthropic-ai/sdk");
        const client = new Anthropic();
        const response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [{
            role: "user",
            content: `以下のメッセージに重要な意思決定・方針変更・ルール設定が含まれていますか？含まれている場合のみ、JSON配列で抽出してください。含まれていない場合は空配列[]を返してください。\n\n「${text}」\n\nJSON（コードブロック不要）:\n[{"category": "decision|policy|spec|task", "content": "抽出した内容"}]`
          }]
        });
        // Billing for instant-fact
        {
          const modelUsed = "claude-haiku-4-5-20251001";
          const usage = response.usage;
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
            const baseUrl = new URL(req.url).origin;
            fetch(`${baseUrl}/api/credits`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ deviceId, inputTokens, outputTokens, costYen, model: modelUsed, apiRoute: "instant-fact" }),
            }).catch(() => {});
          }
        }

        const textBlock = response.content.find((b: { type: string }) => b.type === "text");
        const rawText = textBlock ? (textBlock as { type: "text"; text: string }).text : "[]";
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return;
        const facts = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(facts) || facts.length === 0) return;

        const validCategories = ["decision", "spec", "task", "policy"];
        for (const fact of facts) {
          if (!fact.category || !fact.content || !validCategories.includes(fact.category)) continue;
          // Supersede old facts of same category
          await supabase
            .from("project_facts")
            .update({ status: "superseded", updated_at: new Date().toISOString() })
            .eq("device_id", deviceId)
            .eq("category", fact.category)
            .or("status.eq.active,status.is.null");
          // Insert new fact
          await supabase.from("project_facts").insert({
            device_id: deviceId,
            category: fact.category,
            content: fact.content,
            source_agent: "instant-extract",
            status: "active",
          });
        }
      } catch {}
    })();
  }

  // Trigger memory summarization in background if needed
  try {
    const { count } = await supabase
      .from("owner_chats")
      .select("*", { count: "exact", head: true })
      .eq("device_id", deviceId);

    if (count && count > 30) {
      // Check if last summary was > 1 hour ago (or never)
      const { data: profile } = await supabase
        .from("profiles")
        .select("memory_updated_at")
        .eq("id", deviceId)
        .single();

      const lastUpdated = profile?.memory_updated_at ? new Date(profile.memory_updated_at).getTime() : 0;
      const oneHourAgo = Date.now() - 3600000;

      if (lastUpdated < oneHourAgo) {
        // Fire and forget
        const baseUrl = new URL(req.url).origin;
        fetch(`${baseUrl}/api/summarize-memory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        }).catch(() => {});
      }
    }
  } catch {
    // Don't fail the main request if summarization check fails
  }

  return NextResponse.json({ ok: true });
}

// PATCH: Toggle liked status on a message
export async function PATCH(req: NextRequest) {
  const { deviceId, messageId, liked } = await req.json();
  if (!deviceId || !messageId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { error } = await supabase
    .from("owner_chats")
    .update({ liked: !!liked })
    .eq("id", messageId)
    .eq("device_id", deviceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE: Remove welcome messages (for re-running welcome sequence)
export async function DELETE(req: NextRequest) {
  const { deviceId, roomId } = await req.json();
  if (!deviceId) return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });

  await supabase
    .from("owner_chats")
    .delete()
    .eq("device_id", deviceId)
    .eq("room_id", roomId || "general")
    .like("id", "welcome-%");

  return NextResponse.json({ ok: true });
}

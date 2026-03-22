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
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, business_info, news_enabled, news_time, news_times, news_topics")
      .not("business_info", "is", null)
      .neq("business_info", "")
      .eq("news_enabled", true);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ processed: 0, total: 0 });
    }

    // Filter profiles whose configured times match the current hour
    const now = new Date();
    const currentHHMM = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" });
    const currentHour = currentHHMM.split(":")[0]; // "07", "18", etc.

    let processed = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        // Check if current hour matches any of the user's configured times
        let userTimes: string[] = [];
        if (profile.news_times) {
          try {
            userTimes = JSON.parse(profile.news_times);
          } catch {
            userTimes = [];
          }
        }
        // Fallback to legacy news_time if news_times not set
        if (userTimes.length === 0 && profile.news_time) {
          userTimes = [profile.news_time];
        }
        if (userTimes.length === 0) {
          userTimes = ["07:00"]; // default
        }
        // Check if ANY configured time matches the current hour
        const matchesCurrentHour = userTimes.some((t: string) => t.split(":")[0] === currentHour);
        if (!matchesCurrentHour) continue;

        // device_id = user ID (bindDeviceId sets this)
        const deviceId = profile.id;

        // Find user's agents from owner_agents
        const { data: agents } = await supabase
          .from("owner_agents")
          .select("id, config")
          .eq("device_id", deviceId)
          .limit(10);

        if (!agents || agents.length === 0) continue;

        // Prefer research agent, fallback to first
        const senderAgent = agents.find((a) => /リサーチ|research/i.test(a.config?.role || "")) || agents[0];

        const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
        const topicInstruction = profile.news_topics
          ? `\n\nユーザーが関心のあるトピック: ${profile.news_topics}\nこのトピックに関連するニュースを優先的に含めてください。`
          : "";

        const response = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
          messages: [{
            role: "user",
            content: `今日は${today}。Web検索で最新ニュースを探して、日本語でまとめて。\n\n事業情報: ${profile.business_info}${topicInstruction}\n\nMarkdown禁止。プレーンテキストのみ。citeタグも使わない。\n\n重要: 各ニュースには必ず実際のURLを「引用元:」として記載すること。URLが不明なニュースは掲載しない。Web検索結果に含まれるURLをそのまま使うこと。\n\n必ず以下の形式で出力すること:\n\nおはようございます。今日のニュースです。\n\n【事業関連ニュース】\n1. [タイトル]\n引用元: [実際のURL（https://で始まる完全なURL）]\n→ なぜ関係あるか（1-2文）\n\n2. [タイトル]\n引用元: [実際のURL]\n→ なぜ関係あるか（1-2文）\n\n【世界・経済・国内の主要ニュース】\n3. [タイトル]\n引用元: [実際のURL]\n→ ポイント（1文）\n\n4. [タイトル]\n引用元: [実際のURL]\n→ ポイント（1文）\n\n5. [タイトル]\n引用元: [実際のURL]\n→ ポイント（1文）`,
          }],
        });

        // Billing
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
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://musu.world";
            fetch(`${baseUrl}/api/credits`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ deviceId, inputTokens, outputTokens, costYen, model: modelUsed, apiRoute: "daily-news" }),
            }).catch(() => {});
          }
        }

        const textBlocks = response.content.filter((b) => b.type === "text");
        let newsText = textBlocks.length > 0 ? (textBlocks[textBlocks.length - 1] as { type: "text"; text: string }).text : "";
        if (!newsText) continue;

        // Convert cite tags to plain URLs: <cite source="URL">text</cite> → text (URL)
        newsText = newsText.replace(/<cite\s+source="([^"]*)"[^>]*>([\s\S]*?)<\/cite>/g, "$2 ($1)");
        // Remove any remaining cite tags
        newsText = newsText.replace(/<cite[^>]*>|<\/cite>/g, "");

        await supabase.from("owner_chats").insert({
          device_id: deviceId,
          user_id: deviceId,
          room_id: "general",
          type: "agent",
          agent_name: senderAgent.config?.name || "Sora",
          agent_avatar: senderAgent.config?.avatar || "",
          agent_id: senderAgent.id,
          text: newsText,
        });

        processed++;
      } catch (err) {
        errors.push(`${profile.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({ processed, total: profiles.length, errors: errors.length > 0 ? errors : undefined });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

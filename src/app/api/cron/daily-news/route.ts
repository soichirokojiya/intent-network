import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/anthropicClient";
import { NextResponse } from "next/server";

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all users with business_info
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, business_info")
      .not("business_info", "is", null)
      .neq("business_info", "");

    if (profileError) {
      console.error("Failed to fetch profiles:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ processed: 0, message: "No users with business info" });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        // Find the user's first agent (research-type preferred) to use as sender
        const { data: agents } = await supabase
          .from("agents")
          .select("id, name, avatar, role")
          .eq("user_id", profile.id)
          .limit(10);

        if (!agents || agents.length === 0) continue;

        // Prefer a research agent, otherwise use the first one
        const senderAgent = agents.find((a) =>
          (a.role || "").match(/リサーチ|research|Research/i)
        ) || agents[0];

        // Get device_id for this user to save chat message
        const { data: deviceRow } = await supabase
          .from("devices")
          .select("device_id")
          .eq("user_id", profile.id)
          .limit(1)
          .single();

        if (!deviceRow?.device_id) continue;

        // Generate news summary with web search
        const today = new Date().toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          tools: [
            {
              type: "web_search_20250305",
              name: "web_search",
              max_uses: 3,
            },
          ],
          messages: [
            {
              role: "user",
              content: `You are a business research assistant. Today is ${today}.

The user's business info:
${profile.business_info}

Search the web for the latest news relevant to this business. Then write a brief morning news digest in Japanese (3-5 bullet points). Focus on:
- Industry trends and news
- Competitor movements
- Relevant technology updates
- Market changes

Keep it concise and actionable. Start with a brief greeting like "おはようございます。今朝のニュースダイジェストです。" Format with bullet points.`,
            },
          ],
        });

        // Extract text from response
        const newsText = response.content
          .filter((block) => block.type === "text")
          .map((block) => {
            if (block.type === "text") return block.text;
            return "";
          })
          .join("\n")
          .trim();

        if (!newsText) continue;

        // Save as a chat message in the general room
        const messageId = `news-${Date.now()}-${profile.id.slice(0, 6)}`;
        await supabase.from("owner_chats").insert({
          id: messageId,
          device_id: deviceRow.device_id,
          room_id: "general",
          type: "agent",
          agent_name: senderAgent.name,
          agent_avatar: senderAgent.avatar || "",
          agent_id: senderAgent.id,
          text: newsText,
          timestamp: Date.now(),
        });

        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`News delivery failed for user ${profile.id}:`, msg);
        errors.push(`${profile.id}: ${msg}`);
      }
    }

    return NextResponse.json({
      processed,
      total: profiles.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Daily news error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

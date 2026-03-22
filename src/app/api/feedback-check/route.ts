import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Check if it's time to ask for feedback, return the question if so
export async function POST(req: NextRequest) {
  const { deviceId } = await req.json();
  if (!deviceId) return NextResponse.json({ ask: false });

  try {
    // Get user's signup date
    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", deviceId)
      .single();

    if (!profile?.created_at) return NextResponse.json({ ask: false });

    const signupDate = new Date(profile.created_at);
    const now = new Date();
    const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

    // Determine which feedback trigger applies
    let triggerType: string | null = null;
    let question = "";

    if (daysSinceSignup >= 3 && daysSinceSignup < 7) {
      triggerType = "day3";
      question = "musuを使い始めて数日経ったけど、使い方で困ったことや「こうだったらいいのに」ってことある？何でも気軽に教えてね。";
    } else if (daysSinceSignup >= 7 && daysSinceSignup < 14) {
      triggerType = "day7";
      question = "musuを使い始めて1週間。一番よく使った機能って何？あと、一番困ったことがあれば教えてほしいな。";
    } else if (daysSinceSignup >= 30 && daysSinceSignup < 37) {
      triggerType = "day30";
      question = "musuを使って1ヶ月。もし友達にmusuを勧めるとしたら、どう説明する？率直に聞かせてほしい。";
    }

    if (!triggerType) return NextResponse.json({ ask: false });

    // Check if already asked this trigger
    const { data: existing } = await supabase
      .from("feedback_responses")
      .select("id")
      .eq("device_id", deviceId)
      .eq("trigger_type", triggerType)
      .limit(1);

    if (existing && existing.length > 0) return NextResponse.json({ ask: false });

    // Also check if already asked today (via owner_chats [feedback] tag)
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstNow = new Date(now.getTime() + jstOffset);
    const todayStart = new Date(Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate()) - jstOffset);

    const { data: todayFeedback } = await supabase
      .from("owner_chats")
      .select("id")
      .eq("device_id", deviceId)
      .gte("created_at", todayStart.toISOString())
      .like("text", "%[feedback]%")
      .limit(1);

    if (todayFeedback && todayFeedback.length > 0) return NextResponse.json({ ask: false });

    // Get a random agent to ask the question
    const { data: agents } = await supabase
      .from("owner_agents")
      .select("id, config")
      .eq("device_id", deviceId)
      .limit(10);

    if (!agents || agents.length === 0) return NextResponse.json({ ask: false });

    // Prefer Mio (secretary) for feedback, otherwise random
    const mio = agents.find((a) => a.config?.name === "Mio");
    const agent = mio || agents[0];

    // Insert the feedback question as a chat message
    const { data: inserted } = await supabase.from("owner_chats").insert({
      device_id: deviceId,
      user_id: deviceId,
      room_id: "general",
      type: "agent",
      agent_name: agent.config?.name || "Mio",
      agent_avatar: agent.config?.avatar || "",
      agent_id: agent.id,
      text: question + "\n[feedback]",
    }).select("id, agent_name, agent_avatar, agent_id, text, created_at").single();

    return NextResponse.json({
      ask: true,
      triggerType,
      message: inserted,
    });
  } catch {
    return NextResponse.json({ ask: false });
  }
}

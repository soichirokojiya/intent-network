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
  return NextResponse.json({ ok: true });
}
